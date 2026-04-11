import { atom, Setter, WritableAtom } from 'jotai'
import { unwrap } from 'jotai/utils'
import { NoteInfo, NoteContent } from '@shared/model'
import { mockNotes, emptyNoteContent } from '@/data/mockNotes'

// Notes list atom - initialized from mock data
export const notesAtom = atom<NoteInfo[]>(mockNotes)

// Selected note index atom
export const selectedNoteIndexAtom = atom<number | null>(null)

// Async atom that reads note content via window.context.readNote
const selectedNoteAtomAsync = atom(
  async (get): Promise<{ info: NoteInfo; content: NoteContent }> => {
    const notes = get(notesAtom)
    const selectedIndex = get(selectedNoteIndexAtom)

    if (notes === undefined || selectedIndex === null || selectedIndex >= notes.length) {
      return { info: { title: '', lastEditTime: 0 }, content: emptyNoteContent }
    }

    const noteInfo = notes[selectedIndex]
    const content = await window.context.readNote(noteInfo.title)

    return { info: noteInfo, content }
  }
)

// Unwrapped atom with fallback to empty note
export const selectedNoteAtom = unwrap(
  selectedNoteAtomAsync,
  (prev) => prev ?? { info: { title: '', lastEditTime: 0 }, content: emptyNoteContent }
)

// Create empty note atom
export const createEmptyNoteAtom = atom(null, async (get, set) => {
  const result = await window.context.createNote()

  if (result === false) {
    return
  }

  const notes = get(notesAtom)
  const newNoteInfo: NoteInfo = {
    title: result,
    lastEditTime: Date.now()
  }

  set(notesAtom, [...notes, newNoteInfo])
  set(selectedNoteIndexAtom, notes.length)
})

// Delete note atom
export const deleteNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)
  const selectedIndex = get(selectedNoteIndexAtom)

  if (selectedIndex === null || notes === undefined) {
    return
  }

  const noteToDelete = notes[selectedIndex]
  const success = await window.context.deleteNote(noteToDelete.title)

  if (!success) {
    return
  }

  const updatedNotes = notes.filter((_, index) => index !== selectedIndex)
  set(notesAtom, updatedNotes)

  // Select adjacent note or null if no notes left
  const newIndex = selectedIndex >= updatedNotes.length ? null : selectedIndex
  set(selectedNoteIndexAtom, newIndex)
})

// Save note atom
export const saveNoteAtom = atom(null, async (get, set, content: NoteContent) => {
  const notes = get(notesAtom)
  const selectedIndex = get(selectedNoteIndexAtom)

  if (selectedIndex === null || notes === undefined) {
    return
  }

  const noteToSave = notes[selectedIndex]
  await window.context.writeNote(noteToSave.title, content)

  // Update lastEditTime
  const updatedNotes = notes.map((note, index) =>
    index === selectedIndex ? { ...note, lastEditTime: Date.now() } : note
  )

  set(notesAtom, updatedNotes)
})
