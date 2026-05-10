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

| Layer | Tech |
|---|---|
| Desktop shell | Electron + electron-vite |
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Editor | MDX Editor (Lexical) |
| State | Jotai |
| File system | fs-extra |
| AI inference | OpenCode Zen API (`big-pickle` model) |
| UI components | shadcn/ui (Dialog, Command, Button) |
| Icons | lucide-react via react-icons/lu |
| Plugins | Tailwind Typography, tailwindcss-animate |

Notes are stored as `.md` files under `~/Tesseract/Notes/`.

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

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts           # Window creation, IPC handlers
│   ├── assets.ts          # Asset path resolution
│   └── lib/
│       ├── index.ts       # File system operations (CRUD notes)
│       └── ai.ts          # Zen API inference (chat, autocomplete)
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
│       │   ├── ActivityBar.tsx     # Mode switcher (Notes/AI/Council)
│       │   └── ...
│       ├── hooks/         # useNotesList, useMarkdownEditor
│       ├── store/         # Jotai atoms (theme, mode, notes, AI, etc.)
│       └── utils/         # cn helper, date formatter, AI utilities
├── shared/                # Types, models, constants shared across processes
└── resources/
    └── welcome.md         # First-launch welcome note
```

---

## License

Built by [Seif Zakaria](https://seifzellaban.wiki), Omar Adel, Beshoy Mahrous, Boles Sa'ad — [Masons](https://wearemasons.com)
