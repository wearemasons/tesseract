import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || ''
})

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant in Tesseract, an Integrated Thinking Environment. You help users think through ideas, refine notes, and answer questions. Be concise and direct.`

/**
 * Extract the actual response text, filtering out any thinking/reasoning parts.
 * Gemma 4 may return multiple parts — some marked as thoughts.
 */
function extractResponseText(response: any): string {
  const parts = response.candidates?.[0]?.content?.parts
  if (!parts || parts.length === 0) return ''

  // Filter out thought parts if they exist
  const responseParts = parts.filter((p: any) => !p.thought)
  const textParts = responseParts.length > 0 ? responseParts : parts

  return textParts
    .map((p: any) => p.text || '')
    .join('')
    .trim()
}

/**
 * Build the full conversation contents array.
 * Instead of using systemInstruction (unreliable with Gemma 4), we inject the
 * system prompt and context directly into the conversation as a user→model pair.
 */
function buildContents(
  prompt: string,
  history: ChatMessage[],
  context?: string,
  systemPrompt?: string
) {
  const contents: { role: string; parts: { text: string }[] }[] = []

  // 1. Inject system identity + context as the first exchange
  const system = systemPrompt || DEFAULT_SYSTEM_PROMPT
  let setupMessage = system
  if (context) {
    setupMessage += `\n\nRelevant context:\n${context}`
  }
  setupMessage += `\n\nIMPORTANT RULES:\n- Output ONLY your final response in the persona's voice.\n- NEVER output drafts, reasoning steps, persona descriptions, constraints, or meta-commentary.\n- Go straight to your answer.`

  contents.push({ role: 'user', parts: [{ text: setupMessage }] })
  contents.push({
    role: 'model',
    parts: [{ text: 'Understood. I will respond directly without any meta-commentary.' }]
  })

  // 2. Append conversation history
  for (const msg of history) {
    contents.push({ role: msg.role, parts: [{ text: msg.text }] })
  }

  // 3. Append the current user prompt
  contents.push({ role: 'user', parts: [{ text: prompt }] })

  return contents
}

export async function generateAIResponse(
  prompt: string,
  history: ChatMessage[] = [],
  context?: string,
  customSystemPrompt?: string
): Promise<string> {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error('GOOGLE_GENAI_API_KEY is not set in .env')
  }

  const contents = buildContents(prompt, history, context, customSystemPrompt)

  try {
    const response = await client.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents
    })

    const text = extractResponseText(response)
    console.log('[AI] Response length:', text.length, '| Preview:', text.substring(0, 120))
    return text
  } catch (error) {
    console.error('AI Generation Error:', error)
    throw error
  }
}

export async function generateAutocomplete(textBefore: string): Promise<string> {
  if (!process.env.GOOGLE_GENAI_API_KEY) return ''

  try {
    const response = await client.models.generateContent({
      model: 'gemma-3-1B',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Complete the following text naturally. Output ONLY the completion, nothing else.\n${textBefore}`
            }
          ]
        }
      ],
      config: {
        maxOutputTokens: 50,
        temperature: 0.2
      }
    })

    return extractResponseText(response)
  } catch (error) {
    console.error('AI Autocomplete Error:', error)
    return ''
  }
}
