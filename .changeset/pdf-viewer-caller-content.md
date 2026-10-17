---
'@flamboyantengineer/ui-components': minor
---

`PdfViewer` adds a context menu that copies the selected text and takes caller entries (`getSelectionMenuItems`, `getPageMenuItems`); caller content over each page (`renderPageOverlay`, the `ui-pdf-viewer__overlay` hook) with `onPageViewports`, page-coordinate types and `findBoxAtPoint`; a controlled page (`page`, `onPageChange`) and `revealRect`; caller-owned find (`searchQuery`, `onSearchQueryChange`, `matchIndex`, `onMatchIndexChange`, `renderSearch`); and `leadingActions` (the `ui-pdf-viewer__leading-actions` hook) and `toolbarSlot` for the toolbar.
