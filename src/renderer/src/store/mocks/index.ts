import { NoteContent, NoteInfo } from '@shared/model'

export const notesMock: NoteInfo[] = [
  {
    title: `Welcome 👋🏻`,
    lastEditTime: Date.now()
  },
  {
    title: 'Note 1',
    lastEditTime: Date.now() - 1000
  },
  {
    title: 'Note 2',
    lastEditTime: Date.now() - 2000
  },
  {
    title: 'Note 3',
    lastEditTime: Date.now() - 3000
  }
]

export const noteContentMock: Record<string, NoteContent> = {
  [`Welcome 👋🏻`]:
    '# Welcome to Tesseract!\n\nThis is your **first note**. Start editing or create a new one.',
  'Note 1': '# Note 1\n\nSome content here.',
  'Note 2': '# Note 2\n\nMore content.',
  'Note 3': '# Note 3\n\nEven more content.'
}
