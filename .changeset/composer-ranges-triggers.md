---
'@flamboyantengineer/ui-components': minor
---

`RichMessageComposer` gains a selection and range contract and host vocabularies. Its handle reads and sets the selection and replaces a range or the selection by offsets in the message's Markdown text, each edit one undo step (`getSelection`, `setSelection`, `replaceRange`, `replaceSelection`, `focus`); `onSelectionChange` reports the selection, `inputId` names the text box, and `onPaste` lets the host take pasted text and answer with a fragment at once or later. `triggers` adds host vocabularies opened by their own character, with async sources that show loading, failure and no results for the current query only; their entries insert as `trigger` tokens that keep their raw text and show an icon. `Chat` forwards these as `composerInputId`, `onComposerPaste`, `onComposerSelectionChange` and `triggers`, and its composer handle gains the same selection and range methods. `CompletionList` items take an `icon`.
