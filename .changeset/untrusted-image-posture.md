---
'@flamboyantengineer/ui-components': patch
---

Images from content (Markdown images, HtmlMarkup images and chat attachment thumbnails) now render with `referrerPolicy="no-referrer"`, `loading="lazy"` and `decoding="async"`, so a remote image no longer learns the page's URL or acts as a tracking pixel when a page opens. `renderNode` and `renderElement` overrides draw images with their own attributes.
