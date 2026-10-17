# Stable Keys

`assignOccurrenceKeys` gives repeated render values React keys that follow their content rather than their position in the list.

## UIC-STABLE-KEYS-1 - Occurrence keys

### UIC-STABLE-KEYS-1.1 - Identity and occurrence

`assignOccurrenceKeys(values, identity)` shall return each value, in order, with the key `<identity>:<n>`, where `n` counts the earlier values with the same identity from zero. Keys are unique within the list, independent of where unequal values sit, and the input is left unchanged.

Implementation: `src/utils/stable-keys.ts`
Verification: `src/utils/stable-keys.test.tsx`

### UIC-STABLE-KEYS-1.2 - State follows content

Rendered under these keys, an entry shall keep its component state when other entries are inserted before it or removed.

Implementation: `src/utils/stable-keys.ts`
Verification: `src/utils/stable-keys.test.tsx`
