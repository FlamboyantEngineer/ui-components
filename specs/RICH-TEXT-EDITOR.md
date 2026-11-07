# Rich Text Editor

`RichTextEditor` is a field for formatted text: paragraphs, headings, bullet, numbered and task lists, quotes, code blocks, dividers, hard breaks and the bold, italic, underline, strike, inline code and link marks, with undo history, keyboard shortcuts and Markdown-style shortcuts as you type. Its value is the document as ProseMirror JSON, typed by the library (`RichTextDocument`), and its schema is the default one or a caller's extension of it. Chrome rendered inside it drives it through a library-owned controller (`useRichTextController`): `FormatToolbar` (a toolbar row of marks and block types that reflects the selection), `SelectionToolbar` (a toolbar floating over selected text), `InsertMenu` (a `/` command menu at the caret) with `InsertMenuButton`, and `BlockHandle` (a handle beside the current block that drags it or opens its menu). `serializeRichTextHtml` and `serializeRichTextText` export a document without a browser.

The engine is [ProseMirror](https://prosemirror.net) with its React view `@handlewithcare/react-prosemirror`, declared as optional peer dependencies. The family is exported from its own entry point, `@flamboyantengineer/ui-components/rich-text-editor`, and not from the package root, so applications without the editor install none of them.

## UIC-RICH-TEXT-EDITOR-1 - Editor

### UIC-RICH-TEXT-EDITOR-1.1 - Field around an editable document

`RichTextEditor` shall render a `Field` (root `ui-field`, also `ui-rich-text-editor`) whose control is the document: an element with role `textbox` and `aria-multiline="true"` (`ui-rich-text-editor__content`) named by the field's label and described by its description and message, inside a frame (`ui-rich-text-editor__frame`) holding the optional toolbar row and the surface (`ui-rich-text-editor__surface`, positioned so chrome can be placed in it). It takes the field props (`FieldInputProps<RichTextDocument>`): label and layout, description, help, menu, validation, dirty state and restore. The caller's `className`, `id` and `data-*` attributes go on the field's root.

Implementation: `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-1.2 - Engine and the styles it needs

The editor shall render the document with ProseMirror through `@handlewithcare/react-prosemirror`; only modules of this component (and of the message composer's rich mode, UIC-MESSAGE-COMPOSER-4.1) import them, a component that composes the rich mode (`Chat`, UIC-CHAT-1.1) ships from its own entry point as these do, and no public declaration exposes their types. The package ships no CSS: a host stylesheet must give the content element ProseMirror's required rules, which the reference partial includes: `white-space: pre-wrap` (then `break-spaces`), `overflow-wrap: break-word` and no ligatures on `ui-rich-text-editor__content`, `white-space: pre-wrap` on its `pre`, `position: relative` on its `li`, and the `ProseMirror-hideselection`, `ProseMirror-selectednode` and `ProseMirror-separator` rules. The rich mode reuses this component's engine glue through its main module rather than copying it: the placeholder decoration, the engine state kept in step with a value (`useSyncedEditorState`, given how to parse, serialise, compare and replace that value) and the `editable` callback, which keeps its identity while editability does. It sizes its rows with the line box (`readLineBox`) that the growing text area also reads. None of these is exported from the entry point.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/rich-text-editor.tsx`, `src/utils/read-line-box.ts`, `labs/reference/rich-text-editor.css`, `package.json`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `src/utils/read-line-box.test.ts`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-1.3 - Value as JSON

The value shall be the document as JSON (`RichTextDocument`: `{ type: 'doc', content }` with nodes of `type`, `attrs`, `content`, `text` and `marks`), controlled with `value` or uncontrolled with `defaultValue`; each edit calls `onChange` with the new document. Without either the document starts as the schema's empty document (one empty paragraph), which is also the field's empty value. A document the schema cannot read throws.

Each reported document shall keep, as the same objects, every part the edit left alone, from the previous report or from the document the editor was given when it is already in the engine's form, so an edit costs as much as its path rather than the document. The field compares documents with `isRichTextEqual`, which stops at shared parts, instead of a serialized key, and keeps no history of them (UIC-RICH-TEXT-EDITOR-3.4). `npm run bench:rich-text` measures 20 edits at 20,000, 200,000 and 1,000,000 characters; at 1,000,000 characters the median edit went from about 20 ms to 0.2 ms and the heap the 20 values retain from about 145 MiB to 3 MiB.

Implementation: `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/rich-text-document.ts`, `scripts/bench-rich-text.mjs`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-1.4 - Placeholder

While the document holds only one empty text block, its block shall carry `ui-rich-text-editor__placeholder` and `data-placeholder` with the `placeholder` text, for the stylesheet to show; the content element always names it in `aria-placeholder`.

Implementation: `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-1.5 - Toolbar and chrome

`toolbar` shall render in `ui-rich-text-editor__toolbar` above the surface, and `children` inside the surface after the content: floating chrome such as `SelectionToolbar`, `InsertMenu` and `BlockHandle`. Both render inside the editor's context, where `useRichTextController` and the chrome components work; outside a `RichTextEditor` they throw.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/rich-text-context.ts`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-2 - Schema

### UIC-RICH-TEXT-EDITOR-2.1 - Default schema

The default schema shall hold the nodes `doc`, `paragraph`, `heading` (`level` 1 to 3), `blockquote`, `codeBlock`, `horizontalRule`, `bulletList`, `orderedList` (`start`, any whole number including 0 and negatives; a missing or unreadable `start` reads as 1), `listItem`, `taskList`, `taskItem` (`checked`), `text` and `hardBreak`, and the marks `link` (`href`, `title`), `bold`, `italic`, `underline`, `strike` and `code`, named as most ProseMirror-based editors name them, so their JSON loads unchanged. Each parses its HTML elements (pasted or dropped) and renders standard HTML; links keep only safe addresses (`http`, `https`, `mailto`, `tel` or relative).

Implementation: `src/components/rich-text-editor/default-schema.ts`, `src/components/rich-text-editor/rich-text-schema.ts`, `src/utils/safe-url.ts`
Verification: `src/components/rich-text-editor/rich-text-schema.test.ts`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-2.2 - Extending or replacing the schema

`createRichTextSchema({ nodes, marks })` shall return a `RichTextSchema` (its node and mark names, in order) built from the defaults with the caller's types: a new name is added, a default's name replaces it in place, and `null` removes it (`doc` and `text` stay). Specs are library-owned (`RichTextNodeSpec`, `RichTextMarkSpec`): ProseMirror's content expressions, groups, attributes with defaults, parse rules by tag and a renderer returning a tag, attributes and the content hole (`['aside', { class: 'note' }, 0]`). A replacement's renderer applies both in the editor and in HTML serialization. The editor's `schema` prop takes one, created once outside render; chrome leaves out commands its types do not support.

Implementation: `src/components/rich-text-editor/rich-text-schema.ts`, `src/components/rich-text-editor/engine-schema.ts`, `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-schema.test.ts`, `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-2.3 - Task items

While the schema uses the unchanged default `taskItem` specification, the editor shall draw each task item as `ui-rich-text-editor__task-item` (with `data-checked` while ticked), holding a `Checkbox` named by the provider string `taskDone` in `ui-rich-text-editor__task-checkbox` and the item's content in `ui-rich-text-editor__task-content`. Toggling the checkbox sets the item's `checked` attribute as an edit. A read-only editor's checkboxes are read-only and stay focusable; a disabled editor's checkboxes are disabled and out of the tab sequence, as its content is (UIC-RICH-TEXT-EDITOR-4.1).

A replacement `taskItem` uses its own renderer, without the default task wrappers or checkbox behaviour.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/task-item-view.tsx`, `src/core/strings/rich-text.ts`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-3 - Editing

### UIC-RICH-TEXT-EDITOR-3.1 - Keyboard shortcuts

The editor shall run these shortcuts (`Mod` is Ctrl, or Cmd on Apple platforms) when the schema has the types they need: Mod+B bold, Mod+I italic, Mod+U underline, Mod+Shift+S strike, Mod+E inline code; Mod+Alt+0 paragraph, Mod+Alt+1 to 3 headings, Mod+Alt+C code block; Mod+Shift+7 numbered list, Mod+Shift+8 bullet list, Mod+Shift+9 task list, Mod+Shift+B quote; Mod+Z undo, Mod+Shift+Z and Mod+Y redo; Alt+Shift+Up and Down move the block (UIC-RICH-TEXT-EDITOR-5.5); plus ProseMirror's base keys.

Implementation: `src/components/rich-text-editor/rich-text-keys.ts`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-3.2 - Markdown shortcuts

Typed at the start of a text block, `# `, `## ` and `### ` shall make a heading, `- `, `* ` or `+ ` a bullet list, `1. ` a numbered list starting at that number, `[ ] ` or `[x] ` an open or done task, `> ` a quote, ` ``` ` and a space a code block, and `---` in an empty block a divider. Typed around text, `**text**` makes it bold, `*text*` or `_text_` italic, `~~text~~` struck and `` `text` `` inline code. Backspace right after a shortcut undoes it. Code blocks and inline code take no shortcuts.

Implementation: `src/components/rich-text-editor/rich-text-keys.ts`, `src/components/rich-text-editor/insert-commands.ts`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-3.3 - Lists and line breaks

In a list item, Enter shall split the item (an empty item leaves the list), Tab or Mod+] nests it in the previous item and Shift+Tab or Mod+[ lifts it out; outside a list Tab moves focus as usual. Shift+Enter or Mod+Enter inserts a hard break, or leaves a code block for a new paragraph after it.

Implementation: `src/components/rich-text-editor/rich-text-keys.ts`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-3.4 - History

The editor shall keep the field's one undo history: edits (typing grouped by ProseMirror) and each document replaced from outside (UIC-RICH-TEXT-EDITOR-4.2), one step each. The shortcuts, the `undo` and `redo` commands and the field's undo (its chords pressed anywhere in the field and `getFieldUndo`, UIC-FIELD-5.3) all step through it, so undoing a restore, a clear or a controlled change brings the earlier document back. The field keeps no history of its own (UIC-FIELD-5.1).

Implementation: `src/components/rich-text-editor/rich-text-keys.ts`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-3.5 - Edits at the latest caret

A key, typed text, paste, cut or drop shall act at the browser's current selection, even when the caret moved while the editor was committing a render and the engine never saw the move: before handling one, the editor takes the browser's text selection into its state when they differ. Node selections and compositions are left alone. The rich composer mode (UIC-MESSAGE-COMPOSER-4.1) does the same.

Implementation: `src/components/rich-text-editor/dom-selection-sync.ts`, `src/components/rich-text-editor/editor-surface.tsx`, `src/components/message-composer/rich/rich-editor.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-4 - Field behaviour

### UIC-RICH-TEXT-EDITOR-4.1 - Read-only, disabled, invalid and required

A read-only editor shall keep its document readable, focusable and selectable but refuse every edit (`contenteditable="false"`, `aria-readonly`, `data-readonly` on the content); a disabled one is also out of the tab sequence (`aria-disabled`, `data-disabled`), and so are the anchors of its default links (`tabindex="-1"` while disabled), while a read-only editor's links stay focusable and followable. Neither offers commands: the controller's `can` and `run` refuse and the chrome disables or hides itself. Locking an editor dismisses its slash menu, insert button menu, block menu and link editor; unlocking does not reopen the button menus or link editor. An invalid field marks the content `aria-invalid`; a required one reports `aria-required` and is invalid (`valueMissing`) while its document is empty. A document is empty when it holds nothing but structure: text that is only whitespace, line breaks, and empty paragraphs, lists, quotes or code blocks, however many; any other leaf, such as a divider or an atom of a caller schema, counts as content. The field judges emptiness by the same rule, so an empty document carries no `data-filled` (UIC-FIELD-3.1) and a document with content does.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/link-mark-view.tsx`, `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/rich-text-controller.ts`, `src/components/rich-text-editor/block-handle.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-4.2 - Value changes from outside, commit and restore

When the value changes to a document other than the one shown (a controlled change, the field's restore, clear or set to default), the editor shall replace its document, the content and the root attributes of a caller schema's `doc`, in one step of its own in the undo history (UIC-RICH-TEXT-EDITOR-3.4), so later edits keep the replaced attributes; an unchanged document is left alone. The field commits when focus leaves it (UIC-FIELD-1.11), so Tab from the edited content reaches the restore button without committing, and focus in the editor's own chrome or popovers commits nothing; while the value differs from the committed value the field is dirty and its restore button puts the committed document back.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/rich-text-editor.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-4.3 - Form value

With `name`, the editor shall submit its document with its form through a hidden input under that name holding the document's JSON (UIC-RICH-TEXT-EDITOR-1.3), which `JSON.parse` turns back into the same document with every block, attribute and mark. The input reads the field's value, keeping no copy of the document, and follows every edit, controlled change, undo, restore, clear and native form reset (UIC-FIELD-2.6); an empty editor submits its empty document. A read-only editor submits its document; a disabled one, or one inside a disabled `<fieldset>`, submits nothing, and an editor without `name` adds no entry.

Implementation: `src/components/rich-text-editor/rich-text-editor.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-5 - Commands and controller

### UIC-RICH-TEXT-EDITOR-5.1 - Commands as data

A `RichTextCommand` shall be plain data naming schema types: `toggle-mark` (adds the mark to the selection, or removes it where the selection has it; at a caret it applies to what is typed next), `set-block` (turns the selected text blocks into a type with attributes), `toggle-wrap` (wraps the selected blocks in a list or quote, turns a list into another list type, or lifts them out), `insert` (an inline node at the caret; a text block type by turning the block into it; another block in place of an empty text block or after the current one, the caret going into it or after a leaf), `insert-text`, `set-link`, `undo`, `redo`, `move-block`, `duplicate-block` and `delete-block`.

Implementation: `src/components/rich-text-editor/rich-text-command.ts`, `src/components/rich-text-editor/engine-commands.ts`, `src/components/rich-text-editor/insert-commands.ts`
Verification: `src/components/rich-text-editor/engine-commands.test.ts`

### UIC-RICH-TEXT-EDITOR-5.2 - Controller

`useRichTextController()`, called in chrome inside a `RichTextEditor`, shall return a `RichTextController` that renders its caller again whenever the editor's state changes: `isEditable`, `isSelectionEmpty`, `link` (the address of the link at the selection's start), `supports(command)` (the schema has its types), `can(command)` (it would change the document now), `isActive(command)` (a mark present in the selection or the stored marks at a caret; every selected text block of the type and attributes; the selection inside the list type or quote), `run(command)` and `focus()`.

Implementation: `src/components/rich-text-editor/rich-text-controller.ts`, `src/components/rich-text-editor/engine-commands.ts`
Verification: `src/components/rich-text-editor/engine-commands.test.ts`, `src/components/rich-text-editor/rich-text-editor.test.tsx`

### UIC-RICH-TEXT-EDITOR-5.3 - Caller chrome

A caller's own controls shall drive the editor through the controller in the editor's `toolbar` or `children`, or as children of `FormatToolbar` and `SelectionToolbar`, which render them after their own.

Implementation: `src/components/rich-text-editor/rich-text-controller.ts`, `src/components/rich-text-editor/format-toolbar.tsx`, `src/components/rich-text-editor/selection-toolbar.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-5.4 - Links

`set-link` with an address shall link the selected text, change the whole link around a caret, or at a caret outside a link insert the address as linked text; with `null` it removes the link from the selection or around the caret. An empty or unsafe address (`javascript:`) is refused.

Implementation: `src/components/rich-text-editor/insert-commands.ts`
Verification: `src/components/rich-text-editor/engine-commands.test.ts`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-5.5 - Block commands

The block commands shall act on the top-level blocks the selection touches, one or several (a select-all touches them all): `move-block` swaps them with the block before (`up`) or after (`down`) and keeps the selection in them (refused when there is no such block), `duplicate-block` inserts a copy of them after them and moves the selection into the copy, and `delete-block` removes them, leaving an empty paragraph when they were the whole document.

Implementation: `src/components/rich-text-editor/block-commands.ts`, `src/components/rich-text-editor/block-handle.tsx`
Verification: `src/components/rich-text-editor/engine-commands.test.ts`, `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-6 - Format Toolbar

### UIC-RICH-TEXT-EDITOR-6.1 - Buttons

`FormatToolbar` shall render a `ToolbarRow` (its root also `ui-format-toolbar`) whose toolbar strip is named by `aria-label`, `aria-labelledby` or the provider string `textFormatting`, holding undo and redo, the block type select, the marks (bold, italic, underline, strike, code), the link button, and the bullet, numbered and task lists and the quote, then its `children`, with separators between the groups. Each command is a small `Button` with a tooltip and its shortcut, pressed (`aria-pressed`) while `isActive`, disabled while it cannot run, and left out when the schema lacks its types. A pointer press keeps focus, and the selection, in the document.

Implementation: `src/components/rich-text-editor/format-toolbar.tsx`, `src/components/rich-text-editor/format-controls.tsx`, `src/components/rich-text-editor/format-items.ts`, `src/components/layout/layout.tsx`, `src/core/strings/rich-text.ts`, `src/core/glyphs.tsx`
Verification: `src/components/rich-text-editor/format-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-6.2 - Block type

The toolbar shall hold a `SelectField` (`ui-format-toolbar__block-type`, label `blockType` without a visible label) of the text block types the schema supports (paragraph, headings 1 to 3, code block), showing the type of the selected blocks, or its placeholder when they differ. Choosing one turns the selected blocks into it and returns focus to the document. `blockTypeLabels` chooses how the options are drawn: `plain` (the default) with the type's glyph and name, or `preview` with the name alone in `ui-format-toolbar__block-preview`, carrying `data-block` with the type's id (`paragraph`, `heading-1` to `heading-3`, `code-block`), for the host's styles to draw each name the way its block looks. Either way each option is named by its type's name, keeps its selected state and arrow-key navigation, and the trigger names the current type in plain text.

Implementation: `src/components/rich-text-editor/format-controls.tsx`, `src/components/rich-text-editor/format-toolbar.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/format-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-6.3 - Link editor

The link button (pressed on a link) shall open a `Popover` (`ui-format-toolbar__link-editor`, or `ui-selection-toolbar__link-editor` in the selection toolbar) with a `linkAddress` text field holding the current link's address, an Apply button (disabled for an empty or unsafe address) that submits on Enter, and a `removeLink` button while the selection has a link. Applying or removing runs `set-link`, closes the popover and returns focus to the document. The link editor is a form of its own: applying, removing or cancelling never submits a form around the editor (a plain form or `Form`), and its address field is not one of that form's fields.

Implementation: `src/components/rich-text-editor/format-controls.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/format-toolbar.test.tsx`, `src/components/rich-text-editor/selection-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-7 - Selection Toolbar

### UIC-RICH-TEXT-EDITOR-7.1 - Floating over selected text

`SelectionToolbar` shall show a non-modal popover (`ui-selection-toolbar`) above a selected text range while the document or the toolbar has focus and the editor is editable, following the selection as it changes and as the layout moves it without an edit (a scroll, a window resize, the content resizing, rewrapping or moving, such as when a sidebar opens or fonts load), measured at most once per animation frame; a caret or a selected node shows none, and neither does a range scrolled out of the window or the content, until it shows again. It holds a `ToolbarRow` (its root also `ui-selection-toolbar__row`, its toolbar strip named by `aria-label`, `aria-labelledby` or `selectionFormatting`) of the mark buttons and the link button, then its `children`.

Implementation: `src/components/rich-text-editor/selection-toolbar.tsx`, `src/utils/overlay-auto-update.ts`
Verification: `src/components/rich-text-editor/selection-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-7.2 - Keyboard

Alt+F10 in the document shall move focus to the toolbar's first enabled button, and Escape in the toolbar returns focus to the document and hides the toolbar until the selection changes.

Implementation: `src/components/rich-text-editor/selection-toolbar.tsx`
Verification: `src/components/rich-text-editor/selection-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-8 - Insert Menu

### UIC-RICH-TEXT-EDITOR-8.1 - Slash menu

`InsertMenu` shall open a `CompletionList` (also `ui-insert-menu`, named by `aria-label`, `aria-labelledby` or `insertCommands`) against a caret marker (`ui-insert-menu__caret`) placed at the slash, while the focused, editable document has a `/` at the start of a text block or after white space followed by a query up to the caret (no space, not in code). It lists the built-in entries the schema supports (paragraph, headings 1 to 3, code block, bullet, numbered and task lists, quote, divider) then the caller's `items` (`InsertMenuItem`: `id`, `label`, `description`, `icon`, `keywords`, `command`), matched by label or keyword as completions match (best first); with no match it closes.

Each entry shall use its best label or keyword score, stopping its keyword scan once a prefix match is found without building a keyword score array or depending on an argument limit. All matching entries are ordered by score, preserving input order for ties. Under an ancestor's axis-aligned `transform: scale()`, the caret marker is placed in the editor surface's own layout pixels, so the menu opens at the caret; rotated or skewed ancestors are not supported.

Implementation: `src/components/rich-text-editor/insert-menu.tsx`, `src/components/rich-text-editor/use-slash-menu.ts`, `src/components/rich-text-editor/insert-items.ts`, `src/components/completion-list/completion-list.tsx`, `src/utils/element-scale.ts`
Verification: `src/components/rich-text-editor/insert-items.test.ts`, `src/components/rich-text-editor/insert-menu.test.tsx`, `e2e/rich-text-editor.spec.ts`, `src/utils/element-scale.test.ts`

### UIC-RICH-TEXT-EDITOR-8.2 - Keys and insertion

While the menu is open, ArrowDown and ArrowUp shall move the active entry (wrapping), Enter or Tab replace the slash and query with the active entry's command, and Escape closes the menu until the current slash query ends; removing and retyping a slash at the same source position can open a new menu. Pressing an entry inserts it. Keys an input method owns (pressed during a composition, or reported with key code 229 as one ends) neither move, run nor close it. A menu callback that remains pending after the editor locks cannot change the document. Focus stays in the document, which autocompletes from a list (`aria-autocomplete="list"`, `aria-haspopup="listbox"`) and, while open, names the list in `aria-controls` and the active entry in `aria-activedescendant`.

Implementation: `src/components/rich-text-editor/use-slash-menu.ts`, `src/components/rich-text-editor/insert-menu.tsx`
Verification: `src/components/rich-text-editor/insert-menu.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-8.3 - Insert button

`InsertMenuButton` shall render an icon-only `DropdownMenu` (also `ui-insert-menu-button`, label `insert`, glyph `plus`) listing the same entries; choosing one runs its command at the selection and returns focus to the document. It is disabled while the editor is not editable.

Implementation: `src/components/rich-text-editor/insert-menu.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/insert-menu.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-9 - Block Handle

### UIC-RICH-TEXT-EDITOR-9.1 - Placement

`BlockHandle` shall render `ui-block-handle`, absolutely placed in the surface at the top of the top-level block level with the pointer, or else of the first block the selection touches while the document or the handle has focus or its menu is open; it renders nothing otherwise or while the editor is not editable. The pointer picks a block over its text or anywhere in the surface's gutter beside it, entered directly from outside the editor without crossing the text; in a gap between blocks it picks the nearer one, and as the surface scrolls under a still pointer it picks the block now beside it. Over the handle itself the block stays, and hovering never selects, focuses or changes the document. It follows the block as the document changes.

Implementation: `src/components/rich-text-editor/block-handle.tsx`, `src/components/rich-text-editor/use-block-target.ts`, `src/components/rich-text-editor/block-at-pointer.ts`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-9.2 - Drag

The handle's grip (`ui-block-handle__grip`, the `drag-handle` glyph, hidden from assistive technology) shall drag its block between the top-level blocks: while the drag is over the surface, a drop indicator (`ui-block-handle__drop-indicator`, absolutely placed in the surface at the gap's top) marks the gap nearest the pointer, before the first block whose middle lies below it or after the last block, as the document scrolls too. Dropping there moves the block, with its content and formatting, into that gap as one edit with its own undo step, never into a list or a quote, and selects it. A drop that would leave the block in place, a drop outside the surface and a cancelled drag (Escape) change nothing and show no indicator. The handle stays on the dragged block and carries `data-dragging` until the drag ends; an editor that stops being editable ends it. A drag belongs to the document it started in: once the document changes, whether the host replaces the value or an edit lands, the drag shows no indicator and its drop changes nothing, so a stale position never moves or drops into another block. The menu and Alt+Shift+Up and Down are the keyboard alternative.

Implementation: `src/components/rich-text-editor/block-handle.tsx`, `src/components/rich-text-editor/use-block-drop.ts`, `src/components/rich-text-editor/use-block-target.ts`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `src/components/rich-text-editor/block-handle-stale.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-9.3 - Block menu

The handle's menu button (`ui-block-handle__menu`, an icon-only `DropdownMenu` named `blockActions`) shall select the block when it opens (a selection over several blocks including it stays, so the menu acts on all of them) and offer a `turnInto` submenu of the block types and wrappers the schema supports, then `moveUp`, `moveDown`, `duplicate` and `delete` (disabled when they cannot run). Choosing an entry runs it on the block and returns focus to the document.

Implementation: `src/components/rich-text-editor/block-handle.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-9.4 - Controls

`BlockHandle` is an optional child: an editor without one shows neither a grip nor a block menu and keeps the block keys (UIC-RICH-TEXT-EDITOR-5.5) and every editing behaviour. `grip` and `menu` (both default `true`) choose the handle's controls: `grip={false}` leaves out the grip and dragging, `menu={false}` leaves out the menu button, so the handle holds no focus target, and with both `false` the handle renders nothing. While a handle with either control is mounted, the surface carries `data-gutter`, naming the controls the handle is drawn with: `both`, `grip` or `menu`, so a host sizes the gutter for those controls alone. It follows the configured controls, not the hovered block, so the document does not shift when the handle appears, and it changes or goes when the controls change or the handle unmounts; without one it carries none, so a host reserves no space for an absent handle.

Implementation: `src/components/rich-text-editor/block-handle.tsx`, `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/rich-text-context.ts`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-10 - Export

### UIC-RICH-TEXT-EDITOR-10.1 - HTML

`serializeRichTextHtml(document, { schema })` shall return the document as HTML, rendered as each node and mark type renders itself, with runs of shared marks kept in one element, text and attribute values escaped (a mark's element stays whole whatever characters its attributes hold, U+0000 included), and no browser document needed. The default `link` mark renders an `<a>` with its safe `href` and `title` only: it opens in the same tab, so it takes no `rel`, and the HTML it writes is what [HTML Markup](HTML-MARKUP.md) keeps.

Implementation: `src/components/rich-text-editor/rich-text-export.ts`
Verification: `src/components/rich-text-editor/rich-text-export.test.ts`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-10.2 - Plain text

`serializeRichTextText(document, { schema })` shall return the document's text with one line per text block and a line break for each hard break.

Implementation: `src/components/rich-text-editor/rich-text-export.ts`, `src/components/rich-text-editor/default-schema.ts`
Verification: `src/components/rich-text-editor/rich-text-export.test.ts`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-11 - Accessibility and hooks

### UIC-RICH-TEXT-EDITOR-11.1 - Accessibility

The document shall be a labelled multi-line text box; every toolbar is a named `toolbar` moved through with the arrow keys; every pointer interaction has a keyboard path (shortcuts, Alt+F10, the slash menu, the block menu, Alt+Shift+Up and Down); the lab passes axe in the light and dark reference themes with the toolbars, the selection toolbar and the slash menu shown.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/format-toolbar.tsx`, `src/components/rich-text-editor/selection-toolbar.tsx`, `src/components/rich-text-editor/insert-menu.tsx`, `src/components/rich-text-editor/block-handle.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`, `e2e/accessibility.spec.ts`

### UIC-RICH-TEXT-EDITOR-11.2 - Hooks and caller attributes

Each component of the family shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes to it.

Implementation: `src/components/rich-text-editor/rich-text-context.ts`, `src/components/rich-text-editor/format-toolbar.tsx`, `src/components/rich-text-editor/selection-toolbar.tsx`, `src/components/rich-text-editor/insert-menu.tsx`, `src/components/rich-text-editor/block-handle.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `src/components/rich-text-editor/format-toolbar.test.tsx`, `src/components/rich-text-editor/selection-toolbar.test.tsx`, `src/components/rich-text-editor/insert-menu.test.tsx`, `src/components/rich-text-editor/block-handle.test.tsx`

## UIC-RICH-TEXT-EDITOR-12 - Long documents

### UIC-RICH-TEXT-EDITOR-12.1 - Scrolling surface

The surface (`ui-rich-text-editor__surface`) shall be the document's scrolling viewport once the host bounds its height (the reference stylesheet gives it `overflow: auto`; a host sets `max-height` or `height`). It sits in `ui-rich-text-editor__body` beside `ui-rich-text-editor__scrollbars`, the shared overlay scrollbars of [Scroll Region](SCROLL-REGION.md), which draw a vertical track only while the surface overflows and keep its thumb out of the Tab sequence. The reference stylesheet hides the native scrollbar. The content carries `tabindex="0"` unless the editor is disabled, so the scrolling surface holds a stop in the tab sequence. The caret, selection, keyboard scrolling and the wheel keep scrolling the surface natively, and the floating chrome stays with its blocks as it scrolls.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/surface-scrollbars.tsx`, `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-12.2 - Block markers

`blockMarkers` shall carry the host's own findings about the document: each names a first top-level block (`block`, an index into the document's `content`), an optional last one (`endBlock`), a `severity` (`error` by default, or `warning`) and a `message`. The editor checks nothing itself. Each marked block carries `data-severity` (the gravest of its markers) and its markers' messages as its `aria-description`, so the finding is not told by colour alone. While the surface scrolls, each marker draws a `ui-rich-text-editor__scroll-marker` (with `data-severity`, hidden from assistive technology) in the vertical track at its blocks' place in the whole document, measured in the surface's own pixels. Markers follow edits, rewrapping and resizing; a marker whose first block is past the document's end is left out, and its last block is clamped to the end.

Implementation: `src/components/rich-text-editor/block-markers.ts`, `src/components/rich-text-editor/surface-scrollbars.tsx`, `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/rich-text-editor.tsx`
Verification: `src/components/rich-text-editor/block-markers.test.ts`, `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-13 - Extensions

### UIC-RICH-TEXT-EDITOR-13.1 - Extension contributions

A `RichTextExtension` shall name one feature of an editor and contribute any of: node types and mark types (`RichTextExtensionNode`, `RichTextExtensionMark`: a name, a ProseMirror spec and an `order`), engine plugin contributions (`RichTextPluginContribution`: a name, a `priority`, a `build(context, schema)` that returns plugins and an optional `when(context)` gate), node views and mark views by type name, and the names of the extensions it `requires`. Extensions are the shared core of every rich-text editor: the editor in this library and editors built on it assemble their features the same way, whoever registers them.

Implementation: `src/components/rich-text-editor/rich-text-extension.ts`
Verification: `src/components/rich-text-editor/rich-text-extension.test.tsx`

### UIC-RICH-TEXT-EDITOR-13.2 - Kit assembly and order

`createRichTextKit(extensions)` shall return a `RichTextKit` whose `schema` holds every contributed node and mark type ordered by `order`, ties in registration order; the first node type is the top node. `buildPlugins(context)` shall return the plugins of every contribution whose `when` admits the context, ordered by `priority` with ties in registration order, and `pluginOrder` lists the contribution names in that order. `nodeViews` and `markViews` merge the views of every extension. The order in which extensions are passed only breaks ties.

Implementation: `src/components/rich-text-editor/rich-text-extension.ts`
Verification: `src/components/rich-text-editor/rich-text-extension.test.tsx`

### UIC-RICH-TEXT-EDITOR-13.3 - Conflicts fail early

`createRichTextKit` shall throw, naming the extensions involved, when two extensions share a name, when a required extension is missing, or when two extensions contribute the same node type, mark type, plugin contribution name, node view or mark view.

Implementation: `src/components/rich-text-editor/rich-text-extension.ts`
Verification: `src/components/rich-text-editor/rich-text-extension.test.tsx`

### UIC-RICH-TEXT-EDITOR-13.4 - Built-in extensions

`createRichTextSchema` shall assemble its schema as a kit of the built-in `base` extension (the default types with the caller's `nodes` and `marks` changes, ordered 0, 10, 20 and so on, so an extension can place a type between two defaults), the built-in `editing` extension (history, input rules and shortcuts, at priority 500) and the caller's `extensions`. `getRichTextKit(schema)` returns the kit, whose engine schema is the one the editor and HTML serialization use.

Implementation: `src/components/rich-text-editor/rich-text-schema.ts`, `src/components/rich-text-editor/engine-schema.ts`
Verification: `src/components/rich-text-editor/rich-text-extension.test.tsx`

### UIC-RICH-TEXT-EDITOR-13.5 - Extensions in the editor

`RichTextEditor` given a schema with extensions shall run the kit's plugins in their order and render the extensions' node views and mark views, built once per schema, beside the default task item and link views. A node view is a React component that takes the engine's node view props; it renders the node's content inside the element it gives `nodeProps.contentDOMRef`, which stays editable.

Implementation: `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-extension.test.tsx`

### UIC-RICH-TEXT-EDITOR-13.6 - Server-safe assembly

Kits shall be assembled without a DOM, so a server builds the same schema and plugin order as the browser and reads and writes the same documents.

Implementation: `src/components/rich-text-editor/rich-text-extension.ts`
Verification: `src/components/rich-text-editor/rich-text-extension.test.tsx`

## UIC-RICH-TEXT-EDITOR-14 - Engines

### UIC-RICH-TEXT-EDITOR-14.1 - Gated transactions

Every engine, rendered or headless, shall pass each transaction to `onTransaction`, then to the caller's `dispatchTransaction(tr, view, commit)`, which commits it with `commit.applyDefault()` (the transaction applied, or an `override` transaction instead) or `commit.applyState(next)` (a state the body computed), or drops it by calling neither. Without a body, every transaction commits. `onSelectionChange` reports a selection a committed transaction moved.

Implementation: `src/components/rich-text-editor/rich-text-engine.ts`, `src/components/rich-text-editor/headless-engine.ts`, `src/components/rich-text-editor/rich-text-engine-view.tsx`
Verification: `src/components/rich-text-editor/headless-engine.test.ts`, `src/components/rich-text-editor/rich-text-engine-view.test.tsx`

### UIC-RICH-TEXT-EDITOR-14.2 - Headless commits

`createRichTextHeadlessEngine(options)` shall run an engine with no rendered document and return a `RichTextEngineHandle` (`view`, `getView`, `replaceState`, `destroy`, `whenDestroyed`). A commit lands at once: `view.state` is the new state and every plugin view has updated before `applyState` returns. `afterCommit` fires for every commit, and `onUpdated(view, previous)` only for a transaction's, both once the outermost dispatch body has returned, one pair per commit in commit order, including the commits a plugin view makes while it updates. `replaceState` and `view.updateState` commit without `onUpdated`; `replaceState` settles once committed and rejects once the engine is destroyed, which ignores later dispatches.

Implementation: `src/components/rich-text-editor/headless-engine.ts`
Verification: `src/components/rich-text-editor/headless-engine.test.ts`

### UIC-RICH-TEXT-EDITOR-14.3 - Headless plugin views

The headless engine shall create the state's plugin views in plugin order when it starts, update them for each commit, create them afresh when a commit brings another plugin set, and destroy them last to first on `destroy`, then fire `onUnmounted` and settle `whenDestroyed`. A plugin view may dispatch while the views are created, as a collaboration binding does on its first synchronization: the commit updates the views created so far, the remaining views see its state, and its notifications follow `onMounted`.

Implementation: `src/components/rich-text-editor/headless-engine.ts`
Verification: `src/components/rich-text-editor/headless-engine.test.ts`

### UIC-RICH-TEXT-EDITOR-14.4 - Headless view members

The headless view shall answer `endOfTextblock` from the selection (up and down as backward and forward), find `someProp` values in its `props` before its plugins' and merge `setProps`, never hold focus or edit, and stand in for its element with an object whose listeners, classes and queries do nothing. Members that need a rendered document (`coordsAtPos`, `posAtCoords`, `domAtPos`, `nodeDOM` and the others) shall throw an error that `isRichTextHeadlessDomError` recognises and that names the member. The engine reads no DOM, so a server runs it too, and `isRichTextHeadlessView` tells its view from a rendered one.

Implementation: `src/components/rich-text-editor/headless-engine.ts`, `src/components/rich-text-editor/headless-view.ts`
Verification: `src/components/rich-text-editor/headless-engine.test.ts`

### UIC-RICH-TEXT-EDITOR-14.5 - Rendered engine

`RichTextEngineHost` shall render the caller's `state` with the caller's React node and mark views and decorations, and commit through `onStateChange`, which takes a state or an update of the current one as a React state setter does. `RichTextEngineContent`, inside it, renders the document element (`ui-rich-text-engine-content`, also ProseMirror's `ProseMirror` class) with the caller's role, label, class, id and `data-*` attributes. Notifications fire once React shows a new state: `afterCommit` for each, `onMounted` for the first, `onSelectionChange` and `onUpdated` only for states a transaction committed, and `onUnmounted` when the host unmounts. `RichTextEditor` renders its document through the host.

Implementation: `src/components/rich-text-editor/rich-text-engine-view.tsx`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-engine-view.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-14.6 - Moving a state between engines

The rendered host shall add the `reactKeys` plugin its view needs to a state that lacks it, the same keyed copy each render, and `withoutReactKeys(state)` shall take it out for a headless engine, keeping every other plugin's instance and state, so one state moves between a rendered and a headless engine and back.

Implementation: `src/components/rich-text-editor/rich-text-engine-view.tsx`, `src/components/rich-text-editor/headless-engine.ts`
Verification: `src/components/rich-text-editor/rich-text-engine-view.test.tsx`

## Hooks

| Hook                                 | Kind      | Values                                                | Description                                                                     |
| ------------------------------------ | --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ui-rich-text-editor`                | root      |                                                       | The field's root, alongside `ui-field`.                                         |
| `ui-rich-text-editor__frame`         | slot      |                                                       | The box around the toolbar row and the surface.                                 |
| `ui-rich-text-editor__toolbar`       | slot      |                                                       | The row holding `toolbar`.                                                      |
| `ui-rich-text-editor__surface`       | slot      |                                                       | The positioned area holding the content and the floating chrome.                |
| `ui-rich-text-editor__body`          | slot      |                                                       | The positioned box holding the surface and its scrollbars.                      |
| `ui-rich-text-editor__scrollbars`    | slot      |                                                       | The overlay scrollbars over the surface.                                        |
| `ui-rich-text-editor__scroll-marker` | slot      |                                                       | A block marker in the vertical track, with `data-severity`.                     |
| `data-severity`                      | state     | `error`, `warning`                                    | On a marked block and its scroll marker: the marker's severity.                 |
| `ui-rich-text-editor__content`       | slot      |                                                       | The editable document (role `textbox`), also ProseMirror's `ProseMirror` class. |
| `ui-rich-text-editor__placeholder`   | slot      |                                                       | The empty document's only block, which shows the placeholder.                   |
| `ui-rich-text-editor__task-item`     | slot      |                                                       | A task list item in the default task-item view.                                 |
| `ui-rich-text-editor__task-checkbox` | slot      |                                                       | The default task-item view's checkbox holder, alongside a `ui-checkbox`.        |
| `ui-rich-text-editor__task-content`  | slot      |                                                       | The default task-item view's content.                                           |
| `ui-rich-text-engine-content`        | root      |                                                       | `RichTextEngineContent`'s document, also ProseMirror's `ProseMirror` class.     |
| `ui-format-toolbar`                  | root      |                                                       | `FormatToolbar`'s row, alongside `ui-toolbar-row`.                              |
| `ui-format-toolbar__block-type`      | slot      |                                                       | The block type select, alongside `ui-select-field`.                             |
| `ui-format-toolbar__block-preview`   | slot      |                                                       | A block type option's name drawn as a preview, with `data-block`.               |
| `data-block`                         | attribute | `paragraph`, `heading-1` to `heading-3`, `code-block` | On a block preview: the block type it previews.                                 |
| `ui-format-toolbar__link-editor`     | slot      |                                                       | The link editor popover, alongside `ui-popover`.                                |
| `ui-selection-toolbar`               | root      |                                                       | `SelectionToolbar`'s non-modal popover.                                         |
| `ui-selection-toolbar__row`          | slot      |                                                       | Its toolbar row, alongside `ui-toolbar-row`.                                    |
| `ui-selection-toolbar__link-editor`  | slot      |                                                       | Its link editor popover, alongside `ui-popover`.                                |
| `ui-insert-menu`                     | root      |                                                       | The slash menu's popover, alongside `ui-completion-list`.                       |
| `ui-insert-menu__caret`              | slot      |                                                       | The zero-width marker at the slash the menu opens against.                      |
| `ui-insert-menu-button`              | root      |                                                       | `InsertMenuButton`'s trigger, alongside `ui-dropdown-menu`.                     |
| `ui-block-handle`                    | root      |                                                       | The handle, placed beside its block.                                            |
| `ui-block-handle__grip`              | slot      |                                                       | The grip that drags the block.                                                  |
| `ui-block-handle__menu`              | slot      |                                                       | The block menu's trigger, alongside `ui-dropdown-menu`.                         |
| `ui-block-handle__drop-indicator`    | slot      |                                                       | The line marking the gap a dragged block would drop into.                       |
| `data-readonly`                      | state     | `true`                                                | On the content: the editor refuses edits but stays focusable.                   |
| `data-disabled`                      | state     | `true`                                                | On the content: the editor is disabled.                                         |
| `data-placeholder`                   | attribute |                                                       | On the placeholder block: the placeholder text.                                 |
| `data-checked`                       | state     | `true`                                                | On a task item: the task is done.                                               |
| `data-dragging`                      | state     | `true`                                                | On the block handle: its block is being dragged.                                |
| `data-gutter`                        | state     | `both`, `grip`, `menu`                                | On the surface: a block handle with these controls is drawn in its gutter.      |
| `data-placement`                     | state     | `top`, `bottom`, `left`, `right`, `center`            | On the selection toolbar: the side of the selection it opened on (React Aria).  |
| `data-entering`                      | state     | `true`                                                | On the selection toolbar: it is opening (React Aria).                           |
| `data-exiting`                       | state     | `true`                                                | On the selection toolbar: it is closing (React Aria).                           |
