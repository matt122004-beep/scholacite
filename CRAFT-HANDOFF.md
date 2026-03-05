# CRAFT-HANDOFF — scholacite-v3.0

## Status
✅ COMPLETE — committed and pushed

## What I built
Complete rewrite of ScholaCite from a simple text formatter to a .docx-based citation reformatter foundation.

### New UI (index.html)
- Drag-and-drop .docx upload zone (also click-to-browse)
- File info bar with name/size and clear button
- Journal selector: JBL, JSNT, JSOT (radio card layout)
- "Reformat Citations" button (disabled until file uploaded)
- Status/progress indicator with spinner
- Tabbed results: Footnotes tab + Parsed Citations tab
- Download button (stub for Phase 2)
- Footer with "client-side only" privacy notice

### Libraries (CDN)
- mammoth.js 1.8.0 — .docx → HTML conversion with footnote extraction
- docx.js 9.5.0 — .docx generation (ready for Phase 2)
- FileSaver.js 2.0.5 — client-side file download

### Citation Parser (script.js)
Three regex patterns for common academic citation formats:
- **Journal:** `Author, "Title," Journal Volume, no. Issue (Year): Pages.`
- **Book:** `Author, Title (City: Publisher, Year), Pages.`
- **Chapter:** `Author, "Chapter," in Book, ed. Editor (City: Publisher, Year), Pages.`

Each footnote is parsed → structured data extracted → displayed in Parsed Citations tab with type label (Journal/Book/Chapter/Unknown).

### Style Rules (stubs)
```js
STYLES = { JBL: {...}, JSNT: {...}, JSOT: {...} }
```
All reference SBLHS 2nd ed. as base. Rules objects are empty — Phase 2 will fill them.

### Design
- Kept Playfair Display + Inter fonts
- Navy (#1a2744) + gold (#b8860b) scheme
- Clean card-based layout
- Responsive down to 640px

## Testing
- Created test .docx with 3 footnotes (journal, book, chapter in edited volume)
- All 3 footnotes extracted correctly by mammoth.js ✅
- All 3 citation patterns detected and parsed ✅
- No console errors ✅
- Tab switching works ✅
- File clear works ✅

## Git
- Commit: `85441eb`
- Pushed to: `origin/main`

## Phase 2 roadmap
- v3.1: Implement actual SBLHS formatting rules for JBL/JSNT/JSOT
- v3.2: Generate reformatted .docx output with docx.js
- v3.3: Side-by-side before/after preview, edge case handling
