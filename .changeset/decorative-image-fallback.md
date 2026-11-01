---
'@flamboyantengineer/ui-components': patch
---

ReactionBar and EmojiPicker custom emoji fall back to their `:shortcode:` text, and FileUpload previews and MediaViewer thumbnails to the type glyph, when the image fails to load. FileUpload previews now load lazily and decode asynchronously.
