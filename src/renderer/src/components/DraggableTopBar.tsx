import { FaMinus, FaSquare, FaTimes } from 'react-icons/fa'

export const DraggableTopBar = () => {
  const handleMinimize = () => window.electron.ipcRenderer.send('window-minimize')
  const handleMaximize = () => window.electron.ipcRenderer.send('window-maximize')
  const handleClose = () => window.electron.ipcRenderer.send('window-close')

  return (
    <header
      className="absolute top-0 left-0 right-0 h-8 bg-transparent z-50 flex items-center justify-between px-3 select-none"
      style={{ '-webkit-app-region': 'drag' } as React.CSSProperties}
    >
      <span className="text-xs text-zinc-400 font-medium">Tesseract</span>
      <div
        className="flex gap-1"
        style={{ '-webkit-app-region': 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700/50 transition-colors"
        >
          <FaMinus className="w-2.5 h-2.5 text-zinc-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700/50 transition-colors"
        >
          <FaSquare className="w-2.5 h-2.5 text-zinc-400" />
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/70 transition-colors"
        >
          <FaTimes className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    </header>
  )
}
