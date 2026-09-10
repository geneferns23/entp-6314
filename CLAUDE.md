# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Coursework for **ENTP 6314 (Fall 2026, UT Dallas)** — a workspace, not a single application. It holds the syllabus and reading PDFs (`ENTP6314-Fall2026-Syllabus-Graduate.pdf`, `Articles/`) alongside build exercises. The course is about building apps with AI, so each exercise is a small web app produced from a prompt.

Treat each app folder as an **independent project**. There is no shared code, no framework, no monorepo tooling, no `package.json` anywhere. Do not try to unify the exercises or introduce a common build system unless asked.

## Layout

- `Session Exercises/SessionN_*/` — one self-contained app per folder.
- `First-App/` — the first app beyond the exercises. Currently empty except its own `CLAUDE.md` (a starter to fill in once an idea/stack is chosen). Nested `CLAUDE.md` files are the convention here: put app-specific guidance next to the app.
- `Articles/`, root `*.pdf` — course materials, not code.

### The Session 2 pair

`Session2_BadPrompt/` and `Session2_DetailedPrompt/` are the **same brief** (a tip splitter) built from a vague prompt vs. a detailed one — kept side by side to compare output quality. They are not versions of one app; don't merge them or port features between them. DetailedPrompt is the richer build (uneven split, round-up, copy-to-clipboard, per-guest state); BadPrompt is simpler (integer-cents math, animated total, dark mode).

## Exercise app conventions

Each exercise is a **single `index.html`** with everything inline and no dependencies:

- Inline `<style>` with CSS custom properties as design tokens; inline `<script>` as one IIFE with `"use strict"`.
- ES5 style — `var`, no build/transpile, no modules, no external requests. Must work offline when opened as a file.
- Money math done in integer cents (or equivalent) to avoid rounding drift.
- Mobile/accessibility touches are expected: `inputmode` on numeric inputs, `aria-*`, `prefers-reduced-motion`, `prefers-color-scheme`.

Keep new exercises to this shape unless the exercise explicitly calls for a stack/build step.

## Running locally

No build or test step. Open the folder's `index.html` in a browser, or serve it: `npx serve "Session Exercises/Session2_DetailedPrompt"`.

## Deploying (Vercel)

**One Vercel project per app folder.** From inside the app folder:

```
vercel link --yes --project <lowercase-name>   # first time
vercel                                          # preview URL
vercel --prod                                   # production URL
```

- `Session Exercises/Session2_DetailedPrompt/` is linked to project `session2-detailedprompt` → https://session2-detailedprompt.vercel.app
- The repo **root** is also linked (project `entp-6314`) but unused — do not run `vercel` from the root; it would deploy PDFs and have no `/` page.
- `.vercel/` and `.env*` are git-ignored; never commit them.
- Static HTML needs no build config — Vercel serves the folder as-is.

## Git

- Remote: `geneferns23/entp-6314` (private, GitHub). Branch `main`, commit and push directly.
- `gh` is configured as Git's credential helper, so `git push` needs no prompt.
- Standard loop: edit → `git add -A` → `git commit` → `git push` (→ `vercel --prod` if the app changed).

## Environment (Windows / this machine)

Installed via winget, on `PATH` in a fresh terminal: **Git** (`C:\Program Files\Git`), **GitHub CLI** (`gh`, authed as `geneferns23`), **Node.js 24 LTS** + npm, **Vercel CLI** (`vercel`, authed, scope `gen-5be7`).
