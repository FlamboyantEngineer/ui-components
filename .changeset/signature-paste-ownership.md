---
'@flamboyantengineer/ui-components': patch
---

`SignaturePad` drops a Paste image that settles after the reader changed the mode, cleared the image, took another image, or after the value was replaced, the field was locked or the pad unmounted: the paste owns its work from the request, before its clipboard read, through decoding, and stale work no longer changes the mode, the value or the status message.
