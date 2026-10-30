---
'@flamboyantengineer/ui-components': minor
---

DockPanel keeps every pane mounted when the frame crosses `overlayBelow` and when the drawer opens and closes. The panes now render, through a portal, into one `ui-dock-panel__panes` element that the body holds and the drawer borrows while it is open (inside a new `ui-dock-panel__drawer-body` element). While an overlay, the body stays rendered and hidden instead of being removed, and in the drawer the panes other than the selected one stay hidden and inert. Host stylesheets should style the new `ui-dock-panel__panes` element like the body: a flex column that fills it.
