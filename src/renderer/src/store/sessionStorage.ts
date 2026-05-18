import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import { useEffect, useRef } from 'react'
import {
  appModeAtom,
  fontSizeAtom,
  notesSidebarOpenAtom,
  autocompleteEnabledAtom,
  activeThemeCssAtom,
  selectedNoteIndexAtom,
  themeAtom,
  aiMessagesAtom,
  councilMessagesAtom,
  sessionReadyAtom,
  aiSidebarWidthAtom,
  CouncilMessage
} from './index'
import { notesAtom } from './index'

let saveTimeout: ReturnType<typeof setTimeout> | null = null

const debouncedSave = (data: Record<string, unknown>): void => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    window.context.session.update(data).catch(() => {})
  }, 300)
}

export const useSessionManager = (): void => {
  const setSessionReady = useSetAtom(sessionReadyAtom)
  const setAppMode = useSetAtom(appModeAtom)
  const setFontSize = useSetAtom(fontSizeAtom)
  const setSidebar = useSetAtom(notesSidebarOpenAtom)
  const setAutocomplete = useSetAtom(autocompleteEnabledAtom)
  const setActiveThemeCss = useSetAtom(activeThemeCssAtom)
  const setTheme = useSetAtom(themeAtom)
  const setAiSidebarWidth = useSetAtom(aiSidebarWidthAtom)
  const [selectedIndex, setSelectedIndex] = useAtom(selectedNoteIndexAtom)
  const notes = useAtomValue(notesAtom)
  const [, setAiMessages] = useAtom(aiMessagesAtom)
  const [, setCouncilMessages] = useAtom(councilMessagesAtom)
  const loadedRef = useRef(false)

  // Load session on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    const load = async (): Promise<void> => {
      try {
        const result = await window.context.session.loadLatest()
        if (result) {
          setAppMode(result.session.app_mode as 'notes' | 'ai' | 'council')
          setFontSize(result.session.font_size)
          setSidebar(result.session.sidebar_open === 1)
          setAutocomplete(result.session.autocomplete_on === 1)
          setActiveThemeCss(result.session.active_theme_css)
          setTheme(result.session.theme as 'light' | 'dark' | 'system')
          if (result.session.ai_sidebar_width != null) {
            setAiSidebarWidth(result.session.ai_sidebar_width)
          }

          // Restore selected note
          if (result.session.selected_note && notes) {
            const idx = notes.findIndex((n) => n.title === result.session.selected_note)
            if (idx >= 0) {
              setSelectedIndex(idx)
            }
          }

          // Restore messages
          if (result.aiMessages.length > 0) {
            setAiMessages(
              result.aiMessages.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
              }))
            )
          }
          if (result.councilMessages.length > 0) {
            setCouncilMessages(
              result.councilMessages.map((m) => ({
                id: String(m.id),
                persona: m.persona as CouncilMessage['persona'],
                content: m.content,
                timestamp: m.timestamp
              }))
            )
          }
        }
      } catch {
        // Session load failed, use defaults
      } finally {
        setSessionReady(true)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save selected note index changes
  useEffect(() => {
    if (selectedIndex != null && notes && notes[selectedIndex]) {
      debouncedSave({ selected_note: notes[selectedIndex].title })
    }
  }, [selectedIndex, notes])
}

export const useSessionSaver = (): void => {
  const appMode = useAtomValue(appModeAtom)
  const fontSize = useAtomValue(fontSizeAtom)
  const sidebarOpen = useAtomValue(notesSidebarOpenAtom)
  const autocompleteOn = useAtomValue(autocompleteEnabledAtom)
  const activeThemeCss = useAtomValue(activeThemeCssAtom)
  const theme = useAtomValue(themeAtom)
  const aiSidebarWidth = useAtomValue(aiSidebarWidthAtom)

  useEffect(() => {
    debouncedSave({
      app_mode: appMode,
      font_size: fontSize,
      sidebar_open: sidebarOpen,
      autocomplete_on: autocompleteOn,
      active_theme_css: activeThemeCss,
      theme,
      ai_sidebar_width: aiSidebarWidth
    })
  }, [appMode, fontSize, sidebarOpen, autocompleteOn, activeThemeCss, theme, aiSidebarWidth])
}

export const persistAiMessage = async (role: string, content: string): Promise<void> => {
  try {
    const sessionId = await window.context.session.getActiveId()
    if (sessionId != null) {
      await window.context.session.saveAiMessage(sessionId, role, content)
    }
  } catch {
    // silently fail
  }
}

export const persistCouncilMessage = async (persona: string, content: string): Promise<void> => {
  try {
    const sessionId = await window.context.session.getActiveId()
    if (sessionId != null) {
      await window.context.session.saveCouncilMessage(sessionId, persona, content)
    }
  } catch {
    // silently fail
  }
}

export const clearPersistedAiMessages = async (): Promise<void> => {
  try {
    const sessionId = await window.context.session.getActiveId()
    if (sessionId != null) {
      await window.context.session.clearAiMessages(sessionId)
    }
  } catch {
    // silently fail
  }
}
