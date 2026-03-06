# CRAFT-HANDOFF — scholacite-v3.5

## Status
✅ COMPLETE — 3 bug fixes from v3.4 QA

## What changed

### Bug 1: Subsequent citations now reformatted
- Added `PATTERNS.subsequent` and `PATTERNS.subsequentNoPages` regex patterns to detect short-form citations like "Betz, Galatians, 280"
- `parseCitation()` now returns `type: 'subsequent'` with author/title/pages for these
- `reformatCitations()` tracks first-citation data in `authorIndex` (keyed by last name) so subsequent citations can look up year and original type
- Per-journal reformatting:
  - **JSNT**: `(Betz 1979: 280)` — author-date in-text using stored year
  - **JBL**: `Betz, *Galatians*, 280.` — short-title footnote format
  - **JSOT**: `Betz, 'Galatians', p. 280.` — single quotes + p. prefix
- Falls back to best-effort if no prior full citation found for that author

### Bug 2: JSOT p./pp. logic
- Added `pagePrefix(pages)` helper: returns `p.` for single pages, `pp.` for ranges (checks for `-`, `–`, `—`, `,`)
- Updated ALL JSOT rules (bookFirst, journalFirst, chapterFirst, bookSubsequent, journalSubsequent, chapterSubsequent) to use `pagePrefix()` instead of hardcoded `pp.` or `p.`

### Bug 3: Version string
- Updated to v3.5 in: script.js line 1 comment, console.log, index.html footer

### UI updates
- Parsed tab shows "Subsequent" type badge with author/title/pages fields
- Reformatted tab correctly renders subsequent citations with "Subsequent" badge

## Testing
- `node -c script.js` — no syntax errors ✅
- `pagePrefix('275')` → `p.` ✅
- `pagePrefix('186-218')` → `pp.` ✅
- Subsequent regex matches "Betz, Galatians, 280" ✅
- Subsequent regex matches "Hays, Echoes of Scripture, 186-218" ✅

## Git
- Commit: `8afd7ed`
- Pushed to: `origin/main`
