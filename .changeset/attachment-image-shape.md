---
'@flamboyantengineer/ui-components': minor
---

Show an image attachment in its own shape: `AttachmentData` takes an optional `width` and `height` in pixels, which the thumbnail carries so it has the image's shape before it loads. The reference stylesheet sizes image tiles from the image (within 320 by 240 alone, at a shared 160 row height together, cropping shapes past 3:1 or 1:2) and again outranks the button rules on the preview, which had collapsed image tiles in messages to a thin strip.
