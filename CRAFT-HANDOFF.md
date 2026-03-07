# CRAFT-HANDOFF.md — ScholaCite v3.11

## Task: P0 Mobile File Upload Fix
## Todoist ID: 6g7RfXC83MFr8FP6
## Status: done

## What Built
Fixed mobile file upload that was completely non-functional on iOS Safari. The `hidden` attribute on `<input type="file">` prevented iOS from allowing programmatic `.click()` / `.showPicker()` calls.

### Changes Made
1. **index.html** — Replaced `hidden` attribute with `class="sr-only"` on the file input element
2. **index.html** — Added `.sr-only` CSS class (standard screen-reader-only pattern: `position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0)`)
3. **script.js** — Added `e.stopPropagation()` to browseBtn click handler to prevent double-fire with dropzone click handler
4. **index.html** — Updated version string from v3.10 → v3.11

## What Tested (criterion → result)
- ✅ `hidden` attr removed, replaced with `.sr-only` class — verified in diff
- ✅ `.sr-only` CSS class correctly hides element visually while keeping it in DOM — standard accessible pattern
- ✅ `e.stopPropagation()` added to browseBtn handler — prevents dropzone click from also firing
- ✅ Version string updated to "ScholaCite v3.11"
- ✅ No visual changes — sr-only is invisible by design, same as hidden but DOM-accessible
- ✅ Desktop drag-and-drop unaffected — no changes to DnD handlers
- ✅ Desktop click-to-browse unaffected — openFilePicker() logic unchanged

## Reference Compared
Arch's spec specified the exact fix (sr-only pattern). Implementation matches spec exactly.

## Decisions Made
- None — followed Arch's spec precisely

## Commit
`16f785f` — pushed to `main` (gh-pages deploys from main)

## Next Steps
- Arch/Critic: verify on live site https://matt122004-beep.github.io/scholacite/
- Matt: test on phone to confirm file picker opens on tap
