import { JSX, useRef, useEffect } from 'react'
import {
  ActivityBar,
  AICompanion,
  Content,
  CouncilArena,
  DraggableTopBar,
  FloatingNoteTitle,
  MarkdownEditor,
  NotePreviewList,
  ResizableSidebar,
  RootLayout,
  Sidebar,
  CommandPalette,
  ThemePicker
} from './components'
import { ActionButtonsRow } from './components/ActionButtonRow'
import { useAtomValue, useSetAtom } from 'jotai'
import { appModeAtom, commandPaletteOpenAtom, activeThemeCssAtom, notesSidebarOpenAtom } from './store'

function App(): JSX.Element {
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const mode = useAtomValue(appModeAtom)
  const notesSidebarOpen = useAtomValue(notesSidebarOpenAtom)
  const setCommandPaletteOpen = useSetAtom(commandPaletteOpenAtom)
  const setNotesSidebar = useSetAtom(notesSidebarOpenAtom)
  const setMode = useSetAtom(appModeAtom)
  const activeThemeCss = useAtomValue(activeThemeCssAtom)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        e.stopPropagation()
        setCommandPaletteOpen((prev) => !prev)
        return
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'b') {
        e.preventDefault()
        e.stopPropagation()
        setNotesSidebar((prev) => !prev)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        e.stopPropagation()
        setMode((prev) => (prev === 'ai' ? 'notes' : 'ai'))
      }
    }
    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [setCommandPaletteOpen, setNotesSidebar, setMode])

  useEffect(() => {
    const existing = document.getElementById('theme-css')
    if (existing) {
      existing.remove()
    }
    if (activeThemeCss) {
      const link = document.createElement('link')
      link.id = 'theme-css'
      link.rel = 'stylesheet'
      link.href = activeThemeCss
      document.head.appendChild(link)
    }
    return () => {
      const el = document.getElementById('theme-css')
      if (el) el.remove()
    }
  }, [activeThemeCss])

  const resetScroll = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0
    }
  }

  return (
    <div className="relative flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <CommandPalette />
      <ThemePicker />
      {/*<DraggableTopBar />*/}
      <RootLayout className="flex-1 flex overflow-hidden">
        <ActivityBar />
        
        {mode !== 'council' && notesSidebarOpen && (
          <Sidebar className="p-2 border-r border-border bg-card/30">
            <ActionButtonsRow className="flex justify-between mt-1" />
            <NotePreviewList className="mt-3 space-y-1" onSelect={resetScroll} />
          </Sidebar>
        )}

        {mode === 'council' && (
          <Sidebar className="p-4 border-r border-border bg-card/30">
            <h2 className="font-bold text-lg px-2 mb-4">The Council</h2>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="font-bold text-xs text-amber-500 mb-1">The Visionary</div>
                <div className="text-[10px] text-muted-foreground leading-tight">Focusing on high-level goals and potential.</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-400/10 border border-slate-400/20">
                <div className="font-bold text-xs text-slate-400 mb-1">The Skeptic</div>
                <div className="text-[10px] text-muted-foreground leading-tight">Analyzing risks and identifying flaws.</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-bold text-xs text-emerald-500 mb-1">The Pragmatist</div>
                <div className="text-[10px] text-muted-foreground leading-tight">Ensuring execution and resource management.</div>
              </div>
            </div>
          </Sidebar>
        )}

        <Content className="flex-1 flex flex-col overflow-hidden relative">
          {mode === 'council' ? (
            <CouncilArena />
          ) : (
            <div className="flex-1 flex overflow-hidden">
              <div ref={contentContainerRef} className="flex-1 flex flex-col overflow-y-auto">
                <FloatingNoteTitle className="pt-2" />
                <MarkdownEditor className="pt-2 flex-1" />
              </div>
              
              {mode === 'ai' && (
                <ResizableSidebar side="right" defaultWidth={350} minWidth={250} maxWidth={500}>
                  <AICompanion />
                </ResizableSidebar>
              )}
            </div>
          )}
        </Content>
      </RootLayout>
    </div>
  )
}

export default App
