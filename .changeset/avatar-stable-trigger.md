---
'@flamboyantengineer/ui-components': minor
---

A pressable `Avatar` keeps the same button, and its focus, while `card`, `cardTrigger` or `nameTooltip` change. `UserCardTrigger` now takes an optional `card`: without one it is a plain button with no `ui-user-card__trigger` class or popup state, and a card that arrives or leaves later keeps the button. The package now depends on `react-stately` directly.
