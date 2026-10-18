---
'@flamboyantengineer/ui-components': minor
---

Add the rich-text editor family on ProseMirror, exported from its own entry point `@flamboyantengineer/ui-components/rich-text-editor` (not the package root, so applications without it install none of its optional peers):

- `RichTextEditor`: a field for formatted text (paragraphs, headings 1 to 3, bold, italic, underline, strike, inline code, links, bullet, numbered and task lists, quote, code block, divider, hard break) with undo history, keyboard and Markdown-style shortcuts, a placeholder, read-only and disabled states and the field base's label, description, validation, dirty state and restore. Its value is the document as JSON (`RichTextDocument`).
- `createRichTextSchema`: the default schema, extended, replaced or trimmed per node and mark type through library-owned specs.
- `useRichTextController` and `RichTextCommand`: a controller for chrome inside the editor (state at the selection, `supports`, `can`, `isActive`, `run`, `focus`).
- `FormatToolbar`, `SelectionToolbar`, `InsertMenu` (the `/` menu), `InsertMenuButton` and `BlockHandle` (drag, turn into, move, duplicate, delete; Alt+Shift+Up and Down move a block).
- `serializeRichTextHtml` and `serializeRichTextText` export a document without a browser.
- Glyphs `paragraph`, `bold`, `italic`, `underline`, `strikethrough`, `code`, `code-block`, `heading-1`, `heading-2`, `heading-3`, `list-bullet`, `list-numbered`, `list-task`, `quote` and `unlink`, and the rich-text strings.

Hosts must give `.ui-rich-text-editor__content` ProseMirror's `white-space` rules (see `specs/RICH-TEXT-EDITOR.md` and the reference partial).
