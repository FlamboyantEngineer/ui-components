---
'@flamboyantengineer/ui-components': minor
---

Markdown's `renderNode` receives a third argument, `place` (`MarkdownNodePlace`), whose `isInteractive` marks nodes inside a link or a task item's label; the new `MarkdownRenderNode` type names the override. `createCitationOverride`, and so ChatParts, leaves `[n]` markers in those places as text, so a citation never nests a link or button in another and server markup hydrates cleanly.
