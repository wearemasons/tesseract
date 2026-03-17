import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  createRoot(document.getElementById('root')!).render(
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900 text-white">
      <div className="p-4 bg-red-900/50 rounded-lg border border-red-500">
        <h1 className="text-xl font-bold mb-2">Configuration Error</h1>
        <p>
          Missing <code className="bg-black/30 px-1 py-0.5 rounded">VITE_CONVEX_URL</code>{' '}
          environment variable.
        </p>
        <p className="text-sm text-gray-300 mt-2">
          Please run <code className="bg-black/30 px-1 py-0.5 rounded">npx convex dev</code> to
          configure your project.
        </p>
      </div>
    </div>
  )
} else {
  const convex = new ConvexReactClient(convexUrl)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </StrictMode>
  )
}
