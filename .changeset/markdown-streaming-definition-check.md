---
'@flamboyantengineer/ui-components': patch
---

Streaming `Markdown` no longer freezes on a line of nested list markers: the check for a link reference definition backtracked exponentially (sixteen markers with two spaces each took about a second, on every streamed chunk) and now reads each line once.
