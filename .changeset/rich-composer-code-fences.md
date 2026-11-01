---
'@flamboyantengineer/ui-components': patch
---

`RichMessageComposer` fences a code block with one more backtick than the longest run in its code, and reads a closing fence of at least the opening fence's length, so code that holds a fence of its own round-trips through drafts, edits and sent Markdown.
