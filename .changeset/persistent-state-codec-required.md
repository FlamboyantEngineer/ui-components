---
'@flamboyantengineer/ui-components': minor
---

`usePersistentState` now requires a `codec`, so no persisted value is read back unchecked. The codec helpers it uses are exported from `@flamboyantengineer/ui-components/core`: `createJsonCodec`, `createListCodec`, `booleanCodec`, `numberCodec`, `keyCodec` and `keyListCodec`. The untyped JSON default is gone. To migrate, pass `{ codec: numberCodec }` or a codec built with `createJsonCodec(read)`.
