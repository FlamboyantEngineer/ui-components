---
'@flamboyantengineer/ui-components': minor
---

Menu items can be check items of their own: `MenuItem` (and a menu item entry) takes `isSelected` in a menu or section without selection, and draws a `menuitemcheckbox` with `aria-checked`, `data-selected` and the check slot among plain items, such as a toggle in a menu of actions. Activating it calls `onAction`, for the caller to flip the state; `shouldCloseOnSelect={false}` keeps the menu open.
