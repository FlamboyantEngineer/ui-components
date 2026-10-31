---
'@flamboyantengineer/ui-components': patch
---

Portal `preserveTabOrder` now matches the browser's own tab order in two more places. A radio group in the content is one tab stop (its checked radio, else its first), instead of every radio. At the ends of the page, focus leaves the document and comes back to the page's first control, instead of skipping it on the way back in. Several portals, nested portals, `PortalHost` containers and containers placed before the portals' declarations follow the same order.
