# Count

`normalizeCount` and `formatCount` turn a raw count into what a reader sees. [Badge](BADGE.md) counts and the [Load More](LOAD-MORE.md) remaining count use them, and hosts can use the same rule for text-only counts.

## UIC-COUNT-1 - Formatting

### UIC-COUNT-1.1 - Normalization

`normalizeCount` shall return a finite count rounded down to a whole number and raised to zero when negative, and `undefined` for a value that is not a finite number (`NaN`, infinities, `null`, `undefined`).

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`

### UIC-COUNT-1.2 - Caps

`formatCount(count, { max })` shall show the normalized count, or `max+` when it exceeds a finite, nonnegative cap, itself rounded down. A cap that is not a finite, nonnegative number is ignored. A count that is not a finite number shows no text (`""`). Zero shows `0`.

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`

### UIC-COUNT-1.3 - Partial counts

`formatCount(count, { more: true })` shall mark a count with further unloaded entries as `count+`. A cap the count exceeds takes precedence (`max+`).

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`
