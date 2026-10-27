---
'@flamboyantengineer/ui-components': minor
---

A failed tool call is quiet. `ChatToolCall` starts closed when it fails, whether loaded failed or failing while shown, and shows its `error` at the top of its body (no longer as an alert after the disclosure), so collapsing the card hides all of the error. In `ChatParts` and `Chat`, a failure no longer opens its group of steps or its card: the group runs and collapses as usual, and a group the reader closed stays closed. The reference styles draw a failed call in a group as the same quiet row as the other calls, told apart by its danger `error` glyph, with its status and duration kept for assistive technology; a standalone failed card loses its danger border. Pass `defaultExpanded` or `expandedParts` to open a failed call.
