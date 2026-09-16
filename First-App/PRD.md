# Renewal Radar — Product Requirements Document

**Course:** ENTP 6314 (Fall 2026), UT Dallas
**Status:** Approved for build

## Value proposition

"The subscription tracker that shows what's renewing before it charges you."

## Target user

People with several recurring subscriptions who don't want to connect a bank account to a finance app.

## Problem / scope

The app does one thing: show what is renewing soon, what it will cost, and when to cancel by. No accounts, no bank connections, no backend — everything lives in the user's browser.

## Tech stack

Plain HTML/CSS/JS. A single `index.html` (plus `style.css` and one or more `.js` files as needed), no build step, no npm dependencies. Matches the Session 2 exercises and keeps deployment simple.

## Running locally

Open `index.html` directly in a browser, or run `npx serve` from this folder for a local server.

## Deployment

Vercel, per the workflow documented in [CLAUDE.md](CLAUDE.md):

```
vercel link --yes --project first-app   # one time
vercel                                   # preview deployment
vercel --prod                            # promote to production
```

Since there's no build step, the Vercel "build" is just serving the static files as-is. The app stays in the `First-App` folder of the `entp-6314` repo; the Vercel project's Root Directory is set to `First-App` so it deploys correctly from that subfolder.

## Data storage

`localStorage`, under a single namespaced key (e.g. `renewal-radar-subscriptions`). The app stores each subscription's **entered fields only** — name, cost, frequency, anchor renewal date, notice days, and (if completed) the renewal review answers + date. Next renewal, days-away, status, and cancel-by are **never stored** — they are computed at render time from today's date and the stored anchor date, per the date rules below.

## Data model (per subscription)

| Field | Type | Rules |
|---|---|---|
| `id` | string | Generated (e.g. timestamp or random), not user-facing |
| `name` | string | Required, max 60 characters |
| `cost` | number | Required, > 0 |
| `frequency` | enum | `monthly` \| `quarterly` \| `annual` |
| `anchorDate` | date (ISO string) | Required; the renewal date the user entered. Past dates allowed. Never overwritten. |
| `noticeDays` | integer \| null | Optional. Whole number, 1–365. Blank = null = no notice needed. |
| `review` | object \| null | `{ usedRecently: 'yes'\|'no', wouldSignUpAgain: 'yes'\|'no'\|'unsure', hasSimilarAlternative: 'yes'\|'no'\|'unsure', answeredOn: date }`. Null until a review is submitted. |

## Features

### 1. Add a subscription

A form with the fields above. Inline validation errors shown next to each invalid field, on submit (and ideally on blur):

- Name: required; error if empty or over 60 characters.
- Cost: required; error if not a number or not greater than 0.
- Frequency: required; one of the three options (default unselected, or default to `monthly` — implementer's choice, but must be an explicit user choice or a sensible default the user can see and change).
- Next renewal date: required; any date accepted, including past dates.
- Cancellation notice: optional; if provided, must be a whole number between 1 and 365. Blank is valid and means "no notice needed."

On valid submit, the subscription is added to the list and persisted to `localStorage` immediately.

### 2. Subscription list

- Sorted by nearest computed next renewal date (soonest first).
- Each card shows:
  - Name
  - Cost + billing frequency (e.g. "$12.99 / monthly")
  - Next renewal date (computed, see date rules)
  - Relative renewal text: "Renews today", "Renews tomorrow", or "Renews in N days"
  - Cancel-by date, only if notice days is set (see date rules for the "deadline passed" case)
  - A status label as **visible text**, not color alone:
    - **Renewing soon** — 0–7 days away
    - **Coming up** — 8–30 days away
    - **Later** — 31+ days away
  - A "Start renewal review" button (see Feature 5) and, once a review exists, the review result message.
  - An edit control (see Feature 9) and a delete control (see Feature 4).

### 3. Summary total

Shown at the top of the page: the sum of actual per-cycle charges (not annualized) for every subscription whose **computed next renewal** falls within the next 0–30 days (inclusive), counting each subscription's next charge exactly once. Subscriptions renewing today count. Subscriptions renewing in 31+ days are excluded. Recomputed on every render — never stored.

### 4. Delete a subscription

A delete control on each card opens a confirmation (e.g. a confirm dialog or an inline "Are you sure?" state) before removing the subscription from the list and from `localStorage`.

### 5. Renewal review

Started from a button on each card. Presents exactly three required questions:

1. "Have you used this recently?" — Yes / No
2. "If deciding today, would you sign up again?" — Yes / No / Not sure
3. "Do you have another service with a similar benefit?" — Yes / No / Not sure

The app has no category or type data for subscriptions (categories/tags are out of scope), so it cannot determine on its own whether two subscriptions serve a similar purpose — question 3 stays a self-report. To make it easier to answer accurately, the question lists the names of the user's other tracked subscriptions underneath it, so they don't have to recall their own list from memory. It is only a memory aid; the app still never judges similarity itself.

On submit, all three answers must be present. The answers and the submission date are saved onto the subscription (`review` field) and persisted. The card then displays the result message based on the answer combination:

| Q1 | Q2 | Q3 | Message |
|---|---|---|---|
| Yes | Yes | No | "Your answers indicate that this subscription is currently providing value for you." |
| No | No | Yes | "Your answers suggest this subscription may be worth reviewing before renewal." |
| *(any other combination)* | | | "Your answers are mixed. Consider reviewing the cost, usage, and alternatives before renewal." |

Always shown alongside the result, regardless of combination: **"This summary reflects your answers only. It isn't financial advice."**

The app must never phrase a message as a recommendation about what to do with money (e.g. never "you should cancel this").

A subscription can be re-reviewed; a new submission overwrites the previous `review` (answers + date).

### 6. Empty state

When there are zero subscriptions: show "No subscriptions yet" and a prompt/button to add the first one. No summary total or list rendered in this state.

### 7. Persistence

All additions, deletions, and review submissions are saved to `localStorage` immediately, so the data survives a page refresh. No expiration, sync, or export.

### 8. Starter data on first visit

The very first time the app loads in a browser that has never saved anything under its storage key, it seeds six example subscriptions instead of showing the empty state: covering all three status buckets, both a normal and an already-passed cancel-by date, both monthly and annual billing, and two free trials (named "(Free Trial)") with a short 1-3 day cancellation window, representing a subscription that hasn't started charging yet but will unless it's cancelled first. This is a one-time seed, not a reset: it is keyed off the storage key never having existed at all, not off the list being empty, so a user who deletes every subscription still sees the real empty state from Feature 6, not the starter data again.

### 9. Edit a subscription

An "Edit" control on each card puts the add-subscription form (Feature 1) into edit mode: the form is pre-filled with that subscription's current name, cost, frequency, renewal date, and notice days, the section heading changes to "Edit subscription," and the submit button changes to "Save changes." A "Cancel edit" control appears alongside it to leave edit mode without saving. Submitting in edit mode re-runs the exact same validation as adding, then updates that subscription's fields in place — its `id` and any saved `review` are left untouched. Only one subscription can be edited at a time; starting a new edit, saving, or cancelling replaces whatever was in progress. Deleting the subscription currently being edited cancels the edit.

## Date rules

- The anchor date is exactly what the user entered when adding the subscription — never recalculated or overwritten.
- Future renewals occur at anchor + (1, 3, or 12 months × k) for monthly/quarterly/annual respectively, where k = 0, 1, 2, ... — **always counted from the anchor**, never from the previous computed renewal.
- If the resulting day doesn't exist in the target month, use that month's last day (e.g. Jan 31 + 1 month → Feb 28 or 29).
- The **next renewal** is the first occurrence on or after today (today counts as 0 days away).
- **Cancel-by date** = next renewal − notice days.
  - If cancel-by is in the past but the renewal itself hasn't happened yet, show "Cancellation deadline passed" instead of a date.
- Nothing calculated (next renewal, days-away, status, cancel-by) is ever stored — always computed at display time from `anchorDate` + today's date.

### Test cases (today = 2026-09-15)

| Frequency | Anchor | Next renewal | Days away |
|---|---|---|---|
| monthly | 2026-08-15 | 2026-09-15 | 0 |
| monthly | 2026-08-14 | 2026-10-14 | 29 |
| monthly | 2026-01-31 | 2026-09-30 | 15 |
| quarterly | 2026-05-31 | 2026-11-30 | 76 |
| annual | 2024-02-29 | 2027-02-28 | 166 |

| Renewal | Notice | Cancel-by |
|---|---|---|
| 2026-09-29 | 7 days | 2026-09-22 |
| 2026-09-20 | 10 days | "Cancellation deadline passed" |

These exact cases are the acceptance test for the Phase 1 calculation logic.

## Design

A pastel palette, defined as CSS variables in `styles.css`.

**Neutrals**
- Page background `#EFE8DA`, card background `#FFFFFF`, borders `#DCD4C4`, text `#22252B`, muted text `#5F5E58`. (Page background and border were darkened slightly from the original `#FAF8F3` / `#E6E2D9` — against near-white, white cards didn't visibly separate from the page.)

**Blue — interactive only**
- Primary buttons: `#2A3A5C` background, white text.
- Links and focus outlines: `#2A3A5C`.
- Blue tint `#DCE4F2` with `#243452` text, for selected or hover states only.

**Blush — urgent**
- "Renewing soon" badge: `#F7DAD5` background, `#8A2E27` text.
- Urgent cards get a 3px `#C9665A` left border.
- Cancel-by dates within 7 days or already passed: `#8A2E27` bold text; otherwise normal text.
- Form errors: `#8A2E27`.

**Butter — soon**
- "Coming up" badge: `#F6EBC8` background, `#6B4E0F` text.

**Later**
- Plain muted text, no badge.

**Sage — confirmation only**
- "Subscription saved" confirmation: `#D8EBDD` background, `#2A5A40` text.

**Review results**
- Always neutral (muted text): "Reviewed [date]" plus the result message. Never colored.

**Delete**
- A muted gray text button.

**Shapes**
- Square card corners, 2px badge corners, no shadows, badge text at least 12px.

**Focus**
- 2px `#2A3A5C` outline, 2px offset.

**Never use:** pastel colors for text or button backgrounds, gradients, emoji, or pill-shaped badges.

**Typography**
- Headings (the app name, "Your subscriptions," "Add a subscription") use Fraunces, a serif display font loaded from Google Fonts, falling back to Georgia/serif. Body text, labels, and card content stay on the default system sans-serif — the serif is only for headings, so the page doesn't read as all one undifferentiated weight.
- A short 3px accent rule in the blush-border color sits under the app name, between it and the tagline.

**Layout**

- Page order: header, summary, the subscription list, then the add-subscription form. The list comes first because checking what's renewing is the app's primary reason to open it; adding a subscription is secondary.
- Each card shows the next renewal date and the relative renewal text on one combined line (e.g. "September 17, 2026 — Renews in 2 days") instead of two separate lines, since both describe the same underlying fact.
- Each card's "Start renewal review" / delete controls sit together below a divider line, visually separating the card's information from its actions.
- The add-subscription form pairs Cost with Billing frequency, and Next renewal date with Cancellation notice, side by side on wide screens; each pair wraps to stacked full-width fields on narrow screens (name stays full-width always).
- The subscription list is a responsive grid (cards at least 260px wide, as many columns as fit) rather than a single stacked column, so a wide screen shows more subscriptions without scrolling.

**Summary hero stat**

- The summary is one visual focal point, not a flat text line or a row of equal-weight tiles: a large, bold dollar amount ("renewing in the next 30 days") on a blush background, since that number is inherently the urgent one. Everything else about the summary — the subscription count, the "N subscriptions need attention" qualifier — is small, muted, plain text, so the eye has exactly one obvious place to land first.
- Hidden entirely in the empty state, same as before.

## Out of scope

Categories/tags, annualized cost display, user accounts, notifications/reminders, bank or card connections, any backend or server-side storage. (Seeded demo data and editing an existing subscription were both originally out of scope; see Feature 8 and Feature 9 — both were revisited once actually using the app made the gaps obvious.)

## Build phases

### Phase 0 — Placeholder page deployed
Deliverable: a static `index.html` with the app name and value proposition, deployed to production via Vercel.
**Done when:** the production Vercel URL loads the placeholder page with no errors.

### Phase 1 — Calculation logic with passing tests
Deliverable: `calculations.js`, a pure JS module implementing the date rules (next renewal, days-away, status bucket, cancel-by) as functions that take `today` as a parameter, with no UI.
**Done when:** `npm test` (running `tests/calculations.test.js` via Node's built-in `node:assert`) covers all cases from the "Test cases" table above and every one passes.

### Phase 2 — Core app: form, list, total, delete, empty state, saving
Deliverable: the add-subscription form with inline validation, the sorted list with status labels, the 0–30-day summary total, delete with confirmation, the empty state, and `localStorage` persistence.
**Done when:** a user can add a subscription, refresh the page and still see it, see it correctly sorted and labeled among others, see the summary total update correctly, delete it with a confirmation step, and see the empty state when the list is cleared — all without a console error.

### Phase 3 — Renewal review
Deliverable: the three-question review flow, the four result messages, the fixed disclaimer, and persistence of review answers + date.
**Done when:** submitting each of the three named answer combinations (Yes/Yes/No, No/No/Yes, and one other combination) shows the correct corresponding message plus the disclaimer, and the result persists across a refresh.

### Phase 4 — Polish, mobile layout, accessibility, live-site testing
Deliverable: responsive layout for mobile widths, keyboard navigability, status conveyed with text/icons (not color alone) verified visually, and a manual test pass on the deployed Vercel production URL covering every feature and all date-rule test cases.
**Done when:** the production site is usable end-to-end on a phone-width viewport and with keyboard-only navigation, and every test case and feature above has been manually verified on the live URL.

## Known limitations

- Single-device only: data lives in one browser's `localStorage` and does not sync across devices or browsers.
- No backup or export: clearing browser data or site storage permanently deletes all subscriptions.
- No reminders: the app must be opened to see what's renewing; it doesn't send notifications.
- Manual entry only: no bank/email integration, so accuracy depends on the user keeping entries up to date.
- Review guidance is generic and rule-based from three yes/no/unsure answers — it is not personalized financial advice and the app deliberately avoids telling users what to do.
- Date math assumes the browser's local timezone/clock is correct; no timezone handling beyond what the browser provides.
