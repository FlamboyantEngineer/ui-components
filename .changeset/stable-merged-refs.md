---
'@flamboyantengineer/ui-components': patch
---

Diagram nodes and viewport, the radix number input, both message composers and the breadcrumb list merge their refs once instead of on every render, so caller callback refs and internal registrations are no longer detached and attached again each commit.
