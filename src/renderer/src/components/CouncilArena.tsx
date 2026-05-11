import { useAtomValue, useAtom } from 'jotai'
import {
  selectedNoteAtom,
  councilMessagesAtom,
  CouncilPersona,
  CouncilMessage
} from '@renderer/store'
import { persistCouncilMessage } from '@renderer/store/sessionStorage'
import { cn } from '@renderer/utils'
import { useState, useRef, useEffect } from 'react'
import { CommandInput } from './CommandInput'
import { PERSONA_PROMPTS, resolveNoteReferences } from '@renderer/utils/ai'
import { LuUsers, LuLoader } from 'react-icons/lu'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Shimmer } from './ai/shimmer'

const personaStyles: Record<CouncilPersona, { name: string; color: string; bg: string }> = {
  visionary: {
    name: 'The Visionary',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  skeptic: {
    name: 'The Skeptic',
    color: 'text-muted-foreground',
    bg: 'bg-muted/50'
  },
  pragmatist: {
    name: 'The Pragmatist',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  synthesizer: {
    name: 'The Synthesizer',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
  },
  user: {
    name: 'Judge',
    color: 'text-primary',
    bg: 'bg-primary/10'
  }
}

const ChatMessage = ({ message }: { message: CouncilMessage }) => {
  const style = personaStyles[message.persona]
  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2',
        style.bg
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('font-bold text-sm', style.color)}>{style.name}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
        {message.persona !== 'user' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Build a multi-turn history from council messages for a specific persona.
 * All user messages become 'user' role, and all persona messages (regardless of which persona)
 * become 'model' role so the API sees the full conversation flow.
 */
function buildHistoryForPersona(messages: CouncilMessage[]) {
  return messages.map((msg) => ({
    role: msg.persona === 'user' ? ('user' as const) : ('model' as const),
    text:
      msg.persona === 'user' ? msg.content : `[${personaStyles[msg.persona].name}]: ${msg.content}`
  }))
}

export const CouncilArena = () => {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const [messages, setMessages] = useAtom(councilMessagesAtom)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // We need a ref to track messages during async operations (setMessages is async)
  const messagesRef = useRef<CouncilMessage[]>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (persona: CouncilPersona, content: string) => {
    const newMsg: CouncilMessage = {
      id: Math.random().toString(36).substr(2, 9),
      persona,
      content,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, newMsg])
    messagesRef.current = [...messagesRef.current, newMsg]
    persistCouncilMessage(persona, content)
    return newMsg
  }

  const handleSend = async (text: string) => {
    if (isLoading) return
    addMessage('user', text)
    setIsLoading(true)

    console.info('[CouncilArena] Handling send for text:', text)

    try {
      console.info('[CouncilArena] Resolving note references...')
      const { cleanText, context: refContext, referencedTitles } = await resolveNoteReferences(text)
      console.info('[CouncilArena] Resolved refContext length:', refContext.length)
      console.info('[CouncilArena] Referenced titles:', referencedTitles)

      let fullContext = ''
      if (refContext) {
        fullContext += `\n\n[REFERENCED NOTES - YOUR RESPONSE MUST BE ABOUT THIS CONTENT]:\n${refContext}`
      }
      if (selectedNote?.content) {
        fullContext += `\n\n[Currently Open Note (Background Topic)]:\n${selectedNote.content}`
      }

      if (cleanText.startsWith('/debate')) {
        const userTopic = cleanText.replace('/debate', '').trim()
        // Use referenced note titles as the topic if available, otherwise fall back
        const topic =
          userTopic ||
          (referencedTitles.length > 0
            ? referencedTitles.join(', ')
            : selectedNote?.title || 'this idea')
        await runDebate(topic, fullContext)
      } else if (cleanText.startsWith('/summarize')) {
        await runSinglePersona(
          'pragmatist',
          'Summarize the current discussion into a concise, actionable conclusion.',
          fullContext
        )
      } else if (cleanText.startsWith('/brainstorm')) {
        await runSinglePersona(
          'visionary',
          `Brainstorm 5 creative and wild possibilities for: ${cleanText.replace('/brainstorm', '')}`,
          fullContext
        )
      } else if (cleanText.startsWith('/critique')) {
        await runSinglePersona(
          'skeptic',
          `Identify all potential failure points and risks for: ${cleanText.replace('/critique', '')}`,
          fullContext
        )
      } else if (cleanText.startsWith('/resolve')) {
        await runDebate(
          'Coming to a final resolution',
          fullContext,
          'Focus on reaching a consensus.'
        )
      } else {
        // Default: Pragmatist answers
        await runSinglePersona('pragmatist', cleanText, fullContext)
      }
    } catch (error) {
      console.error('[CouncilArena] Error in handleSend:', error)
      const errorMsg = error instanceof Error ? error.message : 'Please check your API key.'
      addMessage(
        'pragmatist',
        `I apologize, Judge. My connection to the higher planes is currently severed. ${errorMsg}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const runSinglePersona = async (persona: CouncilPersona, prompt: string, context: string) => {
    const systemPrompt = PERSONA_PROMPTS[persona as keyof typeof PERSONA_PROMPTS]
    const history = buildHistoryForPersona(messagesRef.current)
    const response = await window.context.generateAIResponse(prompt, history, context, systemPrompt)
    addMessage(persona, response)
  }

  const runDebate = async (topic: string, context: string, extraInstruction = '') => {
    const debaters: CouncilPersona[] = ['visionary', 'skeptic', 'pragmatist']
    const rounds = 3

    const roundPrompts = [
      `Debate the following topic: "${topic}". Base your response on the referenced note content provided above. ${extraInstruction}\nState your opening position.`,
      `Continue the debate on "${topic}". Respond directly to what the other council members said — challenge, support, or build on their points.`,
      `Final round on "${topic}". Give your concluding stance, acknowledging the strongest counter-arguments from the other members.`
    ]

    for (let round = 0; round < rounds; round++) {
      // Track each debater's output this round for the Synthesizer
      const roundOutputs: Record<string, string> = {}

      // 1. Run the three debaters
      for (const persona of debaters) {
        const systemPrompt = PERSONA_PROMPTS[persona as keyof typeof PERSONA_PROMPTS]
        const history = buildHistoryForPersona(messagesRef.current)
        const response = await window.context.generateAIResponse(
          roundPrompts[round],
          history,
          context,
          systemPrompt
        )
        roundOutputs[persona] = response
        addMessage(persona, response)
        await new Promise((r) => setTimeout(r, 300))
      }

      // 2. Fire the Synthesizer reactively — it gets the three outputs injected
      const synthContext = `${context}\n\nThe other voices have already spoken this round:\nVISIONARY: ${roundOutputs.visionary}\nSKEPTIC: ${roundOutputs.skeptic}\nPRAGMATIST: ${roundOutputs.pragmatist}\n\nNow synthesize.`
      const synthHistory = buildHistoryForPersona(messagesRef.current)
      const synthResponse = await window.context.generateAIResponse(
        `Synthesize round ${round + 1} of the debate on "${topic}".`,
        synthHistory,
        synthContext,
        PERSONA_PROMPTS.synthesizer
      )
      addMessage('synthesizer', synthResponse)
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <LuUsers className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-sm uppercase tracking-wider">Council Arena</h2>
        </div>
        {isLoading && <LuLoader className="w-4 h-4 animate-spin text-primary" />}
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LuUsers className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold">The Council is Assembled</h3>
              <p className="text-sm text-muted-foreground italic">
                Type <code className="bg-muted px-1 rounded">/debate</code> to start a discussion,
                or
                <code className="bg-muted px-1 rounded">@note</code> to bring external context into
                the arena.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex flex-col gap-1 p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2 bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-primary">Thinking...</span>
            </div>
            <div className="text-sm leading-relaxed">
              <Shimmer>Consulting the council</Shimmer>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <CommandInput
            onSend={handleSend}
            placeholder="Type /debate to start or ask the Judge..."
            showCommands={true}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
