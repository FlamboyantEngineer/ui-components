---
'@flamboyantengineer/ui-components': patch
---

Fix three number readings: a tool call duration picks its unit from the rounded value (59 950 ms reads `1 min`, never `60 s`); a pasted numbered list keeps a `start` of 0 or a negative start; and a table cell that held a number reads only plain decimal text of a safe size as a number, so hexadecimal, binary, exponent and oversized integers stay text.
