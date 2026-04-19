import { NoteContent, NoteInfo } from '@shared/models'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

// --- Async atom to load notes from file system ---
const loadNotes = async (): Promise<NoteInfo[]> => {
  const notes = await window.context.getNotes()
  return notes.sort((a, b) => b.lastEditTime - a.lastEditTime)
}

const notesAtomAsync = atom<NoteInfo[] | Promise<NoteInfo[]>>(loadNotes())
export const notesAtom = unwrap(notesAtomAsync, (prev) => prev ?? undefined)

export const selectedNoteIndexAtom = atom<number | null>(null)

const selectedNoteAtomAsync = atom(async (get) => {
  const notes = get(notesAtom)
  const selectedNoteIndex = get(selectedNoteIndexAtom)

  if (selectedNoteIndex == null || !notes) return null

  const selectedNote = notes[selectedNoteIndex]

  try {
    const content = await window.context.readNote(selectedNote.title)
    return {
      ...selectedNote,
      content
    }
  } catch {
    return {
      ...selectedNote,
      content: ''
    }
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

  // Write to file system
  await window.context.writeNote(selectedNote.title, newContent)

  // Update notes list with new timestamp
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
  const newTitle = await window.context.createNote()
  if (!newTitle) return

  const notes = get(notesAtom)
  const newNote: NoteInfo = {
    title: newTitle,
    lastEditTime: Date.now()
  }

  if (notes) {
    set(notesAtom, [newNote, ...notes.filter((note) => note.title !== newNote.title)])
  } else {
    set(notesAtom, [newNote])
  }
  set(selectedNoteIndexAtom, 0)
})

export const deleteNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!selectedNote || !notes) return

  const deleted = await window.context.deleteNote(selectedNote.title)
  if (!deleted) return

  set(
    notesAtom,
    notes.filter((note) => note.title !== selectedNote.title)
  )
  set(selectedNoteIndexAtom, null)
})
