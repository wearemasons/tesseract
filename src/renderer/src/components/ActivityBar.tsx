import { useAtom, useSetAtom } from 'jotai'
import { appModeAtom, AppMode, notesSidebarOpenAtom } from '@renderer/store'
import { LuFiles, LuBot, LuUsers } from 'react-icons/lu'
import { cn } from '@renderer/utils'
import { ThemeToggle } from './ThemeToggle'

export const ActivityBar = () => {
  const [mode, setMode] = useAtom(appModeAtom)
  const setNotesSidebar = useSetAtom(notesSidebarOpenAtom)

  const handleNotes = () => {
    if (mode === 'notes') {
      setNotesSidebar((prev) => !prev)
    } else {
      setMode('notes')
      setNotesSidebar(true)
    }
  }

  const handleAI = () => {
    setMode((prev) => (prev === 'ai' ? 'notes' : 'ai'))
  }

  const navItems: { mode: AppMode; icon: any; label: string; onClick: () => void }[] = [
    { mode: 'notes', icon: LuFiles, label: 'Notes', onClick: handleNotes },
    { mode: 'ai', icon: LuBot, label: 'AI Companion', onClick: handleAI },
    { mode: 'council', icon: LuUsers, label: 'Council of Thought', onClick: () => setMode('council') }
  ]

  return (
    <div className="w-14 flex flex-col items-center py-4 bg-background border-r border-border h-full">
      <div className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={item.onClick}
            className={cn(
              'p-2 rounded-lg transition-colors group relative',
              mode === item.mode
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            )}
            title={item.label}
          >
            <item.icon className="w-6 h-6" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </div>
  )
}
