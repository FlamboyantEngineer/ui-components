---
'@flamboyantengineer/ui-components': patch
---

`ChatTranscript` forgets the messages of earlier conversations when the conversation starts over, so its bookkeeping no longer grows with every message ever shown. A key or id reused by a later conversation now means what that conversation makes it, for example a separator. A message that registers a new id also drops its old one.
