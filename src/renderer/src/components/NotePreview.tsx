import { NoteInfo } from '@shared/model'
import { ComponentProps } from 'react'
import { cn, formatDateFromMs } from '@renderer/utils'

export type NotePreviewProps = NoteInfo & {
  isActive?: boolean
} & ComponentProps<'div'>

export const NotePreview = ({
  title,
  content,
  lastEditTime,
  isActive = false,
  className,
  ...props
}: NotePreviewProps) => {
  const date = formatDateFromMs(lastEditTime)
  return (
    <div
      className={cn(
        'cursor-pointer px-2.5 py-3 rounded-md transition-colors duration-75 text-white',
        {
          'bg-zinc-400/75': isActive,
          'hover:bg-zinc-500/25': !isActive
        },
        className
      )}
      {...props}
    >
      <h3 className="mb-1 font-bold truncate text-white">{title}</h3>
      <span className="inline-block w-full mb-2 text-xs font-light text-left text-zinc-400">
        {date}
      </span>
    </div>
  )
}
