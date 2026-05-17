import 'dotenv/config'

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const MAIN_MODEL = 'gemini-3.1-flash-lite'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant in Tesseract, an Integrated Thinking Environment. Tesseract is the graduation project of the Mason team: Seif Zakaria, Omar Adel, Beshoy Mahrous, and Boles Sa'ad. Help users think through ideas, refine notes, and answer questions. Be concise and direct.`

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toGoogleContents(messages: { role: string; content: string }[]) {
  const systemMsgs = messages.filter((m) => m.role === 'system')
  const rest = messages.filter((m) => m.role !== 'system')

  const contents = rest.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const systemInstruction =
    systemMsgs.length > 0
      ? { parts: systemMsgs.map((m) => ({ text: m.content })) }
      : undefined

  return { contents, systemInstruction }
}

async function zenChat(
  messages: { role: string; content: string }[],
  options?: { maxTokens?: number; temperature?: number; model?: string }
): Promise<string> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY
  if (!apiKey) {
    throw new Error('OPENCODE_ZEN_API_KEY is not set in .env')
  }

  const model = options?.model ?? MAIN_MODEL
  const url = `${GOOGLE_API_BASE}/${model}:generateContent?key=${apiKey}`
  const { contents, systemInstruction } = toGoogleContents(messages)

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7
      }
    }
    if (systemInstruction) {
      body.systemInstruction = systemInstruction
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (response.ok) {
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      const result = text?.trim()
      if (!result) {
        console.warn('[zenChat] Empty content. Response:', JSON.stringify(data).slice(0, 500))
        // try to extract from reasoning
        const reasoning = data.candidates?.[0]?.content?.parts?.find(
          (p: { text?: string; reasoning?: string }) => p.reasoning
        )
        if (reasoning?.reasoning) {
          console.info('[zenChat] Using reasoning fallback')
          return reasoning.reasoning.trim()
        }
      }
      return result || ''
    }

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 500
      console.warn(
        `[zenChat] Rate limited (429). Retrying in ${Math.round(delay)}ms (attempt ${attempt}/${MAX_RETRIES})`
      )
      await sleep(delay)
      continue
    }

    const error = await response.text()
    throw new Error(`Google AI API error (${response.status}): ${error}`)
  }

  throw lastError ?? new Error('zenChat: exceeded max retries')
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
      { maxTokens: 4096, temperature: 0.2, model: 'gemini-3.1-flash-lite' }
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
