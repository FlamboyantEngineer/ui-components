---
'@flamboyantengineer/ui-components': patch
---

`buildSearchSnippet` (and `SearchPane` rows) cut only at grapheme boundaries of the whole source, so a run of flag emoji never starts a snippet with half a flag and a combining or joined cluster longer than the context is never cut inside.
