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

export type GenerateAIResponse = (
  prompt: string,
  history?: ChatMessage[],
  context?: string,
  customSystemPrompt?: string
) => Promise<string>
export type GenerateAutocomplete = (textBefore: string) => Promise<string>

export type ExportNote = (title: string) => Promise<void>

export interface SessionRow {
  id: number
  created_at: number
  label: string | null
  app_mode: string
  selected_note: string | null
  sidebar_open: number
  font_size: number
  autocomplete_on: number
  theme: string
  active_theme_css: string | null
  ai_sidebar_width: number | null
}

export interface AIMessageRow {
  id: number
  session_id: number
  role: string
  content: string
  timestamp: number
}

export interface CouncilMessageRow {
  id: number
  session_id: number
  persona: string
  content: string
  timestamp: number
}

export interface SessionLoadResult {
  session: SessionRow
  aiMessages: AIMessageRow[]
  councilMessages: CouncilMessageRow[]
}

export interface SessionApi {
  getActiveId: () => Promise<number | null>
  create: () => Promise<number | null>
  update: (data: Record<string, unknown>) => Promise<void>
  list: () => Promise<SessionRow[]>
  get: (id: number) => Promise<SessionRow | null>
  getAiMessages: (sessionId: number) => Promise<AIMessageRow[]>
  getCouncilMessages: (sessionId: number) => Promise<CouncilMessageRow[]>
  saveAiMessage: (sessionId: number, role: string, content: string) => Promise<void>
  saveCouncilMessage: (sessionId: number, persona: string, content: string) => Promise<void>
  clearAiMessages: (sessionId: number) => Promise<void>
  delete: (id: number) => Promise<void>
  loadLatest: () => Promise<SessionLoadResult | null>
  load: (id: number) => Promise<SessionLoadResult | null>
}
