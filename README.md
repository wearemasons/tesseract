# Tesseract

> A local-first, AI-enhanced markdown notebook.

Tesseract is an Integrated Thinking Environment — a desktop app for writing notes, conversing with AI about them, and convening a council of personas to pressure-test your ideas. No cloud, no accounts. Your notes live as plain `.md` files on your machine.

---

## Features

### Notes Mode

Rich markdown editing via MDX Editor (Lexical-based) with real-time rendering, auto-save (3s throttle + save-on-blur), and a sidebar sorted by last edit time. Create and delete notes via native OS dialogs.

### AI Companion

An AI sidebar powered by [OpenCode Zen](https://opencode.ai/zen) that answers questions about your current note. Type `/write` to have the AI rewrite the full note — it sees the entire document and outputs complete updated markdown.

### Council of Thought

A multi-perspective debate arena where three AI personas argue your idea:

- **The Visionary** — argues the upside and potential
- **The Skeptic** — attacks flaws, risks, and blind spots
- **The Pragmatist** — focuses on execution and resources

### Command Palette

`Ctrl+K` opens a searchable command palette with controls for font size (inc/dec/reset), toggling dark/light theme, picking color themes, and toggling code autocomplete.

### Color Themes

`Ctrl+K` → "Pick Theme..." opens a theme picker dialog with multiple color schemes. Each theme overrides the app's CSS custom properties — currently includes Default, Amber Glow, Violet, Valentine, Gothic, Kodama Grave, and Masons.

### Code Autocomplete

AI-powered inline autocomplete as you type. Toggle with `Alt+A`. Accept suggestions with `Ctrl+Space` or `Tab`. Visual border-flash feedback when toggled.

### Shared Config

Keyboard shortcuts:
| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open command palette |
| `Ctrl+B` | Toggle notes sidebar |
| `Ctrl+Shift+B` | Toggle AI sidebar |
| `Alt+A` | Toggle code autocomplete |
| `Ctrl+Space` / `Tab` | Accept autocomplete suggestion |

Window remembers a minimum size of 800×500.

---

## Tech Stack

| Layer         | Tech                                     |
| ------------- | ---------------------------------------- |
| Desktop shell | Electron + electron-vite                 |
| UI            | React 19 + TypeScript + Tailwind CSS v4  |
| Editor        | MDX Editor (Lexical)                     |
| State         | Jotai                                    |
| Persistence   | better-sqlite3 + fs-extra                |
| AI inference  | OpenCode Zen API (`big-pickle` model)    |
| UI components | shadcn/ui (Dialog, Command, Button)      |
| Icons         | lucide-react via react-icons/lu          |
| Plugins       | Tailwind Typography, tailwindcss-animate |

Notes are stored as `.md` files under `~/Tesseract/Notes/`. Sessions and messages in SQLite at `~/Tesseract/tesseract.db`.

---

## Getting Started

```bash
pnpm install
pnpm dev
```

### Environment

Copy `.env.example` to `.env` and set your API key:

```bash
OPENCODE_ZEN_API_KEY=your_key_here
```

Get a key at [opencode.ai/zen](https://opencode.ai/zen).

### Build

```bash
pnpm build          # type-check + bundle
pnpm build:mac      # macOS installer
pnpm build:win      # Windows installer
pnpm build:linux    # Linux installer
```

---

## Architecture

### Process Model

```
┌─────────────────────────────────────────────────┐
│ Main Process  (src/main/)                       │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ index.ts     │  │ lib/session.ts          │  │
│  │ · Window mgmt│  │ · SQLite (better-sql.)  │  │
│  │ · IPC router │  │ · Schema migrations     │  │
│  │ · State sav  │  │ · CRUD: sessions, msgs  │  │
│  └──────┬───────┘  └─────────────────────────┘  │
│         │                                       │
│    ipcMain.handle / ipcMain.on                  │
│         │                                       │
├─────────┼───────────────────────────────────────┤
│         │                                       │
│  Preload (src/preload/)                         │
│  ┌──────────────────────────────────────────┐   │
│  │contextBridge.exposeInMainWorld('context')│   │
│  │  · Notes API  · AI API  · Session API    │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                           │
├─────────────────────┼───────────────────────────┤
│                     │                           │
│ Renderer (src/renderer/)                        │
│  ┌──────────────────────────────────────────┐   │
│  │ React + Jotai                            │   │
│  │  · App.tsx — layout, keyboard shortcuts  │   │
│  │  · store/ — atoms (mode, messages, theme)│   │
│  │  · store/sessionStorage.ts — persistence │   │
│  │  · components/ — UI                      │   │
│  │     ResizableSidebar — draggable panels  │   │
│  │     AICompanion — AI chat                │   │
│  │     CouncilArena — multi-persona debate  │   │
│  │     SessionPicker — historical sessions  │   │
│  │     CommandPalette — Ctrl+K palette      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Main Process

Window creation, lifecycle, and IPC routing. All system calls — file I/O, AI inference, database queries — live here under strict `contextIsolation`. The process registers ~20 `ipcMain.handle` channels split into three domains: **notes** (CRUD on `.md` files), **AI** (generate + autocomplete), and **session** (SQLite persistence).

#### Preload

A thin context bridge (`contextBridge.exposeInMainWorld`) that exposes typed APIs to the sandboxed renderer. The `SessionApi` surface includes `loadLatest`, `saveAiMessage`, `update`, `list`, `delete`, and session picker methods. Every call passes through `ipcRenderer.invoke`.

#### Renderer

React 19 with Jotai for state. Atoms fall into three tiers:

- **Ephemeral** — `commandPaletteOpenAtom`, `selectedNoteIndexAtom` (reset on reload)
- **localStorage-persisted** — `themeAtom` (via `atomWithStorage`)
- **SQLite-persisted** — `appModeAtom`, `fontSizeAtom`, `aiMessagesAtom`, `councilMessagesAtom`, `aiSidebarWidthAtom` (synced via `sessionStorage.ts`)

### Session Persistence

```
User opens app
  │
  ├─ Main process restores latest session from SQLite
  │  (sets activeSessionId before window loads)
  │
  ├─ Renderer mounts → useSessionManager()
  │   └─ Calls loadLatest() → gets session + messages from IPC
  │   └─ Hydrates atoms (mode, fontSize, messages, sidebarWidth, …)
  │
  ├─ User interacts
  │   ├─ UI state → debounced session.update() → SQLite
  │   ├─ AI message → persistAiMessage() → SQLite
  │   └─ Council message → persistCouncilMessage() → SQLite
  │
  └─ Window closes
      └─ Window bounds saved to meta table
```

SQLite schema (`~/Tesseract/tesseract.db`):

- `sessions` — per-session UI state (mode, font size, theme, sidebar width, …)
- `ai_messages` — AI chat history (role, content, timestamp, FK → sessions)
- `council_messages` — Council debate log (persona, content, timestamp, FK → sessions)
- `meta` — key-value store (window bounds, active session id)
- `schema_version` — migration tracking

### Data Flow

| Data             | Storage                                  | Access                                           |
| ---------------- | ---------------------------------------- | ------------------------------------------------ |
| Notes            | `~/Tesseract/Notes/*.md`                 | Main process `fs-extra`, IPC to renderer         |
| Session state    | SQLite `sessions` table                  | IPC → sessionStorage.ts → Jotai atoms            |
| AI messages      | SQLite `ai_messages` table               | Per-append persist, bulk load on session restore |
| Council messages | SQLite `council_messages` table          | Per-append persist, bulk load on session restore |
| Window bounds    | SQLite `meta` table (key=`window_state`) | On close + debounced on resize/move              |
| Theme preference | localStorage                             | `atomWithStorage('theme')`                       |
| AI response      | Transient (not stored)                   | Generated on demand via Zen API                  |

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # Window creation, IPC handlers
│   ├── assets.ts          # Asset path resolution
│   └── lib/
│       ├── index.ts       # File system operations (CRUD notes)
│       ├── ai.ts          # Zen API inference (chat, autocomplete)
│       └── session.ts     # SQLite session persistence (better-sqlite3)
├── preload/               # Context bridge — exposes safe API to renderer
├── renderer/
│   └── src/
│       ├── assets/
│       │   ├── main.css   # Tailwind v4 imports + theme CSS variables
│       │   ├── base.css   # Base styles, autocomplete animation
│       │   └── themes/    # Color theme CSS files + index.ts
│       ├── components/
│       │   ├── ui/        # shadcn/ui primitives (button, dialog, command)
│       │   ├── MarkdownEditor/  # Autocomplete plugin, node, MDX plugin
│       │   ├── AICompanion.tsx  # AI chat sidebar
│       │   ├── CouncilArena.tsx # Multi-persona debate view
│       │   ├── CommandPalette.tsx  # Ctrl+K command palette
│       │   ├── ThemePicker.tsx     # Color theme picker dialog
│       │   ├── SessionPicker.tsx   # Historical session loader
│       │   ├── ResizableSidebar.tsx # Draggable resizable panel
│       │   ├── ActivityBar.tsx     # Mode switcher (Notes/AI/Council)
│       │   └── ...
│       ├── hooks/         # useNotesList, useMarkdownEditor
│       ├── store/         # Jotai atoms (theme, mode, notes, AI, etc.)
│       │   └── sessionStorage.ts # Atom ↔ SQLite sync (save/restore)
│       └── utils/         # cn helper, date formatter, AI utilities
├── shared/                # Types, models, constants shared across processes
└── resources/
    └── welcome.md         # First-launch welcome note
```

---

## License

Built by [Seif Zakaria](https://seifzellaban.wiki), Omar Adel, Beshoy Mahrous, Boles Sa'ad — [Masons](https://wearemasons.com)
