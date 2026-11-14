---
'@flamboyantengineer/ui-components': minor
---

`createRichTextKit` and the extension types are also exported from `@flamboyantengineer/ui-components/rich-text-editor/kit`, which loads only `prosemirror-model`, so a server assembles a kit without loading React or the editor.
