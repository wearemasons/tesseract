# Tesseract

> A local-first Markdown editor that thinks with you.

Tesseract starts as a clean, distraction-free note-taking app. Under the hood, it's the foundation for something bigger: an **Integrated Thinking Environment** — a writing space that understands your mood, recalls your history, and actively helps you think, not just store thoughts.

---

## What's in the MVP

The current version is a fully functional desktop note editor built with Electron + React. No cloud. No accounts. Your notes live as plain `.md` files on your machine.

**Features:**

- Real-time Markdown rendering via MDX Editor
- Auto-save with 3s throttle + save-on-blur
- Sidebar with note list sorted by last edited
- Create and delete notes via native OS dialogs
- Welcome note on first launch
- Frosted glass UI with draggable titlebar

---

## Where This Is Going

The MVP is just the shell. The full product layers AI on top of it — powered by [OpenRouter](https://openrouter.ai) for model flexibility — turning it into what I'm calling an **ITE: Integrated Thinking Environment**.

Think of it as Cursor, but for your brain.

### Mood-Aware Interface

A local sentiment analysis engine reads your writing in real-time and detects your current mental state. The AI adapts accordingly:

- **Stressed or venting?** The assistant shifts to a supportive, coaching mode — asks reflective questions, helps you decompress.
- **Focused and technical?** It becomes concise, logical, and stays out of your way.

### Dynamic Tooling

Intent detection triggers purpose-built tools automatically. Write _"I need to plan my week"_ and instead of a chat bubble, a time-planning agent spins up, generates schedule variations, and writes the result directly into your Markdown file with checkboxes.

### Total Recall (RAG)

The app indexes all your notes and uses RAG to surface relevant context as you write. Planning your week? It'll remind you about the task you didn't finish last Tuesday. Writing about a project? It'll link notes you wrote six months ago.

### Council of Thought

Sometimes you don't need validation — you need a fight. Highlight any idea and hit **Debate**. Three AI personas go at it:

- **The Visionary** — argues the upside and potential
- **The Skeptic** — attacks flaws, risks, and blind spots
- **The Pragmatist** — focuses on execution and resources

You watch the debate, then make the final call as the Judge.

---

## Tech Stack

| Layer             | Tech                              |
| ----------------- | --------------------------------- |
| Desktop shell     | Electron + electron-vite          |
| UI                | React + TypeScript + Tailwind CSS |
| Editor            | MDX Editor                        |
| State             | Jotai                             |
| File system       | fs-extra                          |
| AI (full version) | OpenRouter                        |

Notes are stored as `.md` files under `~/NoteShark/` on your machine.

---

## Getting Started

```bash
pnpm install
pnpm dev
```

### Build

```bash
pnpm build        # type-check + bundle
pnpm build:mac    # macOS installer
pnpm build:win    # Windows installer
pnpm build:linux  # Linux installer
```

---

## Project Structure

```
src/
├── main/          # Electron main process (file system, IPC handlers)
│   └── lib/       # getNotes, readNote, writeNote, createNote, deleteNote
├── preload/       # Context bridge — exposes safe API to renderer
├── renderer/
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # useNotesList, useMarkdownEditor
│       ├── store/        # Jotai atoms
│       └── utils/        # cn helper, date formatter
└── shared/        # Types, models, constants shared across all processes
```

---

## Status

This is a graduation project MVP. The note editor is feature-complete. AI integration is next.

Built by [Seif Zakaria](https://www.seifzellaban.wiki), Omar Adel, Beshoy Mahrous, Boles Sa'ad — Masons
