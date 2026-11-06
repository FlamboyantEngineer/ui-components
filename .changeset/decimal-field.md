---
'@flamboyantengineer/ui-components': minor
---

Add `DecimalField`, a field for an exact decimal held as a canonical string (`string | null`), never as a JavaScript number. It reads and writes the locale's separators and digits, steps, bounds, rounds (`scale` with `halfExpand`, `halfEven` or `trunc`) and validates with exact decimal arithmetic, and submits the exact text. `toCanonicalDecimal` gives a decimal text's canonical form. Adds the `decimalUnreadable` string.
