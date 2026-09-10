# First-App

Starter guidance for Claude Code. Fill in the `TBD` sections once the app takes shape.

## What this is

- **Course:** ENTP 6314 (Fall 2026), UT Dallas.
- **Purpose:** TBD — the first "real" app for the course, beyond the Session Exercises.
- **Idea / scope:** TBD.
- **Status:** Not started. This folder is currently empty except for this file.

## Tech stack

TBD. Not yet chosen. Options under consideration:

- **Plain HTML/CSS/JS** — single `index.html`, no build step. Matches the Session 2 exercises; simplest to deploy.
- **Vite + vanilla JS** — dev server, npm dependencies, a build step.
- **React (Vite)** — component-based; use if the app needs real state/interactivity.

When the stack is chosen, replace this section with the actual setup and delete the options that don't apply.

## Running locally

TBD — depends on stack.

- Plain HTML: open `index.html` in a browser, or run `npx serve` from this folder.
- Vite: `npm install` then `npm run dev`.

## Deploying (Vercel)

This project deploys to Vercel as its **own project**, separate from the repo. From inside this `First-App` folder:

```
vercel link --yes --project first-app   # one time — creates the Vercel project
vercel                                   # preview deployment (throwaway URL)
vercel --prod                            # promote to the production URL
```

Notes:

- `.vercel/` and `.env*` are git-ignored (Vercel creates them on link). Never commit them.
- The repo root also has a `.vercel` link to an unused `entp-6314` project — ignore it; deploy from this folder only.
- For push-to-deploy, connect the GitHub repo in the Vercel project's Git settings and set **Root Directory** to `First-App`.

## Repo / workflow

- **GitHub:** `geneferns23/entp-6314` (private).
- **Branch:** `main`. Commit + push directly for now.
- Typical loop: edit → `git add -A` → `git commit -m "..."` → `git push` → `vercel --prod` (or automatic if Git integration is connected).

## Environment (Windows)

Installed via winget; available in any new terminal:

- **Git** — `C:\Program Files\Git`
- **GitHub CLI** (`gh`) — authenticated as `geneferns23`; also configured as Git's credential helper, so `git push` needs no password.
- **Node.js 24 LTS** + **npm**, and **Vercel CLI** (`vercel`), logged in as `geneferns23` (scope `gen-5be7`).

## Conventions

TBD. Add code style, file layout, and naming rules here once there's code to be consistent with.
