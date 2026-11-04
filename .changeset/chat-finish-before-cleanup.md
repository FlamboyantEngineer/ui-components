---
'@flamboyantengineer/ui-components': patch
---

`useChatController` completes a reply as soon as its stream sends `finish`, before waiting for the stream's own cleanup, so a slow cleanup no longer keeps the reply pending and a failing one no longer turns it into an error.
