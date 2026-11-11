---
'@flamboyantengineer/ui-components': minor
---

`MathField` can edit math in place inside a document: `onSubmit` commits from the keyboard (Enter for inline math, which becomes a one-line editor, and Ctrl or Cmd with Enter for display math) and reports the source changed or not, and `onCancel` makes Escape always stop at the field after restoring the committed source. `autoFocus` and `controlRef.focus()` already cover focus, and the field takes none on mount otherwise.
