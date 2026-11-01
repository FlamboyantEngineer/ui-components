---
'@flamboyantengineer/ui-components': patch
---

Parallel `DiagramCanvas` edges stay attached to their nodes and keep their own routes and labels: ends without ports slide only along their side, edges between the same ports bend or move their runs apart, straight edges between the same ports part their labels, and loops on one node nest instead of overlapping.
