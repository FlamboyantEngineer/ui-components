---
'@flamboyantengineer/ui-components': patch
---

`useChatController` now treats an `upload` that throws before returning its promise as a failed upload: the file is marked `error` with the message and can be retried, and the other files of the batch still upload.
