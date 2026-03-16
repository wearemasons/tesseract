import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI,
    // Empty object to be defined later
    context: Record<string, never>
  }
}
