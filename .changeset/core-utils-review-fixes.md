---
'@flamboyantengineer/ui-components': patch
---

Fixes from a library review in shared core and utilities. `formatBytes` moves to the next unit when a value rounds up to 1024, so it prints "1.0 MB" rather than "1,024.0 KB". Persistent state keeps rendering when the storage adapter or codec throws, and a delayed write is also flushed when the document becomes hidden. `Announcer` empties its live regions seven seconds after a message. Blob download addresses stay valid for forty seconds. Chat ids use `crypto.randomUUID` where it exists. The widest-text measurement takes letter and word spacing, font stretch, kerning, small caps and `text-transform` into account. Revealing a row by key waits on the collection's own window and still settles in a hidden tab. Root hooks read caller props in one pass without building an entries array.
