---
'@flamboyantengineer/ui-components': patch
---

DateTimeField writes the spaces in its segments as no-break spaces and in its previous value as plain spaces, whatever the runtime's Intl writes, so 12-hour fields hydrate without a text mismatch and the space before AM and PM no longer collapses.
