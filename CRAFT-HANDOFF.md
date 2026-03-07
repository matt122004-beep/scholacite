# CRAFT-HANDOFF — scholacite-v3.7 revert (Option A)

## Task
Revert mixed detector from v3.7 per QA FAIL. Do not attempt new fixes.

## Status
✅ COMPLETE

## What Built
- Removed mixed-detector architecture from `script.js`:
  - deleted `hasCitationEmbedded()`
  - deleted `extractFromMixed()`
  - removed mixed parsing branch in `parseFootnoteCitations()`
  - removed mixed formatting branch in `reformatCitations()`
  - removed mixed UI branch in parsed rendering
- Restored v3.6-final behavior path (unknown -> fallback/discursive only).

## What Tested
- `node -c script.js` ✅ syntax clean
- Grep verification: no remaining references to mixed detector symbols/types ✅

## Git
- Commit: `7b72ee6`
- Message: `scholacite-v3.7: revert mixed detector — restore v3.6-final clean baseline`
- Pushed: `origin/main` ✅

## Pipeline State
- Updated `/Users/matt/clawd/agents/arch/runtime/pipeline-state.json`
  - `phase`: `CRAFT_DONE`
  - `commit`: `7b72ee6`

## Notes
- This is a strict revert per instruction (no additional parser changes attempted).
- Baseline behavior is restored to safe v3.6-final citation path (no mixed false-positive corruption risk).
