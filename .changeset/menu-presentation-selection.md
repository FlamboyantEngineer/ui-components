---
'@flamboyantengineer/ui-components': minor
---

A `Menu` keeps its uncontrolled selection when `filterable`, `highlightMatches` or `virtualized` turns on or off, or its label changes; turning highlighting on or off or changing the label no longer mounts the list again, so its focus and an open submenu stay. `TextMatchProvider` takes `isInherited`, which passes the enclosing provider's query through so a wrapper can stay mounted while it does not highlight.
