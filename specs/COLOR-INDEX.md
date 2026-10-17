# Color Index

`getColorIndex` maps a key, such as a person's name or id, to a stable colour slot. Components publish the slot as a data attribute and the host stylesheet maps each slot to a colour, so the library never writes a colour itself.

## UIC-COLOR-INDEX-1 - Stable slots

### UIC-COLOR-INDEX-1.1 - Same key, same slot

`getColorIndex(key, count)` shall return an integer from `0` to `count - 1` computed only from the key and the count, so the same key yields the same slot on every render, page and device. Leading and trailing whitespace in the key is ignored. The slot is the absolute value of the key's 32-bit rolling string hash (`hash * 31 + code unit`) modulo the count, so a host can reproduce it in other languages.

Implementation: `src/utils/color-index.ts`
Verification: `src/utils/color-index.test.ts`

### UIC-COLOR-INDEX-1.2 - Invalid counts

A fractional count shall be truncated, and a count below one or not finite shall yield slot `0`.

Implementation: `src/utils/color-index.ts`
Verification: `src/utils/color-index.test.ts`
