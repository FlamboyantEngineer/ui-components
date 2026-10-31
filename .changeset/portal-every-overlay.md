---
'@flamboyantengineer/ui-components': patch
---

Every library overlay renders into the portal container. `PortalContainerProvider` and `PortalHost` now point React Aria's portal provider at their container too, so popovers, menus, selects, dialogs, drawers, the command palette, tooltips and toasts open inside a `PortalHost` instead of escaping to the document body. Floating and retained `Modal` presentations render through `Portal`, and `AnchoredTooltip` into the same container, so all of them render nothing on the server or until hydrated.
