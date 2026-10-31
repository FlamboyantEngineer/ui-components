---
'@flamboyantengineer/ui-components': minor
---

TextMatch matches composed and decomposed accents alike, in the text and in the query, with or without `ignoreAccents`, and reads word boundaries by whole code points with combining marks inside words. `normalizeMatchText` now composes letters with their marks, so its result no longer keeps the original's indexes; `findTermRanges` maps matches back to whole characters of the original.
