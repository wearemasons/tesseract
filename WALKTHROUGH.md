Hi reviewer, welcome to Tesseract. Here's a quick tour of what you'll find and where everything lives.

## Repository

**GitHub:** https://github.com/wearemasons/tesseract

## Project Management

We used **GitHub Projects** (not Notion) to track our work. Our board with all issues, milestones, and sprint planning is here:

**GitHub Projects Board:** https://github.com/orgs/wearemasons/projects/3

## Submission Notes

Per the graduation project submission requirements (due **May 11, 2026** at 11:59 PM):

- The submission archive is named `23-Tesseract.zip`
- This `WALKTHROUGH.md` contains the GitHub repository link and (where applicable) the Notion workspace link — though we opted to use GitHub Projects for our workflow as it's more native to GitHub and better suited for our workflow
- A **demo video** demonstrating the functional application is included in the archive
- **Presentation slides** for the final presentation are also included

## What's Inside

| File | Purpose |
|---|---|
| `WALKTHROUGH.md` | This file — orientation for the reviewer |
| `demo-video.mp4` | Functional demo recording |
| `presentation.pptx` | Final presentation slides |
| `tesseract/README.md` | Project overview, features, tech stack, setup instructions |
| `tesseract/resources/welcome.md` | First-launch note shown to new users |
| `tesseract/src/` | All source code (main, preload, renderer, shared) |

## Quick Start

*we used [pnpm](https://pnpm.io/installation) as our package manager due to its speed and efficiency over npm, but you can use npm if you prefer to use it instead*
```bash
pnpm install
pnpm dev
```

Requires `OPENCODE_ZEN_API_KEY` in `.env` for AI features. See `README.md` for details.

---

*Built by Seif Zakaria, Omar Adel, Beshoy Mahrous, Boles Sa'ad — Masons*
