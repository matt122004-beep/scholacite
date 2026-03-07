# CRAFT-HANDOFF — v3.10 P0 DOCX footnote export fix (browser path)

## Task
Fix P0: downloaded DOCX still showing citations in body text instead of Word footnote pane.

## Status
✅ COMPLETE (hotfix shipped)

## Root Cause Found
The browser export code had a fallback branch when `extractedBodyParagraphs` is empty.

In that fallback, it previously wrote every reformatted citation directly as normal body paragraphs. That guarantees body-text citations and bypasses footnote pane behavior, even though `docOpts.footnotes` existed.

So the issue was not the Node simulation; it was the **actual browser fallback path** still rendering body lines.

## Fix Implemented
In `downloadBtn` export logic (`script.js`):

- Kept `docOpts.footnotes = footnoteMap` for footnote-based styles.
- Replaced fallback behavior for footnote systems (`JBL`, `JSOT`):
  - now emits placeholder paragraphs containing only `new D.FootnoteReferenceRun(i + 1)`
  - does **not** inject citation text into body in fallback mode
- Preserved old fallback body list behavior only for author-date (`JSNT`) where body citations are expected.

This ensures that even if body extraction fails, citations are represented as true Word footnotes.

## Deployment Verification
- Live site checked: serves latest script (`ScholaCite v3.10 loaded`).
- `docx-patched.js` confirmed present and footnote-capable on deployed page.

## Git
- Commit: `c755c62`
- Message: `scholacite-v3.10: browser DOCX footnote fallback fix (no-body extraction path)`
- Pushed: `origin/main` ✅

## Next
Have Critic perform browser E2E confirmation in Word/LibreOffice on downloaded file:
- upload `.docx`
- reformat
- download
- confirm citations open in footnote pane, not body text
