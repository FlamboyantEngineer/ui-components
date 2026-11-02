---
'@flamboyantengineer/ui-components': patch
---

RichTextEditor's block drag belongs to the document it started in: when the host replaces the value or an edit lands mid-drag, the drag shows no drop indicator and its drop changes nothing, instead of throwing or moving another block at the old position.
