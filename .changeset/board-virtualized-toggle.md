---
'@flamboyantengineer/ui-components': patch
---

Turning a Board's `virtualized` on or off no longer remounts its cells: every cell renders through one list layout that renders only the cards in view while virtualized and every card otherwise, so the cards keep their focus and the state inside them. Cards are re-measured when their content resizes.
