---
'@flamboyantengineer/ui-components': minor
---

`Sparkline` draws a finite value with no finite neighbour (a single value, or one alone between gaps) as a `ui-sparkline__dot` circle instead of an invisible move, and its line and area paths cover only runs of two or more values. A constant series, or one whose `minValue` equals `maxValue`, now fills its area to the edge nearest zero instead of collapsing onto the line.
