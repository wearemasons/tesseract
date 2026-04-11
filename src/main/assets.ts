import { join } from 'path'

export function getWelcomeNoteAssetPath(): string {
  return join(__dirname, '../../resources/welcome.md')
}
