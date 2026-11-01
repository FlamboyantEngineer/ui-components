---
'@flamboyantengineer/ui-components': patch
---

ChatParts percent-encodes the message id (hyphens included) in its parts' DOM ids, so two messages' ids can no longer produce the same DOM id; `serializeRichTextHtml` keeps a mark's element whole when its attributes hold U+0000.
