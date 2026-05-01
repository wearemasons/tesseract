import { useAtomValue } from 'jotai'
import { selectedNoteAtom } from '@renderer/store'
import { cn } from '@renderer/utils'

type Persona = 'visionary' | 'skeptic' | 'pragmatist' | 'user'

interface Message {
  id: string
  persona: Persona
  content: string
  timestamp: number
}

const personaStyles: Record<Persona, { name: string; color: string; bg: string }> = {
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
  user: {
    name: 'Judge',
    color: 'text-primary',
    bg: 'bg-primary/10'
  }
}

const ChatMessage = ({ message }: { message: Message }) => {
  const style = personaStyles[message.persona]
  return (
    <div className={cn('flex flex-col gap-1 p-4 rounded-lg', style.bg)}>
      <div className="flex items-center gap-2">
        <span className={cn('font-bold text-sm', style.color)}>{style.name}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
    </div>
  )
}

export const CouncilArena = () => {
  const selectedNote = useAtomValue(selectedNoteAtom)

  // Mock messages for demonstration
  const messages: Message[] = [
    {
      id: '1',
      persona: 'visionary',
      content: "What if Tesseract wasn't just an editor, but a gateway to a collective intelligence? We should aim for the stars.",
      timestamp: Date.now() - 100000
    },
    {
      id: '2',
      persona: 'skeptic',
      content: "That sounds overly ambitious. We need to focus on stability and local-first privacy. Collective intelligence implies data sharing, which is a risk.",
      timestamp: Date.now() - 80000
    },
    {
      id: '3',
      persona: 'pragmatist',
      content: 'We can achieve both by using local models and encrypted synchronization. Let’s start with the Activity Bar implementation.',
      timestamp: Date.now() - 60000
    }
  ]

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
      <div className="p-4 border-t border-border">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            placeholder="Intervene as Judge..."
            className="w-full bg-muted border-none rounded-full px-6 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            Press Enter to speak
          </div>
        </div>
      </div>
    </div>
  )
}
