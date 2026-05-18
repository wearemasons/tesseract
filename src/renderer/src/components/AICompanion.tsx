import { useAtomValue, useAtom, useSetAtom } from 'jotai'
import {
  selectedNoteAtom,
  aiMessagesAtom,
  saveNoteAtom,
  pendingWriteContentAtom
} from '@renderer/store'
import { persistAiMessage, clearPersistedAiMessages } from '@renderer/store/sessionStorage'
import { cn } from '@renderer/utils'
import { useState, useRef, useEffect } from 'react'
import { LuBrain, LuLoader, LuFilePen } from 'react-icons/lu'
import { CommandInput } from './CommandInput'
import { resolveNoteReferences } from '@renderer/utils/ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Shimmer } from './ai/shimmer'

const WRITE_SYSTEM_PROMPT = `You are a markdown editing assistant. You will receive the current note content and a user request.
Analyze the request. If the user wants to append content or add to the end, output ONLY the new content wrapped in <append>...</append> tags.
If the user wants to modify, rewrite, or replace the existing content, output the COMPLETE updated markdown wrapped in <rewrite>...</rewrite> tags.
Do not include any explanation, commentary, or markdown fences outside the tags. Output ONLY the tags and the requested content.`

export const AICompanion = () => {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const [messages, setMessages] = useAtom(aiMessagesAtom)
  const saveNote = useSetAtom(saveNoteAtom)
  const setPendingWriteContent = useSetAtom(pendingWriteContentAtom)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [writeConfirm, setWriteConfirm] = useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (text: string) => {
    if (isLoading) return
    setIsLoading(true)

    if (text.trim() === '/clear') {
      setMessages([])
      await clearPersistedAiMessages()
      setIsLoading(false)
      return
    }

    const isWriteCommand = text.trim().startsWith('/write')
    const writePrompt = isWriteCommand ? text.trim().replace(/^\/write\s*/, '') : text

    const { cleanText, context: refContext } = await resolveNoteReferences(text)

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    persistAiMessage('user', text)

    try {
      let fullContext = ''
      if (refContext) {
        fullContext += `\n\n[REFERENCED NOTES - YOUR RESPONSE MUST BE ABOUT THIS CONTENT]:\n${refContext}`
      }
      if (selectedNote?.content) {
        fullContext += `\n\n[Currently Open Note (Background Context)]:\n${selectedNote.content}`
      }

      const history = messages.map((msg) => ({
        role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
        text: msg.content
      }))

      if (isWriteCommand) {
        const writeContext = `Current note content:\n${selectedNote?.content || ''}\n\nUser request:\n${writePrompt || cleanText}`
        const rawResponse = await window.context.generateAIResponse(
          '',
          history,
          writeContext,
          WRITE_SYSTEM_PROMPT
        )
        if (rawResponse && selectedNote) {
          let newContent = rawResponse.trim()
          let responseDisplay = rawResponse.trim()

          const rewriteMatch = rawResponse.match(/<rewrite>([\s\S]*?)<\/rewrite>/)
          const appendMatch = rawResponse.match(/<append>([\s\S]*?)<\/append>/)

          if (rewriteMatch) {
            newContent = rewriteMatch[1].trim()
            responseDisplay = newContent
          } else if (appendMatch) {
            const appendedText = appendMatch[1].trim()
            newContent = selectedNote.content
              ? `${selectedNote.content}\n\n${appendedText}`
              : appendedText
            responseDisplay = appendedText
          } else {
            newContent = newContent
              .replace(/^```[a-z]*\n/, '')
              .replace(/\n```$/, '')
              .trim()
            responseDisplay = newContent
          }

          await saveNote(newContent)
          setPendingWriteContent(newContent)
          setWriteConfirm(selectedNote.title)
          setTimeout(() => setWriteConfirm(null), 3000)

          const displayContent = `✏️ **Written to "${selectedNote.title || 'note'}"**\n\n${responseDisplay}`
          setMessages((prev) => [...prev, { role: 'assistant', content: displayContent }])
          persistAiMessage('assistant', displayContent)
        } else {
          const displayContent = 'Sorry, I could not generate content. Please check your API key.'
          setMessages((prev) => [...prev, { role: 'assistant', content: displayContent }])
          persistAiMessage('assistant', displayContent)
        }
      } else {
        const response = await window.context.generateAIResponse(cleanText, history, fullContext)
        setMessages((prev) => [...prev, { role: 'assistant', content: response }])
        persistAiMessage('assistant', response)
      }
    } catch (error) {
      const errorContent =
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Sorry, I encountered an error. Please check your API key.'
      setMessages((prev) => [...prev, { role: 'assistant', content: errorContent }])
      persistAiMessage('assistant', errorContent)
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
        <div className="flex items-center gap-2">
          {writeConfirm && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium animate-pulse">
              <LuFilePen className="w-3 h-3" />
              Written to note
            </span>
          )}
          {isLoading && <LuLoader className="w-4 h-4 animate-spin text-primary" />}
        </div>
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
              Hello! I&apos;m your integrated thinking assistant. I can see the note you&apos;re
              working on. Ask me to refine your ideas, summarize, or type @ to reference another
              note.
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
        {isLoading && (
          <div className="p-3 rounded-2xl text-sm leading-relaxed max-w-[90%] bg-muted text-foreground mr-auto rounded-tl-none border border-border/50">
            <Shimmer>Thinking...</Shimmer>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-background/50">
        <CommandInput
          onSend={handleSend}
          placeholder="Ask anything, @note..., or /write ..."
          disabled={isLoading}
          showCommands={true}
        />
        <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-50">
          Powered by Gemini Flash Lite
        </p>
      </div>
    </div>
  )
}
