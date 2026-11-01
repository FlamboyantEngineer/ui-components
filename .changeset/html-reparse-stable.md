---
'@flamboyantengineer/ui-components': patch
---

HtmlMarkup's tree survives a parse of its server HTML in more shapes: a description or term closes an open paragraph, and a list item, term, description, link or heading placed before a table into an open element of its kind keeps only its content there, so hydration no longer recovers from a rebuilt tree.
