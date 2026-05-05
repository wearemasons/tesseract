import { useState, useRef, useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { notesAtom } from '@renderer/store'
import { cn } from '@renderer/utils'
import { LuSend } from 'react-icons/lu'

interface CommandInputProps {
  placeholder?: string
  onSend: (text: string) => void
  showCommands?: boolean
  disabled?: boolean
}

const COMMANDS = [
  { label: '/debate', description: 'Start a 3-way debate' },
  { label: '/summarize', description: 'Synthesize a conclusion' },
  { label: '/brainstorm', description: 'Generate creative ideas' },
  { label: '/critique', description: 'Find flaws and risks' },
  { label: '/resolve', description: 'Force a final agreement' }
]

export const CommandInput = ({ placeholder, onSend, showCommands = false, disabled = false }: CommandInputProps) => {
  const [value, setValue] = useState('')
  const [suggestionType, setSuggestionType] = useState<'note' | 'command' | null>(null)
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const notes = useAtomValue(notesAtom) || []

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setValue(val)

    const cursor = e.target.selectionStart
    const textBeforeCursor = val.slice(0, cursor)
    const lastWord = textBeforeCursor.split(/\s/).pop() || ''

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase()
      setSuggestionType('note')
      setFilteredSuggestions(notes.filter((n) => n.title.toLowerCase().includes(query)))
      setSelectedIndex(0)
    } else if (showCommands && val.startsWith('/') && !val.includes(' ', 1)) {
      const query = val.toLowerCase()
      setSuggestionType('command')
      setFilteredSuggestions(COMMANDS.filter((c) => c.label.startsWith(query)))
      setSelectedIndex(0)
    } else {
      setSuggestionType(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestionType) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        applySuggestion(filteredSuggestions[selectedIndex])
      } else if (e.key === 'Escape') {
        setSuggestionType(null)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const applySuggestion = (suggestion: any) => {
    const cursor = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.slice(0, cursor)
    const textAfterCursor = value.slice(cursor)
    const words = textBeforeCursor.split(/\s/)
    words.pop()
    
    const replacement = suggestionType === 'note' ? `@[${suggestion.title}] ` : `${suggestion.label} `
    const newValue = words.join(' ') + (words.length > 0 ? ' ' : '') + replacement + textAfterCursor
    
    setValue(newValue)
    setSuggestionType(null)
    setTimeout(() => {
      textareaRef.current?.focus()
      const newPos = newValue.indexOf(replacement) + replacement.length
      textareaRef.current?.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleSend = () => {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
    setSuggestionType(null)
  }

  return (
    <div className="relative w-full">
      {suggestionType && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-[100]">
          <div className="p-2 border-b border-border bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {suggestionType === 'note' ? 'Reference Note' : 'Commands'}
          </div>
          <div className="max-h-48 overflow-auto">
            {filteredSuggestions.map((item, i) => (
              <button
                key={i}
                onClick={() => applySuggestion(item)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex flex-col gap-0.5 transition-colors',
                  i === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                )}
              >
                <span className="font-medium">{suggestionType === 'note' ? item.title : item.label}</span>
                {suggestionType === 'command' && (
                  <span className="text-[10px] opacity-70">{item.description}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-muted rounded-2xl p-2 focus-within:ring-1 focus-within:ring-primary transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none resize-none h-auto min-h-[44px] max-h-48 py-2 px-3 text-sm leading-relaxed disabled:opacity-50"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={cn(
            'p-2 rounded-xl transition-all shrink-0',
            value.trim() 
              ? 'bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95' 
              : 'text-muted-foreground opacity-50 cursor-not-allowed'
          )}
        >
          <LuSend className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}