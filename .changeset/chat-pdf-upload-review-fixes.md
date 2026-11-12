---
'@flamboyantengineer/ui-components': patch
---

Fixes from a library review. Chat source links and citations link only to addresses `isSafeUrl` accepts, showing other sources as text or a card button. The chat controller dates messages and times reasoning and tool calls with the provider clock. `FileUpload` creates image thumbnail URLs after commit, so no render leaves one behind. The PDF viewer asks again for a page's text after a failed request, and prints very large pages within the screen's pixel ceiling, emptying each canvas once its image is made.
