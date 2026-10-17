# Clamp

`clamp` limits a number to a range, for sizes, positions and indexes components compute.

## UIC-CLAMP-1 - Range

### UIC-CLAMP-1.1 - Inclusive bounds

`clamp(value, min, max)` shall return `value` when it lies between `min` and `max` inclusive, `min` when it is below and `max` when it is above. When `min` exceeds `max`, `min` wins.

Implementation: `src/utils/clamp.ts`
Verification: `src/utils/clamp.test.ts`
