import { dialog } from 'electron'
import fs from 'fs-extra'
import { homedir } from 'os'
import path from 'path'
import { appDirectoryName, fileEncoding, welcomeNoteFilename } from '@shared/constants'
import { NoteInfo } from '@shared/model'
import { getWelcomeNoteAssetPath } from '@main/assets'

export function getRootDir(): string {
  return path.join(homedir(), appDirectoryName)
}

export function getNotesDir(): string {
  const notesDir = path.join(getRootDir(), 'Notes')
  fs.ensureDirSync(notesDir)
  return notesDir
}

function getNotesInfoFromFilename(filename: string): NoteInfo {
  const stat = fs.statSync(path.join(getNotesDir(), filename))
  return {
    title: filename.replace('.md', ''),
    lastEditTime: stat.mtimeMs
  }
}

export async function getNotes(): Promise<NoteInfo[]> {
  const notesDir = getNotesDir()
  const files = await fs.readdir(notesDir)
  const noteFiles = files.filter((file) => file.endsWith('.md'))
  const notes = noteFiles.map(getNotesInfoFromFilename)

  // Create welcome note if no notes exist
  if (notes.length === 0) {
    const welcomePath = getWelcomeNoteAssetPath()
    const welcomeContent = await fs.readFile(welcomePath, fileEncoding)
    const welcomeFilePath = path.join(notesDir, welcomeNoteFilename)
    await fs.writeFile(welcomeFilePath, welcomeContent, fileEncoding)
    notes.push(getNotesInfoFromFilename(welcomeNoteFilename))
  }

  return notes.sort((a, b) => b.lastEditTime - a.lastEditTime)
}

export async function readNote(title: NoteInfo['title']): Promise<string> {
  const filePath = path.join(getNotesDir(), `${title}.md`)
  return fs.readFile(filePath, fileEncoding)
}

export async function writeNote(title: NoteInfo['title'], content: string): Promise<void> {
  const filePath = path.join(getNotesDir(), `${title}.md`)
  console.info('Writing note:', filePath)
  await fs.writeFile(filePath, content, fileEncoding)
}

export async function createNote(): Promise<NoteInfo['title'] | false> {
  const result = await dialog.showSaveDialog({
    title: 'New Note',
    defaultPath: getNotesDir(),
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    showsTagField: false,
    buttonLabel: 'Create',
    properties: ['showOverwriteConfirmation']
  })

  if (result.canceled || result.filePath == null) {
    return false
  }

  const filePath = result.filePath
  const parentDir = path.dirname(filePath)

  if (parentDir !== getNotesDir()) {
    await dialog.showMessageBox({
      type: 'error',
      message: 'Notes can only be created in the Notes directory.'
    })
    return false
  }

  const filename = path.basename(filePath, '.md')
  await fs.writeFile(filePath, '', fileEncoding)
  return filename
}

export async function deleteNote(title: NoteInfo['title']): Promise<boolean> {
  const result = await dialog.showMessageBox({
    type: 'warning',
    message: `Are you sure you want to delete "${title}"?`,
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    cancelId: 1
  })

  if (result.response === 1) {
    console.info('Delete cancelled')
    return false
  }

  const filePath = path.join(getNotesDir(), `${title}.md`)
  await fs.remove(filePath)
  return true
}
