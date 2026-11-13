---
'@flamboyantengineer/ui-components': minor
---

Chat tool calls of kind `other` without a glyph of their own now show a letter in a rounded box once they succeed, taken from the new `source` field (the integration, such as an app's name) or else the tool name. Hosts give a tool its own glyph with `glyph` on `ChatToolCall` or `toolGlyphs` by tool name on `Chat` and `ChatParts`.
