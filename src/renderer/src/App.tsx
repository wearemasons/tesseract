import { JSX, useRef } from 'react'
import { Content, DraggableTopBar, NotePreviewList, RootLayout, Sidebar } from './components'
import { ActionButtonsRow } from './components/ActionButtonRow'

function App(): JSX.Element {
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const resetScroll = () => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-white">
      <DraggableTopBar />
      <RootLayout>
        <Sidebar className="p-2">
          <ActionButtonsRow className="flex justify-between mt-1" />
          <NotePreviewList className="mt-3 space-y-1" onSelect={resetScroll} />
        </Sidebar>
        <Content ref={contentContainerRef} className="border-l border-l-white/20 bg-zinc-900/50">
          <div className="p-4">
            <h1 className="text-2xl font-bold text-white">Content Area</h1>
            <p className="text-zinc-300 mt-2">If you can see this, React is working</p>
          </div>
        </Content>
      </RootLayout>
    </div>
  )
}

export default App
