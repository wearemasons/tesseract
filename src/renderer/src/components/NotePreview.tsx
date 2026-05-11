import { NoteInfo } from '@shared/models'
import { ComponentProps } from 'react'
import { cn, formatDateFromMs } from '@renderer/utils'

export type NotePreviewProps = NoteInfo & {
  isActive?: boolean
} & ComponentProps<'div'>

export const NotePreview = ({
  title,
  content: _content,
  lastEditTime,
  isActive = false,
  className,
  ...props
}: NotePreviewProps) => {
  const date = formatDateFromMs(lastEditTime)
  return (
    <div
      className={cn(
        'cursor-pointer px-2.5 py-3 rounded-md transition-colors duration-75 text-foreground',
        {
          'bg-accent text-accent-foreground': isActive,
          'hover:bg-accent/50 hover:text-accent-foreground': !isActive
        },
        className
      )}
      {...props}
    >
      <h3 className="mb-1 font-bold truncate text-foreground">{title}</h3>
      <span className="inline-block w-full mb-2 text-xs font-light text-left text-muted-foreground">
        {date}
      </span>
    </div>
  )
}
