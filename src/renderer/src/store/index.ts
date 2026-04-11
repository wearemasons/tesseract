import { NoteContent, NoteInfo } from '@shared/model'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'
import { notesMock, noteContentMock } from '@/store/mocks'

// --- Mock data until real FS support ---
const initialNotes = [...notesMock].sort((a, b) => b.lastEditTime - a.lastEditTime)
const notesAtomAsync = atom<NoteInfo[] | Promise<NoteInfo[]>>(initialNotes)
export const notesAtom = unwrap(notesAtomAsync, (prev) => prev)

export const selectedNoteIndexAtom = atom<number | null>(null)

const selectedNoteAtomAsync = atom(async (get) => {
  const notes = get(notesAtom)
  const selectedNoteIndex = get(selectedNoteIndexAtom)

  if (selectedNoteIndex == null || !notes) return null

  const selectedNote = notes[selectedNoteIndex]

  return {
    ...selectedNote,
    content: noteContentMock[selectedNote.title] ?? ''
  }
})

export const selectedNoteAtom = unwrap(
  selectedNoteAtomAsync,
  (prev) =>
    prev ?? {
      title: '',
      content: '',
      lastEditTime: Date.now()
    }
)

export const saveNoteAtom = atom(null, async (get, set, newContent: NoteContent) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!selectedNote || !notes) return

  // Update mock content in memory
  noteContentMock[selectedNote.title] = newContent

  set(
    notesAtom,
    notes.map((note) => {
      if (note.title === selectedNote.title) {
        return {
          ...note,
          lastEditTime: Date.now()
        }
      }
      return note
    })
  )
})

export const createEmptyNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)
  if (!notes) return

  const newTitle = `New Note ${notes.length + 1}`
  const newNote: NoteInfo = {
    title: newTitle,
    lastEditTime: Date.now()
  }

  noteContentMock[newTitle] = `# ${newTitle}\n\nStart writing...`

  set(notesAtom, [newNote, ...notes.filter((note) => note.title !== newNote.title)])
  set(selectedNoteIndexAtom, 0)
})

export const deleteNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!selectedNote || !notes) return

  delete noteContentMock[selectedNote.title]

  set(
    notesAtom,
    notes.filter((note) => note.title !== selectedNote.title)
  )
  set(selectedNoteIndexAtom, null)
})
