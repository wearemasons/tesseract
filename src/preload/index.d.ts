import { ElectronAPI } from '@electron-toolkit/preload'
import {
  GetNotes,
  ReadNote,
  WriteNote,
  CreateNote,
  DeleteNote,
  GenerateAIResponse,
  GenerateAutocomplete,
  ReadWorkspaceFile,
  SessionApi,
  ExportNote
} from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    context: {
      locale: string
      getNotes: GetNotes
      readNote: ReadNote
      readWorkspaceFile: ReadWorkspaceFile
      writeNote: WriteNote
      createNote: CreateNote
      deleteNote: DeleteNote
      generateAIResponse: GenerateAIResponse
      generateAutocomplete: GenerateAutocomplete
      exportNote: ExportNote
      session: SessionApi
    }
  }
}
