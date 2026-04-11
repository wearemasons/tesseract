import { ComponentProps } from 'react'
import { useSetAtom } from 'jotai'
import { createEmptyNoteAtom, deleteNoteAtom } from '@/store'
import { DeleteNoteButton, NewNoteButton } from '@/components'

export const ActionButtonsRow = ({ ...props }: ComponentProps<'div'>) => {
  const createNote = useSetAtom(createEmptyNoteAtom)
  const deleteNote = useSetAtom(deleteNoteAtom)

  return (
    <div {...props}>
      <NewNoteButton onClick={() => createNote()} />
      <DeleteNoteButton onClick={() => deleteNote()} />
    </div>
  )
}
