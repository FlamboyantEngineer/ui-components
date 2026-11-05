---
'@flamboyantengineer/ui-components': minor
---

Add `ExpressionField`, a field for authored expression and decimal text that keeps the source exactly as typed (`1e-100`, literals beyond a number's precision) and never converts it to a number. It composes `Field` with a single-line `CodeEditor` surface: host tokenization, completions and diagnostics, a unit and action slots, Enter or blur to commit and Escape to restore. The host's `result` (`ready`, `pending`, `invalid`, `unavailable`) names the source it was evaluated from, so an answer for older source shows as stale and never touches the draft. Adds the `expressionResult`, `expressionPending`, `expressionStale` and `expressionUnavailable` strings.
