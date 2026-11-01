---
'@flamboyantengineer/ui-components': minor
---

RichTextEditor long documents: the surface is the scrolling viewport once a host bounds its height, under the shared overlay scrollbars (`ui-rich-text-editor__body`, `__scrollbars`). New `blockMarkers` prop carries the host's own findings about top-level blocks (`block`, `endBlock`, `severity`, `message`): marked blocks get `data-severity` and their messages as `aria-description`, and each marker is drawn at its place in the scroll track (`ui-rich-text-editor__scroll-marker`). The content element now keeps `tabindex="0"` unless disabled.
