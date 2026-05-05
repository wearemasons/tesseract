import { JSX, useRef } from 'react'
import {
  ActivityBar,
  Content,
  FloatingNoteTitle,
  MarkdownEditor,
  NotePreviewList,
  RootLayout,
  Sidebar
} from './components'
import { ActionButtonsRow } from './components/ActionButtonRow'

function App(): JSX.Element {
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const resetScroll = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0
    }
  }

  return (
    <div className="relative flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* DraggableTopBar can be uncommented here if needed for Electron framing */}
      {/* <DraggableTopBar /> */}
      
      <RootLayout className="flex-1 flex overflow-hidden">
        <ActivityBar />
        
        <Sidebar className="p-2 border-r border-border bg-card/30">
          <ActionButtonsRow className="flex justify-between mt-1" />
          <NotePreviewList className="mt-3 space-y-1" onSelect={resetScroll} />
        </Sidebar>

        <Content className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex overflow-hidden">
            <div 
              ref={contentContainerRef} 
              className="flex-1 flex flex-col overflow-y-auto"
            >
              <FloatingNoteTitle className="pt-2" />
              <MarkdownEditor className="pt-2 flex-1" />
            </div>
          </div>
        </Content>
      </RootLayout>
    </div>
  )
}

export default App