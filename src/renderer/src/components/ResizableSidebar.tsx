import { ReactNode, useCallback, useEffect, useState, useRef } from 'react'
import { cn } from '@renderer/utils'

interface ResizableSidebarProps {
  children: ReactNode
  side: 'left' | 'right'
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  className?: string
  width?: number
  onWidthChange?: (width: number) => void
}

export const ResizableSidebar = ({
  children,
  side,
  defaultWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  className,
  width: controlledWidth,
  onWidthChange
}: ResizableSidebarProps) => {
  const [internalWidth, setInternalWidth] = useState(controlledWidth ?? defaultWidth)
  const isResizing = useRef(false)

  const width = controlledWidth ?? internalWidth

  const startResizing = useCallback(() => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const stopResizing = useCallback(() => {
    isResizing.current = false
    document.body.style.cursor = 'default'
    document.body.style.userSelect = 'auto'
  }, [])

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return

      let newWidth: number
      if (side === 'left') {
        newWidth = e.clientX
      } else {
        newWidth = window.innerWidth - e.clientX
      }

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        if (onWidthChange) {
          onWidthChange(newWidth)
        } else {
          setInternalWidth(newWidth)
        }
      }
    },
    [side, minWidth, maxWidth, onWidthChange]
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  return (
    <div
      style={{ width: `${width}px` }}
      className={cn('relative flex flex-col h-full shrink-0', className)}
    >
      <div
        onMouseDown={startResizing}
        className={cn(
          'absolute top-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-50',
          side === 'left' ? 'right-0' : 'left-0'
        )}
      />
      {children}
    </div>
  )
}
