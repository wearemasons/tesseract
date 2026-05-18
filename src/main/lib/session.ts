import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs-extra'
import { homedir } from 'os'
import { appDirectoryName } from '@shared/constants'

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

const getDbPath = (): string => {
  const dir = path.join(homedir(), appDirectoryName)
  fs.ensureDirSync(dir)
  return path.join(dir, 'tesseract.db')
}

let db: Database.Database | null = null

export const getDb = (): Database.Database => {
  if (!db) {
    db = new Database(getDbPath())
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    migrate()
  }
  return db
}

const migrate = (): void => {
  const hasSchemaTable = db!
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'")
    .get()
  const currentVersion = hasSchemaTable
    ? ((
        db!.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get() as {
          version: number
        }
      )?.version ?? 0)
    : 0

  if (currentVersion < 1) {
    db!.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);

      CREATE TABLE IF NOT EXISTS sessions (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at       INTEGER NOT NULL,
        label            TEXT,
        app_mode         TEXT NOT NULL DEFAULT 'notes',
        selected_note    TEXT,
        sidebar_open     INTEGER NOT NULL DEFAULT 1,
        font_size        INTEGER NOT NULL DEFAULT 18,
        autocomplete_on  INTEGER NOT NULL DEFAULT 1,
        theme            TEXT NOT NULL DEFAULT 'dark',
        active_theme_css TEXT
      );

      CREATE TABLE IF NOT EXISTS ai_messages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role       TEXT NOT NULL,
        content    TEXT NOT NULL,
        timestamp  INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS council_messages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        persona    TEXT NOT NULL,
        content    TEXT NOT NULL,
        timestamp  INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS note_meta (
        note_title      TEXT PRIMARY KEY,
        scroll_position REAL,
        cursor_offset   INTEGER,
        updated_at      INTEGER NOT NULL
      );

      INSERT INTO schema_version (version) VALUES (1);
    `)
  }

  if (currentVersion < 2) {
    db!.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      INSERT OR REPLACE INTO schema_version (version) VALUES (2);
    `)
  }

  if (currentVersion < 3) {
    const hasColumn = db!
      .prepare("SELECT name FROM pragma_table_info('sessions') WHERE name = 'ai_sidebar_width'")
      .get()
    if (!hasColumn) {
      db!.exec(`ALTER TABLE sessions ADD COLUMN ai_sidebar_width INTEGER;`)
    }
    db!.exec(`INSERT OR REPLACE INTO schema_version (version) VALUES (3);`)
  }

  if (currentVersion < 4) {
    db!.exec(`
      DROP TABLE IF EXISTS schema_version;
      CREATE TABLE schema_version (version INTEGER PRIMARY KEY);
      INSERT OR REPLACE INTO schema_version (version) VALUES (4);
    `)
  }
}

export const closeDb = (): void => {
  if (db) {
    db.close()
    db = null
  }
}

export const createSession = (): number => {
  const d = getDb()
  const now = Date.now()
  const label = `Session — ${new Date(now).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`
  const result = d.prepare(`INSERT INTO sessions (created_at, label) VALUES (?, ?)`).run(now, label)
  return Number(result.lastInsertRowid)
}

export const updateSession = (
  id: number,
  data: {
    app_mode?: string
    selected_note?: string | null
    sidebar_open?: boolean
    font_size?: number
    autocomplete_on?: boolean
    theme?: string
    active_theme_css?: string | null
    ai_sidebar_width?: number | null
  }
): void => {
  const d = getDb()
  const sets: string[] = []
  const vals: (string | number | null)[] = []

  if (data.app_mode !== undefined) {
    sets.push('app_mode = ?')
    vals.push(data.app_mode)
  }
  if (data.selected_note !== undefined) {
    sets.push('selected_note = ?')
    vals.push(data.selected_note)
  }
  if (data.sidebar_open !== undefined) {
    sets.push('sidebar_open = ?')
    vals.push(data.sidebar_open ? 1 : 0)
  }
  if (data.font_size !== undefined) {
    sets.push('font_size = ?')
    vals.push(data.font_size)
  }
  if (data.autocomplete_on !== undefined) {
    sets.push('autocomplete_on = ?')
    vals.push(data.autocomplete_on ? 1 : 0)
  }
  if (data.theme !== undefined) {
    sets.push('theme = ?')
    vals.push(data.theme)
  }
  if (data.active_theme_css !== undefined) {
    sets.push('active_theme_css = ?')
    vals.push(data.active_theme_css)
  }
  if (data.ai_sidebar_width !== undefined) {
    sets.push('ai_sidebar_width = ?')
    vals.push(data.ai_sidebar_width)
  }

  if (sets.length === 0) return
  vals.push(id)
  d.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
}

export const getLatestSession = (): SessionRow | null => {
  const d = getDb()
  const row = d.prepare('SELECT * FROM sessions ORDER BY id DESC LIMIT 1').get() as
    | SessionRow
    | undefined
  return row ?? null
}

export const listSessions = (): SessionRow[] => {
  const d = getDb()
  return d.prepare('SELECT * FROM sessions ORDER BY id DESC LIMIT 50').all() as SessionRow[]
}

export const getSession = (id: number): SessionRow | null => {
  const d = getDb()
  const row = d.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined
  return row ?? null
}

export const getAiMessages = (sessionId: number): AIMessageRow[] => {
  const d = getDb()
  return d
    .prepare('SELECT * FROM ai_messages WHERE session_id = ? ORDER BY id ASC')
    .all(sessionId) as AIMessageRow[]
}

export const getCouncilMessages = (sessionId: number): CouncilMessageRow[] => {
  const d = getDb()
  return d
    .prepare('SELECT * FROM council_messages WHERE session_id = ? ORDER BY id ASC')
    .all(sessionId) as CouncilMessageRow[]
}

export const saveAiMessage = (sessionId: number, role: string, content: string): void => {
  const d = getDb()
  d.prepare(
    'INSERT INTO ai_messages (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)'
  ).run(sessionId, role, content, Date.now())
}

export const saveCouncilMessage = (sessionId: number, persona: string, content: string): void => {
  const d = getDb()
  d.prepare(
    'INSERT INTO council_messages (session_id, persona, content, timestamp) VALUES (?, ?, ?, ?)'
  ).run(sessionId, persona, content, Date.now())
}

export const clearAiMessages = (sessionId: number): void => {
  const d = getDb()
  d.prepare('DELETE FROM ai_messages WHERE session_id = ?').run(sessionId)
}

export const deleteSession = (id: number): void => {
  const d = getDb()
  d.prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

export const getWindowState = (): {
  x: number | null
  y: number | null
  width: number
  height: number
  maximized: boolean
} | null => {
  const d = getDb()
  const row = d.prepare('SELECT value FROM meta WHERE key = ?').get('window_state') as
    | { value: string }
    | undefined
  if (!row) return null
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}

export const setWindowState = (state: {
  x?: number | null
  y?: number | null
  width: number
  height: number
  maximized: boolean
}): void => {
  const d = getDb()
  const existing = d
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meta'")
    .get()
  if (!existing) {
    d.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
  }
  d.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(
    'window_state',
    JSON.stringify(state)
  )
}

export const getMeta = (key: string): string | null => {
  const d = getDb()
  try {
    const existing = d
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meta'")
      .get()
    if (!existing) return null
    const row = d.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
      | { value: string }
      | undefined
    return row?.value ?? null
  } catch {
    return null
  }
}

export const setMeta = (key: string, value: string): void => {
  const d = getDb()
  try {
    const existing = d
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meta'")
      .get()
    if (!existing) {
      d.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    }
    d.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value)
  } catch {
    // meta table might not exist in older schemas; create it
    d.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    d.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value)
  }
}
