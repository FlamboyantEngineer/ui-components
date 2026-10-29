---
'@flamboyantengineer/ui-components': patch
---

Streaming Markdown parses only the source after its last settled block on each chunk, keeping the settled blocks as they were parsed and skipping their signatures, so a long streamed reply no longer reparses and re-signs everything it has already shown. Chat message grouping reads each message time once instead of on every streamed chunk.
