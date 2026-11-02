---
'@flamboyantengineer/ui-components': minor
---

Completions insert by key only from a list on screen. Enter and Tab wait for a list that has not shown yet, and Tab while no list shows asks for the completions at the caret and shows them without inserting (the next Tab inserts), or moves focus when there is nothing to show. `CompletionList` gains `onShownChange`, and the completions model gains `setShown` and `revealOnTab`. QueryField, FormulaBar, TextField, MessageComposer and CodeEditor without `indentWithTab` follow it.
