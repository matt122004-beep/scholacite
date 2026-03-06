# CRAFT-HANDOFF — scholacite-v3.2

## Status
✅ COMPLETE — committed and pushed

## What I built

### Bug Fix: Chapter parser
- **Problem:** Chapter-in-edited-volume citations misidentified as BOOK type
- **Fix:** Added two chapter patterns (before generic book):
  - `chapterStrict` — matches `"Title," in Book, ed. Editor (City: Publisher, Year)` (also `eds.`)
  - `chapterLoose` — matches `"Title," in Book (City: Publisher, Year)` (no explicit editor)
- **Also:** Made `chapterFirst()` formatter handle missing editor gracefully
- **Tested:** Chapter citation correctly typed as CHAPTER, not BOOK ✅

### .docx Export
- **Problem:** Download button only exported plain text
- **Fix:** Full .docx generation using docx.js v8.5.0:
  - Preserves original body paragraphs and headings
  - Replaces footnotes with reformatted citations in selected journal style
  - Proper Word footnotes (FootnoteReferenceRun)
  - Italic text runs for book/journal titles
  - Filename: `{original}-reformatted-{journal}.docx`
- **docx.js UMD loading issue:** The library's UMD wrapper doesn't bind to `window.docx` in all browser contexts (strict mode `this` is `undefined`). Fixed by patching the UMD header to force `window.docx = {}` binding. Local file `docx-patched.js` (742KB).
- **Processing state:** Button shows "Generating .docx…" during export
- **Success toast:** "Downloaded! Check your reformatted document."
- **Error handling:** Toast with error message on failure

### Validation
- .docx blob generation: produces valid 7KB+ .docx with proper MIME type ✅
- All 4 footnotes parsed correctly (Journal, Book, Chapter, Journal-subsequent) ✅
- No console errors from our code ✅

## Git
- Commit: `bfaa088`
- Pushed to: `origin/main`

## Notes for Arch/Critic
- `docx-patched.js` is 742KB — consider CDN in future if GitHub Pages size is a concern
- The .docx export preserves basic text but complex formatting (tables, images, styles) from the original document is not preserved — mammoth.js extracts text/structure only
- Phase 3.3 could add: side-by-side diff highlighting, more citation pattern coverage, bibliography generation
