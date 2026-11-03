---
'@flamboyantengineer/ui-components': patch
---

Preserve hydratable HtmlMarkup structure when sanitizing removes a scope boundary. Keep allowed content in order, unwrap tags that would close their new ancestors, and remove unusable table scaffolds while retaining valid nested tables.
