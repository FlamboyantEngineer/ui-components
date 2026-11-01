---
'@flamboyantengineer/ui-components': minor
---

`ViewSwitcher` keeps its content mounted when `variant` switches between tabs and a menu, and when the selected view changes: the content sits in one `ui-view-switcher__panel` in both variants, a tab panel labelled by the selected tab as tabs. The panel no longer carries `ui-tabs__panel`, and a host that wants fresh content per view keys it by the selected view.
