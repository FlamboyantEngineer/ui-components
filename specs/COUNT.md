# Count

`normalizeCount` and `formatCount` turn a raw count into what a reader sees. [Badge](BADGE.md) counts and the [Load More](LOAD-MORE.md) remaining count use them, and hosts can use the same rule for text-only counts.

## UIC-COUNT-1 - Formatting

### UIC-COUNT-1.1 - Normalization

`normalizeCount` shall return a finite count rounded down to a whole number and raised to zero when negative, and `undefined` for a value that is not a finite number (`NaN`, infinities, `null`, `undefined`).

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`

### UIC-COUNT-1.2 - Caps

`formatCount(count, locale, { max })` shall show the normalized count, or `max+` when it exceeds a finite, nonnegative cap, itself rounded down. A cap that is not a finite, nonnegative number is ignored. A count that is not a finite number shows no text (`""`). Zero shows `0`.

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`, `e2e/badge.spec.ts`

### UIC-COUNT-1.3 - Partial counts

`formatCount(count, locale, { more: true })` shall mark a count with further unloaded entries as `count+`. A cap the count exceeds takes precedence (`max+`).

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`, `e2e/badge.spec.ts`

### UIC-COUNT-1.4 - Locale digits

`formatCount` shall write the count and the cap with the locale's `Intl.NumberFormat`, so they take its digits and grouping (`12,345` in `en-US`, `12 345` in `fr-FR`, `٩٩+` in `ar-EG`); the `+` mark follows the number. Components pass the provider locale, so every visible count (badges, tab and segment counts, navigation rail counts, board, relation column and relation matrix counts) matches the numbers the provider's strings read out.

Implementation: `src/utils/count.ts`
Verification: `src/utils/count.test.ts`, `src/components/badge/badge.test.tsx`, `src/components/segmented-choice/pending-change.test.tsx`, `src/components/board/board.test.tsx`, `src/components/relation-columns/relation-columns.test.tsx`, `src/components/relation-matrix/relation-matrix.test.tsx`, `e2e/badge.spec.ts`
