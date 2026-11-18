---
'@flamboyantengineer/ui-components': minor
---

Keep wide content inside a chat message and highlight its code. The reference stylesheet lays a message's body out in one column no wider than the message, so long prose, links and inline code wrap and a code block scrolls sideways in its own frame instead of widening the bubble past the transcript. `CodeBlock` highlights by its `language` when no `tokenize` is given, for the Code Editor presets and their short names (`ts`, `js`, `py`, `sh`, `yml` and the like), so fenced code and code parts in Chat are highlighted. `createCodeBlockOverride` wraps a plain-text fence (`text`, `txt`, `plain`, `plaintext`), and keeps the built-in highlighting for a language its `tokenizers` map does not register. `Markdown` draws each table inside a `ui-markdown__table` frame that scrolls a wide table sideways and joins the tab order while it overflows (`data-overflowing`).
