import { NoteInfo } from '@shared/model'

export const mockNotes: NoteInfo[] = [
  { title: 'Getting Started', lastEditTime: Date.now() - 3600000 },
  { title: 'Meeting Notes', lastEditTime: Date.now() - 86400000 },
  { title: 'Project Ideas', lastEditTime: Date.now() - 172800000 }
]

export const emptyNoteContent = ''
