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
      <span className="text-xs text-muted-foreground font-medium">Tesseract</span>
      <div
        className="flex gap-1"
        style={{ '-webkit-app-region': 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
        >
          <FaMinus className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
        >
          <FaSquare className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <FaTimes className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
