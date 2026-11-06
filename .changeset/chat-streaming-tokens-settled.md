---
'@flamboyantengineer/ui-components': patch
---

A streaming chat text part with mention, command or reference tokens keeps its finished Markdown blocks: its token overrides stay the same while its tokens do, and placing the tokens parses only the unsettled end of a text that continues the previous one, so each chunk's work no longer grows with the reply.
