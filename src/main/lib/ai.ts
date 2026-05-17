import 'dotenv/config'

const ZEN_API_URL = 'https://opencode.ai/zen/v1/chat/completions'
// const MAIN_MODEL = 'big-pickle'
const MAIN_MODEL = 'big-pickle'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant in Tesseract, an Integrated Thinking Environment. Tesseract is the graduation project of the Mason team: Seif Zakaria, Omar Adel, Beshoy Mahrous, and Boles Sa'ad. Help users think through ideas, refine notes, and answer questions. Be concise and direct.`

async function zenChat(
  messages: { role: string; content: string }[],
  options?: { maxTokens?: number; temperature?: number; model?: string }
): Promise<string> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY
  if (!apiKey) {
    throw new Error('OPENCODE_ZEN_API_KEY is not set in .env')
  }

  const response = await fetch(ZEN_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options?.model ?? MAIN_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Zen API error (${response.status}): ${error}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]?.message
  let result = choice?.content?.trim()
  if (!result) {
    const reasoning = choice?.reasoning_content?.trim()
    if (reasoning) {
      console.info('[zenChat] Using reasoning_content fallback')
      result = reasoning
    } else {
      console.warn('[zenChat] Empty content. Model response:', JSON.stringify(data).slice(0, 500))
    }
  }
  return result || ''
}

export async function generateAIResponse(
  prompt: string,
  history: ChatMessage[] = [],
  context?: string,
  customSystemPrompt?: string
): Promise<string> {
  const system = customSystemPrompt || DEFAULT_SYSTEM_PROMPT
  let systemContent = system
  if (context) {
    systemContent += `\n\nRelevant context:\n${context}`
  }
  systemContent += `\n\nIMPORTANT RULES:\n- Output ONLY your final response in the persona's voice.\n- NEVER output drafts, reasoning steps, persona descriptions, constraints, or meta-commentary.\n- Go straight to your answer.`

  const messages: { role: string; content: string }[] = [{ role: 'system', content: systemContent }]

  for (const msg of history) {
    messages.push({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.text
    })
  }

  if (prompt) {
    messages.push({ role: 'user', content: prompt })
  }

  try {
    const text = await zenChat(messages)
    console.info('[AI] Response length:', text.length, '| Preview:', text.substring(0, 120))
    return text
  } catch (error) {
    console.error('AI Generation Error:', error)
    throw error
  }
}

export async function generateAutocomplete(textBefore: string): Promise<string> {
  if (!process.env.OPENCODE_ZEN_API_KEY) {
    console.warn('[Autocomplete] No API key configured')
    return ''
  }

  try {
    const lines = textBefore.split('\n')
    const lastLine = lines.pop() || ''
    const recentContext = lines.slice(-10).join('\n')

    console.info('[Autocomplete] Context lines:', lines.length, '| Cursor line:', lastLine)
    const text = await zenChat(
      [
        {
          role: 'system',
          content:
            'You are a text completion engine. First reason step by step about what comes next. Then output your final completion on a new line starting with exactly "CONTINUATION:" followed by the completion text.'
        },
        {
          role: 'user',
          content: recentContext ? `${recentContext}\n${lastLine}` : lastLine
        }
      ],
      { maxTokens: 4096, temperature: 0.2, model: 'big-pickle' }
    )
    const match = text?.match(/CONTINUATION:(.+)/s)
    const result = match?.[1]?.trim() || text?.trim() || ''
    console.info('[Autocomplete] zenChat returned:', result ? result.substring(0, 80) : '(empty)')
    return result
  } catch (error) {
    console.error('[Autocomplete] Error in main process:', error)
    return ''
  }
}
