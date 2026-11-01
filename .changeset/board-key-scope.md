---
'@flamboyantengineer/ui-components': patch
---

Board card moves by Alt+Arrow keys now belong to the card row that owns them: a card of a board drawn inside a card moves on its own board, even when both boards use the same keys, and a widget in a card that handles a chord and calls `preventDefault` keeps it.
