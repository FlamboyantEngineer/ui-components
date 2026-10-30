---
'@flamboyantengineer/ui-components': patch
---

A message the composer sends now belongs to both its `persistKey` and the provider's storage adapter: switching the adapter while a message waits no longer holds the new draft or empties it when the old message is accepted, even with the same key and text. Only the stored draft the message was sent from empties, also after the composer unmounts.
