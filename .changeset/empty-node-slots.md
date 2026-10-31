---
'@flamboyantengineer/ui-components': patch
---

The remaining `ReactNode` slots treat `null`, `false` and `''` as absent and `0` as content: `ChatStatusLine` keeps its busy indicator for an empty `icon`, `Chart` and `SegmentedBar` fall back to `aria-label` for an empty `label`, and ProgressBar labels, Slider mark labels, Disclosure titles, TextField and NumberField adornments, the character count's description and host slots in ChatMessage, MessageComposer, FilterBar, CodeEditor, RichTextEditor, PdfViewer, CommentThreadReply, ChatList and the message actions bar draw `0`.
