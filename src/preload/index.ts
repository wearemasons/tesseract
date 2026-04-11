import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'
import { GetNotes, ReadNote, WriteNote, CreateNote, DeleteNote } from '../shared/types'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in webPreferences')
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,
    getNotes: ((...args) => ipcRenderer.invoke('getNotes', ...args)) as GetNotes,
    readNote: ((...args) => ipcRenderer.invoke('readNote', ...args)) as ReadNote,
    writeNote: ((...args) => ipcRenderer.invoke('writeNote', ...args)) as WriteNote,
    createNote: ((...args) => ipcRenderer.invoke('createNote', ...args)) as CreateNote,
    deleteNote: ((...args) => ipcRenderer.invoke('deleteNote', ...args)) as DeleteNote
  })
} catch (error) {
  console.error(error)
}
