# CRAFT-HANDOFF — scholacite-v3.10

## Task
ScholaCite v3.10: cosmetic fixes + parser ceiling push.

## Status
✅ Complete (code shipped)

## What Built
1. **Version strings updated to v3.10**
   - `script.js` header comment → `// ScholaCite v3.10`
   - load log → `ScholaCite v3.10 loaded`
   - footer in `index.html` → `ScholaCite v3.10 ...`

2. **Browse button JS listener mismatch fixed**
   - Added `id="browse-btn"` to the browse `<label ... for="file-input">`
   - This matches existing JS selector (`getElementById('browse-btn')`) so explicit listener now works, while native `label[for]` fallback remains intact.

3. **Ceiling push regex updates**
   - `SEE_VERBS` broadened to catch `Cf`, `Cf.`, `C.F.` variants:
     - `c\.?f\.?` added.
   - **Book pattern** upgraded to support optional series between title and publication parens:
     - `Author, *Title*, SERIES (City: Publisher, Year), page`
   - **Subsequent pattern** expanded for:
     - multi-author forms (`Smith and Jones`, `Smith & Jones`)
     - `et al.` forms
     - ranged pages already preserved (`892–943`, etc.)

## Verification
- `node -c script.js` ✅
- Grep verification for:
  - v3.10 strings
  - browse button id
  - updated SEE_VERBS
  - updated book/subsequent regexes

## Git
- Commit: `765ec76`
- Message: `scholacite-v3.10: browse fix + version + series titles + ceiling push`
- Pushed: `origin/main` ✅

## Notes
- This pass focuses exactly on the requested v3.10 fixes and parser-catch expansions.
- If needed next pass can target remaining high-volume unknown clusters from corpus for another parse-rate jump.
