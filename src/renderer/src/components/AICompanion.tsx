import { useAtomValue } from 'jotai'
import { selectedNoteAtom } from '@renderer/store'
import { cn } from '@renderer/utils'
import { useState } from 'react'
import { LuSend, LuBrain } from 'react-icons/lu'

export const AICompanion = () => {
  const selectedNote = useAtomValue(selectedNoteAtom)
  const [input, setInput] = useState('')

  return (
    <div className="flex flex-col h-full bg-card/30 border-l border-border backdrop-blur-sm">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <LuBrain className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-sm uppercase tracking-wider">AI Companion</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {selectedNote?.title ? (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-primary font-bold mb-1 uppercase">Current Context</p>
            <p className="text-xs font-medium truncate">{selectedNote.title}</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted text-muted-foreground text-[10px] text-center italic">
            No note selected for context.
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="p-3 rounded-lg bg-accent/50 text-sm leading-relaxed">
            Hello! I'm analyzing "{selectedNote?.title || 'your thoughts'}". How can I help you refine this note?
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-muted border-none rounded-xl px-4 py-3 pr-12 text-sm outline-none resize-none h-24 focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            className={cn(
              'absolute right-3 bottom-3 p-2 rounded-lg transition-colors',
              input.trim() ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <LuSend className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          AI may produce inaccurate information.
        </p>
      </div>
    </div>
  )
}
