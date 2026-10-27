---
'@flamboyantengineer/ui-components': minor
---

Every tool call of a reply takes the same styles, whether it sits in a group of steps or alone at the end of a message:

- `ChatToolCall` takes a `variant` (`ChatToolCallVariant`): `card`, the default, or `row`, published as `data-variant`.
- `ChatParts`, and so `Chat`, draws every tool call as a `row`. The reference styles key the quiet row on `.ui-chat-tool-call[data-variant='row']` in place of `.ui-chat-steps__panel .ui-chat-tool-call`; restyle custom row rules the same way.
