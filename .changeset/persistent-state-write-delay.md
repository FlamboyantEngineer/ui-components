---
'@flamboyantengineer/ui-components': minor
---

`usePersistentState` takes its codec in an options object, `usePersistentState(key, initialValue, { codec, writeDelay })`, and returns `flush` as a third element. With `writeDelay` the adapter write follows the last change of a burst and is flushed on a key or adapter change, unmount and `pagehide`. The message composers write their persisted draft once typing pauses for 300 ms or focus leaves, instead of on every key press.
