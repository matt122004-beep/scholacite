# CRAFT-HANDOFF — scholacite-v3.8-fixes (Attempt 2/3)

## Task
Apply QA FAIL v3.8 Attempt 1 fixes:
1) lowercase author guard in mixed sanity check
2) version string corrections
3) investigate/add Ibid parsing
4) add large-file (>150KB) upload warning

## Status
✅ COMPLETE

## What Built
### Fix 1 — authorSanityCheck hardening (eliminates mixed FPs)
Added first checks:
- `if (!author) return false;`
- `if (/^[a-z]/.test(author)) return false;`

This blocks mixed false positives where extracted "author" is a lowercase mid-sentence fragment.

### Fix 2 — Version string corrections
In `script.js`:
- Header comment updated to v3.8
- Console log updated to `ScholaCite v3.8 loaded`

### Fix 3 — Ibid parser support
Added parser branch in `parseCitation()`:
- Matches `Ibid.`, `Ibidem.`, `Ibid., 45`, `Ibid., 12–34`
- Returns `{ type: 'ibid', page, raw }`

Added reformat/render handling:
- `reformatCitations()` formats ibid references safely
- Parsed tab shows `Ibid.` type with page info

Corpus check run:
- Found **98** `Ibid.`-style footnotes in Korpman dissertation (significant)

### Fix 4 — Large-file upload warning
In `handleFile()`:
- Added pre-upload warning toast when file size >150KB
- Message explains in-browser mammoth processing may be slow/freeze and suggests splitting document
- Prevents silent hang behavior

## What Tested
- `node -c script.js` ✅ syntax clean
- Grep verification for updated strings and ibid branch ✅
- Corpus probe for Ibid presence (98 hits) ✅

## Git
- Commit: `a841176`
- Message: `scholacite-v3.8-fixes: lowercase author guard + Ibid + file size check + version strings`
- Pushed: `origin/main` ✅

## Pipeline
- Updated `/Users/matt/clawd/agents/arch/runtime/pipeline-state.json`
- `phase` → `CRAFT_DONE`
- `commit` → `a841176`
