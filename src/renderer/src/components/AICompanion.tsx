import { useAtomValue, useAtom } from 'jotai'
import { selectedNoteAtom, aiMessagesAtom } from '@renderer/store'
import { cn } from '@renderer/utils'
import { useState, useRef, useEffect } from 'react'
import { LuBrain, LuLoader } from 'react-icons/lu'
import { CommandInput } from './CommandInput'
import { resolveNoteReferences } from '@renderer/utils/ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const AICompanion = () => {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const [messages, setMessages] = useAtom(aiMessagesAtom)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (text: string) => {
    if (isLoading) return
    setIsLoading(true)

    // Resolve @references and clean the text
    const { cleanText, context: refContext } = await resolveNoteReferences(text)

    // Add the user message (with original text for display)
    setMessages((prev) => [...prev, { role: 'user', content: text }])

    try {
      let fullContext = ''
      if (refContext) {
        fullContext += `\n\n[REFERENCED NOTES - YOUR RESPONSE MUST BE ABOUT THIS CONTENT]:\n${refContext}`
      }
      if (selectedNote?.content) {
        fullContext += `\n\n[Currently Open Note (Background Context)]:\n${selectedNote.content}`
      }

      // Build conversation history for the API (use 'model' role for assistant messages)
      const history = messages.map((msg) => ({
        role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
        text: msg.content
      }))

      const response = await window.context.generateAIResponse(cleanText, history, fullContext)
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key.' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card/30 border-l border-border backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuBrain className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-sm uppercase tracking-wider">AI Companion</h2>
        </div>
        {isLoading && <LuLoader className="w-4 h-4 animate-spin text-primary" />}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            {selectedNote?.title && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-primary font-bold mb-1 uppercase">Current Context</p>
                <p className="text-xs font-medium truncate">{selectedNote.title}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-accent/50 text-sm leading-relaxed italic text-muted-foreground">
              Hello! I'm your integrated thinking assistant. I can see the note you're working on.
              Ask me to refine your ideas, summarize, or type @ to reference another note.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'p-3 rounded-2xl text-sm leading-relaxed max-w-[90%]',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none'
                : 'bg-muted text-foreground mr-auto rounded-tl-none border border-border/50 prose prose-sm dark:prose-invert max-w-none'
            )}
          >
            {msg.role === 'assistant' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-background/50">
        <CommandInput onSend={handleSend} placeholder="Ask anything or @note..." disabled={isLoading} />
        <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-50">
          Powered by Gemma 4 31B Instruct Tuned
        </p>
      </div>
    </div>
  )
}
