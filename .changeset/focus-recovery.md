---
'@flamboyantengineer/ui-components': patch
---

Focus no longer falls to the page when an update hides or removes the element holding it. `NavigationRail` moves it to the trigger of the group that closed, `Outline` to the nearest shown entry, `DockPanel` to the pane shown in place of a removed or disabled one, `RelationColumns` to the deepest column left when the path shortens, and `DiagramCanvas` to the nearest node when the host removes the focused one. `DiagramCanvas` also keeps a focused node the host moves in view inside a shadow root. Focus that had left the component stays where it is.
