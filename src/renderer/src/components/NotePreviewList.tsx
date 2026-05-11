import { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { useNotesList } from '@/hooks/useNotesList'
import { NotePreview } from './NotePreview'

export type NotePreviewListProps = ComponentProps<'ul'> & {
  onSelect?: (index: number) => void
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={twMerge('px-2.5 py-3 rounded-md animate-pulse', className)}>
    <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2" />
    <div className="h-3 w-1/4 bg-muted-foreground/20 rounded" />
  </div>
)

export const NotePreviewList = ({ className, onSelect, ...props }: NotePreviewListProps) => {
  const { notes, selectedNoteIndex, handleNoteSelect } = useNotesList()

  if (!notes) {
    return (
      <ul className={className} {...props}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </ul>
    )
  }

  if (notes.length === 0) {
    return (
      <ul className={twMerge('text-center pt-4', className)} {...props}>
        <span>No notes yet</span>
      </ul>
    )
  }

  return (
    <ul className={className} {...props}>
      {notes.map((note, index) => (
        <NotePreview
          key={note.title + note.lastEditTime}
          {...note}
          isActive={index === selectedNoteIndex}
          onClick={() => handleNoteSelect(index, onSelect)}
        />
      ))}
    </ul>
  )
}
