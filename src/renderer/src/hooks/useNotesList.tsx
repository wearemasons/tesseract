import { useAtom, useAtomValue } from 'jotai'
import { notesAtom, selectedNoteIndexAtom } from '@/store'

export function useNotesList() {
  const notes = useAtomValue(notesAtom)
  const [selectedNoteIndex, setSelectedNoteIndex] = useAtom(selectedNoteIndexAtom)

  const handleNoteSelect = (index: number, onSelect?: (index: number) => void) => {
    setSelectedNoteIndex(index)
    onSelect?.(index)
  }

  return { notes, selectedNoteIndex, handleNoteSelect }
}
