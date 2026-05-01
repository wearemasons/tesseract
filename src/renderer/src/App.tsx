import { JSX, useRef } from 'react'
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
  Sidebar
} from './components'
import { ActionButtonsRow } from './components/ActionButtonRow'
import { useAtomValue } from 'jotai'
import { appModeAtom } from './store'

function App(): JSX.Element {
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const mode = useAtomValue(appModeAtom)

  const resetScroll = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0
    }
  }

  return (
    <div className="relative flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/*<DraggableTopBar />*/}
      <RootLayout className="flex-1 flex overflow-hidden">
        <ActivityBar />
        
        {mode !== 'council' && (
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
