import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs-extra'
import icon from '../../resources/icon.png?asset'
import {
  createNote,
  deleteNote,
  getNotes,
  readNote,
  writeNote,
  readWorkspaceFile,
  getNotesDir
} from '@main/lib'
import { generateAIResponse, generateAutocomplete, ChatMessage } from '@main/lib/ai'
import {
  createSession,
  updateSession,
  getLatestSession,
  listSessions,
  getSession,
  getAiMessages,
  getCouncilMessages,
  saveAiMessage,
  saveCouncilMessage,
  deleteSession,
  getWindowState,
  setWindowState,
  setMeta,
  closeDb
} from '@main/lib/session'

let mainWindow: BrowserWindow | null = null
let activeSessionId: number | null = null
let boundsSaveTimer: ReturnType<typeof setTimeout> | null = null

const debouncedSaveBounds = (): void => {
  if (boundsSaveTimer) clearTimeout(boundsSaveTimer)
  boundsSaveTimer = setTimeout(() => {
    if (!mainWindow) return
    const bounds = mainWindow.getBounds()
    const maximized = mainWindow.isMaximized()
    setWindowState({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized
    })
  }, 500)
}

const startNewSession = (): void => {
  activeSessionId = createSession()
  setMeta('active_session_id', String(activeSessionId))
}

const saveCurrentSessionState = (): void => {
  if (!activeSessionId) return
  if (!mainWindow || mainWindow.isDestroyed()) return
  const bounds = mainWindow.getBounds()
  const maximized = mainWindow.isMaximized()
  setWindowState({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized
  })
}

function createWindow(): void {
  const savedState = getWindowState()

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: savedState?.width ?? 900,
    height: savedState?.height ?? 670,
    minWidth: 800,
    minHeight: 500,
    show: false,
    center: true,
    title: 'Tesseract',
    frame: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    titleBarStyle: 'default',
    trafficLightPosition: {
      x: 15,
      y: 10
    },
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  }

  if (savedState && !savedState.maximized && savedState.x != null && savedState.y != null) {
    windowOptions.x = savedState.x
    windowOptions.y = savedState.y
  }

  mainWindow = new BrowserWindow(windowOptions)

  if (savedState?.maximized) {
    mainWindow.maximize()
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('resize', debouncedSaveBounds)
  mainWindow.on('move', debouncedSaveBounds)
  mainWindow.on('maximize', debouncedSaveBounds)
  mainWindow.on('unmaximize', debouncedSaveBounds)
  mainWindow.on('close', saveCurrentSessionState)

  mainWindow!.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.info('pong'))

  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window-close', () => mainWindow?.close())

  ipcMain.handle('getNotes', () => getNotes())
  ipcMain.handle('readNote', (_, title: string) => readNote(title))
  ipcMain.handle('readWorkspaceFile', (_, filePath: string) => readWorkspaceFile(filePath))
  ipcMain.handle('writeNote', (_, title: string, content: string) => writeNote(title, content))
  ipcMain.handle('createNote', () => createNote())
  ipcMain.handle('deleteNote', (_, title: string) => deleteNote(title))

  ipcMain.handle(
    'ai:generate',
    (_, prompt: string, history?: unknown[], context?: string, customSystemPrompt?: string) =>
      generateAIResponse(prompt, history as ChatMessage[], context, customSystemPrompt)
  )
  ipcMain.handle('ai:autocomplete', (_, textBefore: string) => generateAutocomplete(textBefore))

  ipcMain.handle('exportNote', async (_, title: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Note',
      defaultPath: join(getNotesDir(), `${title}.md`),
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (!result.canceled && result.filePath) {
      const sourcePath = join(getNotesDir(), `${title}.md`)
      await fs.copyFile(sourcePath, result.filePath)
    }
  })

  // Session IPC handlers
  ipcMain.handle('session:getActiveId', () => activeSessionId)
  ipcMain.handle('session:create', () => {
    startNewSession()
    return activeSessionId
  })
  ipcMain.handle('session:update', (_, data: Record<string, unknown>) => {
    if (activeSessionId) updateSession(activeSessionId, data)
  })
  ipcMain.handle('session:list', () => listSessions())
  ipcMain.handle('session:get', (_, id: number) => getSession(id))
  ipcMain.handle('session:getAiMessages', (_, sessionId: number) => getAiMessages(sessionId))
  ipcMain.handle('session:getCouncilMessages', (_, sessionId: number) =>
    getCouncilMessages(sessionId)
  )
  ipcMain.handle('session:saveAiMessage', (_, sessionId: number, role: string, content: string) => {
    saveAiMessage(sessionId, role, content)
  })
  ipcMain.handle(
    'session:saveCouncilMessage',
    (_, sessionId: number, persona: string, content: string) => {
      saveCouncilMessage(sessionId, persona, content)
    }
  )
  ipcMain.handle('session:delete', (_, id: number) => deleteSession(id))
  ipcMain.handle('session:loadLatest', () => {
    if (activeSessionId) {
      const session = getSession(activeSessionId)
      if (session) {
        return {
          session,
          aiMessages: getAiMessages(activeSessionId),
          councilMessages: getCouncilMessages(activeSessionId)
        }
      }
    }
    return null
  })
  ipcMain.handle('session:load', (_, id: number) => {
    const session = getSession(id)
    if (session) {
      activeSessionId = session.id
      setMeta('active_session_id', String(session.id))
      return {
        session,
        aiMessages: getAiMessages(session.id),
        councilMessages: getCouncilMessages(session.id)
      }
    }
    return null
  })

  // Restore latest session before window loads
  const latest = getLatestSession()
  if (latest) {
    activeSessionId = latest.id
    setMeta('active_session_id', String(latest.id))
  }

  createWindow()

  // Only create a new session if no session was restored
  if (!activeSessionId) {
    startNewSession()
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  closeDb()
})
