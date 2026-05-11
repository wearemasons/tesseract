import { NoteContent, NoteInfo } from '@shared/models'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'
import { atomWithStorage } from 'jotai/utils'

export const sessionReadyAtom = atom<boolean>(false)

export type AppMode = 'notes' | 'ai' | 'council'
export const appModeAtom = atom<AppMode>('notes')

export type Theme = 'light' | 'dark' | 'system'
export const themeAtom = atomWithStorage<Theme>('theme', 'dark')

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}
export const aiMessagesAtom = atom<AIMessage[]>([])

export type CouncilPersona = 'visionary' | 'skeptic' | 'pragmatist' | 'synthesizer' | 'user'
export interface CouncilMessage {
  id: string
  persona: CouncilPersona
  content: string
  timestamp: number
}
export const councilMessagesAtom = atom<CouncilMessage[]>([])

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

export const notesSidebarOpenAtom = atom<boolean>(true)

export const autocompleteEnabledAtom = atom<boolean>(true)

export const pendingWriteContentAtom = atom<string | null>(null)

export const commandPaletteOpenAtom = atom<boolean>(false)

export const fontSizeAtom = atom<number>(18)

export const activeThemeCssAtom = atom<string | null>(null)

export const themePickerOpenAtom = atom<boolean>(false)

export const sessionPickerOpenAtom = atom<boolean>(false)

export const aboutDialogOpenAtom = atom<boolean>(false)

export const aiSidebarWidthAtom = atom<number>(350)

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
