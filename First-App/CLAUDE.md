# First-App — Renewal Radar

Working rules for building the app specified in [PRD.md](PRD.md). PRD.md is the source of truth for features and behavior — don't add anything that isn't in it. This file is the source of truth for *how* to build it.

## What this is

- **Course:** ENTP 6314 (Fall 2026), UT Dallas.
- **App:** Renewal Radar — see [PRD.md](PRD.md) for the full spec.
- **Status:** Building in phases (see "How to work" below).

## Tech stack (fixed)

- Plain HTML, CSS, and JavaScript. No frameworks, no libraries, no build step, no npm dependencies.
- Browser `localStorage` for saving data.
- Hosted on Vercel, as its own Vercel project (`first-app`), deployed from this `First-App` folder.

## Files

- `index.html`
- `styles.css`
- `app.js` — page rendering and user interaction.
- `calculations.js` — all date and money logic, as pure functions that take `today` as a parameter.
- `storage.js` — all `localStorage` access, wrapped in try/catch.
- `tests/calculations.test.js` — uses Node's built-in `node:assert`, covers every PRD test case.
- `package.json` — `"type": "module"`, no dependencies, a `test` script that runs the test file.
- `BUILD_LOG.md` — see "Build log" below.

## Coding rules

- Load JavaScript with `<script type="module">`.
- Use relative paths starting with `./` — keeps links working the same locally and once deployed, regardless of hosting path.
- Never parse dates with `new Date("YYYY-MM-DD")` — it reads as UTC and shows the previous day in US time zones. Build dates from year, month, and day numbers instead (e.g. `new Date(year, month - 1, day)` for local-date construction, or `Date.UTC(year, month - 1, day)` when working in UTC).
- Count days using `Date.UTC` differences, not local-time subtraction.
- Write readable code that can be explained in class: plain `if` statements, named functions, no clever one-liners. Comments only for non-obvious date logic — not for things the code already says clearly.
- Don't add features, abstractions, or files beyond what PRD.md and this file call for.

## Running locally

```
npx serve
```

Module scripts (`<script type="module">`) don't load when `index.html` is opened directly from the filesystem (`file://`), so always use a local server.

## Running tests

```
npm test
```

Runs `tests/calculations.test.js` against Node's built-in `node:assert`. A phase is not done until this passes.

## Deploying (Vercel)

Renewal Radar stays in this `First-App` folder within the `entp-6314` repo and deploys to Vercel as its **own Vercel project**, per the workflow already documented in the course workspace's [../CLAUDE.md](../CLAUDE.md). From inside this `First-App` folder:

```
vercel link --yes --project first-app   # one time — creates the Vercel project
vercel                                   # preview deployment (throwaway URL)
vercel --prod                            # promote to the production URL
```

Notes:

- `.vercel/` and `.env*` are git-ignored (Vercel creates them on link). Never commit them.
- Since there's no build step, the Vercel "build" is just serving the static files as-is.
- For push-to-deploy, connect the GitHub repo in the Vercel project's Git settings and set **Root Directory** to `First-App` — this is what lets the app deploy correctly even though it lives in a subfolder of the `entp-6314` repo, unlike GitHub Pages.

## How to work

- Build one phase at a time, in the order given in PRD.md's "Build phases" section.
- A phase is done only when `npm test` passes (and, for phases without new test cases, when its own PRD "done when" check is satisfied).
- Pause after every phase. Summarize what was built and exactly how it can be checked (commands to run, what to click, what to look for).
- Commit after each phase completes. Push only when explicitly asked to.
- Never say something works without having run it. If something can't be checked from here — how it looks on a real phone, actual Vercel behavior after a deploy, etc. — say so explicitly instead of assuming it's fine.

## Build log

`BUILD_LOG.md` records every failure: errors, failing tests, wrong results, deployment problems, or a change of approach — even ones that were quick to fix. For each, append an entry (never edit or remove earlier entries) with:

- **Phase**
- **Symptom** — the exact error message or wrong result observed
- **Cause**
- **Fix**

## Repo / workflow

- **GitHub:** `geneferns23/entp-6314` (private). This app lives in the `First-App` folder within it.
- **Branch:** `main`. Commit after each phase; push only when asked.
- Typical loop: edit → `git add -A` → `git commit -m "..."` → (when asked) `git push` → `vercel --prod` (or automatic if Git integration is connected).

## Environment (Windows)

Installed via winget; available in any new terminal:

- **Git** — `C:\Program Files\Git`
- **GitHub CLI** (`gh`) — authenticated as `geneferns23`; also configured as Git's credential helper, so `git push` needs no password.
- **Node.js 24 LTS** + **npm**, and **Vercel CLI** (`vercel`), logged in as `geneferns23` (scope `gen-5be7`).
