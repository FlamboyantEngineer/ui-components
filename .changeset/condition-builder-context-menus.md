---
'@flamboyantengineer/ui-components': minor
---

Give `ConditionBuilder` rules and nested groups context menus with the same move, duplicate and delete actions as their menu buttons. The new `showActionButtons={false}` leaves the buttons out: each rule and group then takes its button's place in the tab order, where Shift+F10 opens its menu and Alt+Arrow keys move it. A context menu target now also opens from Shift+F10 or the Context Menu key that a control inside stopped, such as a select trigger, keeping the innermost target's menu.
