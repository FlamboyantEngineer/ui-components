# Color Index

`getColorIndex` maps a key, such as a person's name or id, to a stable color slot. Components publish the slot as a data attribute and the host stylesheet maps each slot to a color, so the library never writes a color itself.

## UIC-COLOR-INDEX-1 - Stable slots

### UIC-COLOR-INDEX-1.1 - Same key, same slot

`getColorIndex(key, count)` shall return an integer from `0` to `count - 1` computed only from the key and the count, so the same key yields the same slot on every render, page and device. Leading and trailing whitespace in the key is ignored. The slot is the key's unsigned 32-bit rolling string hash (`hash * 31 + code unit`, kept to 32 bits after each step) modulo the count, so a host or another library can reproduce it, and the editors that color people by id give the slot `Avatar` derives from that id.

Implementation: `src/utils/color-index.ts`
Verification: `src/utils/color-index.test.ts`

### UIC-COLOR-INDEX-1.2 - Invalid counts

A fractional count shall be truncated, and a count below one or not finite shall yield slot `0`.

Implementation: `src/utils/color-index.ts`
Verification: `src/utils/color-index.test.ts`

### UIC-COLOR-INDEX-1.3 - Placing several keys

`placeColorIndexes(keys, count)` shall give each distinct key a slot: its `getColorIndex` slot, or the next free slot after it when a key earlier in code unit order took that one, so the people present together get different colors while there are slots for them, and every view places the same keys alike. Once every slot is taken, a further key shall keep its own slot. An invalid count places every key on slot `0`.

Implementation: `src/utils/color-index.ts`
Verification: `src/utils/color-index.test.ts`
