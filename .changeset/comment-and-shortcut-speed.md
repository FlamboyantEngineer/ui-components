---
'@flamboyantengineer/ui-components': patch
---

`CommentText` parses and draws a comment again only when its text, parser or format changes, and `parseMentions` reads a text in time proportional to its length: a mention's kind is at most 64 characters and its name and id at most 256 each. Shortcut matching formats the reserved chords once and remembers each shortcut's answer, instead of formatting them for every shortcut on every key press.
