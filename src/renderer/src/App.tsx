import { JSX } from 'react'
import { Content, DraggableTopBar, RootLayout, Sidebar } from './components'

function App(): JSX.Element {
  // return (
  //   <div className="flex items-center justify-center min-h-screen bg-blue-500 p-8">
  //     <div className="bg-white p-10 rounded-2xl shadow-2xl">
  //       <h1 className="text-black text-6xl font-bold">App is Running</h1>
  //       <p className="text-gray-600 mt-4 text-xl">The renderer component is correctly loaded.</p>
  //     </div>
  //   </div>
  // )
  return (
    <>
     <DraggableTopBar />
      <RootLayout>
      <Sidebar className="p-2">SideBar</Sidebar>
      <Content className="border-l bg-zinc-900/50 border-l-white/20">Content</Content>
    </RootLayout>
    </>
    
  )
}

export default App

