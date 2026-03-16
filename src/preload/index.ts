import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge } from 'electron'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in webPreferences')
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('context', {})
} catch (error) {
  console.error(error)
}
