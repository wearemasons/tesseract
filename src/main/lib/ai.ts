import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-flash-lite-latest'
const MAX_RETRIES = 5

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getAI(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set in .env')
  }
  return new GoogleGenAI({ apiKey })
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant in Tesseract, an Integrated Thinking Environment. Tesseract is the graduation project of the Mason team: Seif Zakaria, Omar Adel, Beshoy Mahrous, and Boles Sa'ad. Help users think through ideas, refine notes, and answer questions. Be concise and direct.`

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

async function geminiChat(
  messages: { role: string; content: string }[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const ai = getAI()

  let lastError: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const systemMessage = messages.find((m) => m.role === 'system')
      const nonSystemMessages = messages.filter((m) => m.role !== 'system')

      const config: Record<string, unknown> = {
        maxOutputTokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7
      }
      if (systemMessage) {
        config.systemInstruction = { parts: [{ text: systemMessage.content }] }
      }

      const contents = nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }]
      }))

      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config
      })

      lastError = null
      const text = response.text
      if (!text) {
        // Only log at debug/info level since empty responses are common for autocompletion
        console.info('[geminiChat] Empty response text (finishReason: STOP)')
        return ''
      }
      return text.trim()
    } catch (error) {
      if ((error as { status?: number }).status === 429 && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30_000)
        console.warn(
          `[geminiChat] Rate limited (429). Retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`
        )
        await sleep(delay)
        lastError = error as Error
        continue
      }
      throw error
    }
  }

  throw lastError || new Error('Gemini API request failed after retries')
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
  } else {
    messages.push({ role: 'user', content: 'Apply the context provided above.' })
  }

  try {
    const text = await geminiChat(messages)
    console.info('[AI] Response length:', text.length, '| Preview:', text.substring(0, 120))
    return text
  } catch (error) {
    console.error('AI Generation Error:', error)
    throw error
  }
}

export async function generateAutocomplete(textBefore: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('[Autocomplete] No API key configured')
    return ''
  }

  try {
    const lines = textBefore.split('\n')
    const lastLine = lines.pop() || ''
    const recentContext = lines.slice(-10).join('\n')

    console.info('[Autocomplete] Context lines:', lines.length, '| Cursor line:', lastLine)
    const text = await geminiChat(
      [
        {
          role: 'system',
          content:
            'You are a text completion engine. Output only the completion text that naturally continues from the given context. Do not include any explanation or preamble.'
        },
        {
          role: 'user',
          content: recentContext ? `${recentContext}\n${lastLine}` : lastLine
        }
      ],
      { maxTokens: 4096, temperature: 0.2 }
    )
    const result = text?.trim() || ''
    console.info(
      '[Autocomplete] geminiChat returned:',
      result ? result.substring(0, 80) : '(empty)'
    )
    return result
  } catch (error) {
    console.error('[Autocomplete] Error in main process:', error)
    return ''
  }
}
