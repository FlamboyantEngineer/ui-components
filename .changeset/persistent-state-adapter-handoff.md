---
'@flamboyantengineer/ui-components': patch
---

`usePersistentState` no longer rolls back a delayed change when the provider receives a new storage adapter over the same backing store (such as an inline `createSafeStorage`): it reads again once the pending write lands, before paint.
