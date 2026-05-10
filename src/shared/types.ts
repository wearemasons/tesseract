import { NoteContent, NoteInfo } from './models'

export type GetNotes = () => Promise<NoteInfo[]>
export type ReadNote = (title: NoteInfo['title']) => Promise<NoteContent>
export type ReadWorkspaceFile = (filePath: string) => Promise<string>
export type WriteNote = (title: NoteInfo['title'], content: NoteContent) => Promise<void>
export type CreateNote = () => Promise<NoteInfo['title'] | false>
export type DeleteNote = (title: NoteInfo['title']) => Promise<boolean>

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export type GenerateAIResponse = (prompt: string, history?: ChatMessage[], context?: string, customSystemPrompt?: string) => Promise<string>
export type GenerateAutocomplete = (textBefore: string) => Promise<string>

