import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
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

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in webPreferences')
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,
    getNotes: ((...args) => ipcRenderer.invoke('getNotes', ...args)) as GetNotes,
    readNote: ((...args) => ipcRenderer.invoke('readNote', ...args)) as ReadNote,
    readWorkspaceFile: ((...args) =>
      ipcRenderer.invoke('readWorkspaceFile', ...args)) as ReadWorkspaceFile,
    writeNote: ((...args) => ipcRenderer.invoke('writeNote', ...args)) as WriteNote,
    createNote: ((...args) => ipcRenderer.invoke('createNote', ...args)) as CreateNote,
    deleteNote: ((...args) => ipcRenderer.invoke('deleteNote', ...args)) as DeleteNote,
    generateAIResponse: ((...args) =>
      ipcRenderer.invoke('ai:generate', ...args)) as GenerateAIResponse,
    generateAutocomplete: ((...args) =>
      ipcRenderer.invoke('ai:autocomplete', ...args)) as GenerateAutocomplete,
    exportNote: ((...args) => ipcRenderer.invoke('exportNote', ...args)) as ExportNote,
    session: {
      getActiveId: () => ipcRenderer.invoke('session:getActiveId'),
      create: () => ipcRenderer.invoke('session:create'),
      update: (data) => ipcRenderer.invoke('session:update', data),
      list: () => ipcRenderer.invoke('session:list'),
      get: (id) => ipcRenderer.invoke('session:get', id),
      getAiMessages: (sessionId) => ipcRenderer.invoke('session:getAiMessages', sessionId),
      getCouncilMessages: (sessionId) =>
        ipcRenderer.invoke('session:getCouncilMessages', sessionId),
      saveAiMessage: (sessionId, role, content) =>
        ipcRenderer.invoke('session:saveAiMessage', sessionId, role, content),
      saveCouncilMessage: (sessionId, persona, content) =>
        ipcRenderer.invoke('session:saveCouncilMessage', sessionId, persona, content),
      clearAiMessages: (sessionId) => ipcRenderer.invoke('session:clearAiMessages', sessionId),
      delete: (id) => ipcRenderer.invoke('session:delete', id),
      loadLatest: () => ipcRenderer.invoke('session:loadLatest'),
      load: (id) => ipcRenderer.invoke('session:load', id)
    } satisfies SessionApi
  })
} catch (error) {
  console.error(error)
}
