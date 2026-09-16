# Build Log

Records every failure during development of Renewal Radar: errors, failing tests, wrong results, deployment problems, or a change of approach — even ones that were quick to fix. Entries are appended only; earlier entries are never edited or removed.

Entry format:

- **Phase**
- **Symptom** — the exact error message or wrong result observed
- **Cause**
- **Fix**

---

### Phase 2

- **Symptom:** On first browser check of the Phase 2 UI, all text rendered nearly invisible — dark gray text on a black background.
- **Cause:** `styles.css` set `color` on `body` but never set an explicit `background`, so the browser's dark color-scheme preference filled in a dark background while the text stayed dark too.
- **Fix:** Added `background: #ffffff;` to the `body` rule in `styles.css`.
