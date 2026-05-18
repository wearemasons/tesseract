import { useAtom } from 'jotai'
import { useState, useEffect } from 'react'
import {
  sessionPickerOpenAtom,
  aiMessagesAtom,
  councilMessagesAtom,
  type CouncilPersona
} from '@renderer/store'
import { SessionRow } from '@shared/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { LuHistory, LuTrash2, LuLoader, LuPlus } from 'react-icons/lu'

export const SessionPicker = () => {
  const [open, setOpen] = useAtom(sessionPickerOpenAtom)
  const [sessions, setSessions] = useState<SessionRow[] | null>(null)
  const [, setAiMessages] = useAtom(aiMessagesAtom)
  const [, setCouncilMessages] = useAtom(councilMessagesAtom)

  useEffect(() => {
    if (open) {
      window.context.session.list().then(setSessions)
    }
  }, [open])

  const loadSession = async (id: number): Promise<void> => {
    try {
      const result = await window.context.session.load(id)
      if (result) {
        setAiMessages(
          result.aiMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        )
        setCouncilMessages(
          result.councilMessages.map((m) => ({
            id: String(m.id),
            persona: m.persona as CouncilPersona,
            content: m.content,
            timestamp: m.timestamp
          }))
        )
        setOpen(false)
      }
    } catch (e) {
      console.error('Failed to load session', e)
    }
  }

  const deleteSession = async (id: number): Promise<void> => {
    try {
      await window.context.session.delete(id)
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null)
    } catch (e) {
      console.error('Failed to delete session', e)
    }
  }

  const newSession = async (): Promise<void> => {
    try {
      await window.context.session.create()
      setAiMessages([])
      setCouncilMessages([])
      setOpen(false)
    } catch (e) {
      console.error('Failed to create session', e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuHistory className="h-5 w-5" />
            Load Session
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2 max-h-80 overflow-y-auto">
          {sessions === null && (
            <div className="flex items-center justify-center py-8">
              <LuLoader className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {sessions !== null && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No saved sessions yet.</p>
          )}
          {sessions !== null &&
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent hover:text-accent-foreground group"
              >
                <button
                  onClick={() => loadSession(session.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="font-medium text-sm truncate">
                    {session.label || `Session #${session.id}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.app_mode} · {session.selected_note || 'no note'} ·{' '}
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                  title="Delete session"
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
        </div>
        <div className="border-t border-border pt-3">
          <button
            onClick={newSession}
            className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent transition-colors"
          >
            <LuPlus className="h-4 w-4" />
            New Session
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
