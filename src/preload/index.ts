import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { GetNotes, ReadNote, WriteNote, CreateNote, DeleteNote, GenerateAIResponse, GenerateAutocomplete, ReadWorkspaceFile } from '../shared/types'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in webPreferences')
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,
    getNotes: ((...args) => ipcRenderer.invoke('getNotes', ...args)) as GetNotes,
    readNote: ((...args) => ipcRenderer.invoke('readNote', ...args)) as ReadNote,
    readWorkspaceFile: ((...args) => ipcRenderer.invoke('readWorkspaceFile', ...args)) as ReadWorkspaceFile,
    writeNote: ((...args) => ipcRenderer.invoke('writeNote', ...args)) as WriteNote,
    createNote: ((...args) => ipcRenderer.invoke('createNote', ...args)) as CreateNote,
    deleteNote: ((...args) => ipcRenderer.invoke('deleteNote', ...args)) as DeleteNote,
    generateAIResponse: ((...args) => ipcRenderer.invoke('ai:generate', ...args)) as GenerateAIResponse,
    generateAutocomplete: ((...args) => ipcRenderer.invoke('ai:autocomplete', ...args)) as GenerateAutocomplete
  })
} catch (error) {
  console.error(error)
}
