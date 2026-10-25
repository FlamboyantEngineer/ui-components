# Rich Text Editor

`RichTextEditor` is a field for formatted text: paragraphs, headings, bullet, numbered and task lists, quotes, code blocks, dividers, hard breaks and the bold, italic, underline, strike, inline code and link marks, with undo history, keyboard shortcuts and Markdown-style shortcuts as you type. Its value is the document as ProseMirror JSON, typed by the library (`RichTextDocument`), and its schema is the default one or a caller's extension of it. Chrome rendered inside it drives it through a library-owned controller (`useRichTextController`): `FormatToolbar` (a toolbar row of marks and block types that reflects the selection), `SelectionToolbar` (a toolbar floating over selected text), `InsertMenu` (a `/` command menu at the caret) with `InsertMenuButton`, and `BlockHandle` (a handle beside the current block that drags it or opens its menu). `serializeRichTextHtml` and `serializeRichTextText` export a document without a browser.

The engine is [ProseMirror](https://prosemirror.net) with its React view `@handlewithcare/react-prosemirror`, declared as optional peer dependencies. The family is exported from its own entry point, `@flamboyantengineer/ui-components/rich-text-editor`, and not from the package root, so applications without the editor install none of them.

## UIC-RICH-TEXT-EDITOR-1 - Editor

### UIC-RICH-TEXT-EDITOR-1.1 - Field around an editable document

`RichTextEditor` shall render a `Field` (root `ui-field`, also `ui-rich-text-editor`) whose control is the document: an element with role `textbox` and `aria-multiline="true"` (`ui-rich-text-editor__content`) named by the field's label and described by its description and message, inside a frame (`ui-rich-text-editor__frame`) holding the optional toolbar row and the surface (`ui-rich-text-editor__surface`, positioned so chrome can be placed in it). It takes the field props (`FieldInputProps<RichTextDocument>`): label and layout, description, help, menu, validation, dirty state and restore. The caller's `className`, `id` and `data-*` attributes go on the field's root.

Implementation: `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/editor-surface.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-1.2 - Engine and the styles it needs

The editor shall render the document with ProseMirror through `@handlewithcare/react-prosemirror`; only modules of this component import them, and no public declaration exposes their types. The package ships no CSS: a host stylesheet must give the content element ProseMirror's required rules, which the reference partial includes: `white-space: pre-wrap` (then `break-spaces`), `overflow-wrap: break-word` and no ligatures on `ui-rich-text-editor__content`, `white-space: pre-wrap` on its `pre`, `position: relative` on its `li`, and the `ProseMirror-hideselection`, `ProseMirror-selectednode` and `ProseMirror-separator` rules.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `labs/reference/rich-text-editor.css`, `package.json`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-1.3 - Value as JSON

The value shall be the document as JSON (`RichTextDocument`: `{ type: 'doc', content }` with nodes of `type`, `attrs`, `content`, `text` and `marks`), controlled with `value` or uncontrolled with `defaultValue`; each edit calls `onChange` with the new document. Without either the document starts as the schema's empty document (one empty paragraph), which is also the field's empty value. A document the schema cannot read throws.

Implementation: `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/rich-text-document.ts`
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

The default schema shall hold the nodes `doc`, `paragraph`, `heading` (`level` 1 to 3), `blockquote`, `codeBlock`, `horizontalRule`, `bulletList`, `orderedList` (`start`), `listItem`, `taskList`, `taskItem` (`checked`), `text` and `hardBreak`, and the marks `link` (`href`, `title`), `bold`, `italic`, `underline`, `strike` and `code`, named as most ProseMirror-based editors name them, so their JSON loads unchanged. Each parses its HTML elements (pasted or dropped) and renders standard HTML; links keep only safe addresses (`http`, `https`, `mailto`, `tel` or relative).

Implementation: `src/components/rich-text-editor/default-schema.ts`, `src/components/rich-text-editor/rich-text-schema.ts`, `src/utils/safe-url.ts`
Verification: `src/components/rich-text-editor/rich-text-schema.test.ts`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-2.2 - Extending or replacing the schema

`createRichTextSchema({ nodes, marks })` shall return a `RichTextSchema` (its node and mark names, in order) built from the defaults with the caller's types: a new name is added, a default's name replaces it in place, and `null` removes it (`doc` and `text` stay). Specs are library-owned (`RichTextNodeSpec`, `RichTextMarkSpec`): ProseMirror's content expressions, groups, attributes with defaults, parse rules by tag and a renderer returning a tag, attributes and the content hole (`['aside', { class: 'note' }, 0]`). The editor's `schema` prop takes one, created once outside render; chrome leaves out commands its types do not support.

Implementation: `src/components/rich-text-editor/rich-text-schema.ts`, `src/components/rich-text-editor/engine-schema.ts`, `src/components/rich-text-editor/rich-text-editor.tsx`
Verification: `src/components/rich-text-editor/rich-text-schema.test.ts`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-2.3 - Task items

The editor shall draw each task item as `ui-rich-text-editor__task-item` (with `data-checked` while ticked), holding a `Checkbox` named by the provider string `taskDone` in `ui-rich-text-editor__task-checkbox` and the item's content in `ui-rich-text-editor__task-content`. Toggling the checkbox sets the item's `checked` attribute as an edit; a read-only or disabled editor's checkboxes are read-only.

Implementation: `src/components/rich-text-editor/task-item-view.tsx`, `src/core/rich-text-strings.ts`
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

The editor shall keep an undo history of edits (typing grouped by ProseMirror), undone and redone by the shortcuts and the `undo` and `redo` commands. A document replaced from outside (UIC-RICH-TEXT-EDITOR-4.2) stays off the history. When the history has nothing to undo, the field's own undo (`getFieldUndo`) takes the chord.

Implementation: `src/components/rich-text-editor/rich-text-keys.ts`, `src/components/rich-text-editor/editor-state.ts`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-4 - Field behaviour

### UIC-RICH-TEXT-EDITOR-4.1 - Read-only, disabled, invalid and required

A read-only editor shall keep its document readable, focusable and selectable but refuse every edit (`contenteditable="false"`, `aria-readonly`, `data-readonly` on the content); a disabled one is also out of the tab sequence (`aria-disabled`, `data-disabled`). Neither offers commands: the controller's `can` and `run` refuse and the chrome disables or hides itself. Locking an editor dismisses its slash menu, insert button menu, block menu and link editor; unlocking does not reopen the button menus or link editor. An invalid field marks the content `aria-invalid`; a required one reports `aria-required` and is invalid (`valueMissing`) while its document is empty.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/rich-text-editor.tsx`, `src/components/rich-text-editor/rich-text-controller.ts`, `src/components/rich-text-editor/block-handle.tsx`
Verification: `src/components/rich-text-editor/rich-text-editor.test.tsx`, `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-4.2 - Value changes from outside, commit and restore

When the value changes to a document other than the one shown (a controlled change, the field's restore or undo), the editor shall replace its document in one step that keeps it off the undo history; an unchanged document is left alone. The field commits when focus leaves it (UIC-FIELD-1.11), so Tab from the edited content reaches the restore button without committing, and focus in the editor's own chrome or popovers commits nothing; while the value differs from the committed value the field is dirty and its restore button puts the committed document back.

Implementation: `src/components/rich-text-editor/editor-surface.tsx`, `src/components/rich-text-editor/editor-state.ts`, `src/components/rich-text-editor/rich-text-editor.tsx`
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

`FormatToolbar` shall render a `ToolbarRow` (`role="toolbar"`, also `ui-format-toolbar`) named by `aria-label`, `aria-labelledby` or the provider string `textFormatting`, holding undo and redo, the block type select, the marks (bold, italic, underline, strike, code), the link button, and the bullet, numbered and task lists and the quote, then its `children`, with separators between the groups. Each command is a small `Button` with a tooltip and its shortcut, pressed (`aria-pressed`) while `isActive`, disabled while it cannot run, and left out when the schema lacks its types. A pointer press keeps focus, and the selection, in the document.

Implementation: `src/components/rich-text-editor/format-toolbar.tsx`, `src/components/rich-text-editor/format-controls.tsx`, `src/components/rich-text-editor/format-items.ts`, `src/components/layout/layout.tsx`, `src/core/rich-text-strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/rich-text-editor/format-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-6.2 - Block type

The toolbar shall hold a `SelectField` (`ui-format-toolbar__block-type`, label `blockType` without a visible label) of the text block types the schema supports (paragraph, headings 1 to 3, code block), showing the type of the selected blocks, or its placeholder when they differ. Choosing one turns the selected blocks into it and returns focus to the document.

Implementation: `src/components/rich-text-editor/format-controls.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/format-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-6.3 - Link editor

The link button (pressed on a link) shall open a `Popover` (`ui-format-toolbar__link-editor`, or `ui-selection-toolbar__link-editor` in the selection toolbar) with a `linkAddress` text field holding the current link's address, an Apply button (disabled for an empty or unsafe address) that submits on Enter, and a `removeLink` button while the selection has a link. Applying or removing runs `set-link`, closes the popover and returns focus to the document.

Implementation: `src/components/rich-text-editor/format-controls.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/format-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-7 - Selection Toolbar

### UIC-RICH-TEXT-EDITOR-7.1 - Floating over selected text

`SelectionToolbar` shall show a non-modal popover (`ui-selection-toolbar`) above a selected text range while the document or the toolbar has focus and the editor is editable, following the selection as it changes; a caret or a selected node shows none. It holds a `ToolbarRow` (`ui-selection-toolbar__row`, named by `aria-label`, `aria-labelledby` or `selectionFormatting`) of the mark buttons and the link button, then its `children`.

Implementation: `src/components/rich-text-editor/selection-toolbar.tsx`
Verification: `src/components/rich-text-editor/selection-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-7.2 - Keyboard

Alt+F10 in the document shall move focus to the toolbar's first enabled button, and Escape in the toolbar returns focus to the document and hides the toolbar until the selection changes.

Implementation: `src/components/rich-text-editor/selection-toolbar.tsx`
Verification: `src/components/rich-text-editor/selection-toolbar.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-8 - Insert Menu

### UIC-RICH-TEXT-EDITOR-8.1 - Slash menu

`InsertMenu` shall open a `CompletionList` (also `ui-insert-menu`, named by `aria-label`, `aria-labelledby` or `insertCommands`) against a caret marker (`ui-insert-menu__caret`) placed at the slash, while the focused, editable document has a `/` at the start of a text block or after white space followed by a query up to the caret (no space, not in code). It lists the built-in entries the schema supports (paragraph, headings 1 to 3, code block, bullet, numbered and task lists, quote, divider) then the caller's `items` (`InsertMenuItem`: `id`, `label`, `description`, `icon`, `keywords`, `command`), matched by label or keyword as completions match (best first); with no match it closes.

Each entry shall use its best label or keyword score, stopping its keyword scan once a prefix match is found without building a keyword score array or depending on an argument limit. All matching entries are ordered by score, preserving input order for ties.

Implementation: `src/components/rich-text-editor/insert-menu.tsx`, `src/components/rich-text-editor/use-slash-menu.ts`, `src/components/rich-text-editor/insert-items.ts`, `src/components/completion-list/completion-list.tsx`
Verification: `src/components/rich-text-editor/insert-items.test.ts`, `src/components/rich-text-editor/insert-menu.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-8.2 - Keys and insertion

While the menu is open, ArrowDown and ArrowUp shall move the active entry (wrapping), Enter or Tab replace the slash and query with the active entry's command, and Escape closes the menu until the current slash query ends; removing and retyping a slash at the same source position can open a new menu. Pressing an entry inserts it. A menu callback that remains pending after the editor locks cannot change the document. Focus stays in the document, which autocompletes from a list (`aria-autocomplete="list"`, `aria-haspopup="listbox"`) and, while open, names the list in `aria-controls` and the active entry in `aria-activedescendant`.

Implementation: `src/components/rich-text-editor/use-slash-menu.ts`, `src/components/rich-text-editor/insert-menu.tsx`
Verification: `src/components/rich-text-editor/insert-menu.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-8.3 - Insert button

`InsertMenuButton` shall render an icon-only `DropdownMenu` (also `ui-insert-menu-button`, label `insert`, glyph `plus`) listing the same entries; choosing one runs its command at the selection and returns focus to the document. It is disabled while the editor is not editable.

Implementation: `src/components/rich-text-editor/insert-menu.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/insert-menu.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-9 - Block Handle

### UIC-RICH-TEXT-EDITOR-9.1 - Placement

`BlockHandle` shall render `ui-block-handle`, absolutely placed in the surface at the top of the top-level block under the pointer, or else of the first block the selection touches while the document or the handle has focus or its menu is open; it renders nothing otherwise or while the editor is not editable. It follows the block as the document changes.

Implementation: `src/components/rich-text-editor/block-handle.tsx`, `src/components/rich-text-editor/use-block-target.ts`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-9.2 - Drag

The handle's grip (`ui-block-handle__grip`, the `drag-handle` glyph, hidden from assistive technology) shall drag its block: dropping it in the document moves the block there. The handle carries `data-dragging` during the drag. The menu and Alt+Shift+Up and Down are the keyboard alternative.

Implementation: `src/components/rich-text-editor/block-handle.tsx`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

### UIC-RICH-TEXT-EDITOR-9.3 - Block menu

The handle's menu button (`ui-block-handle__menu`, an icon-only `DropdownMenu` named `blockActions`) shall select the block when it opens (a selection over several blocks including it stays, so the menu acts on all of them) and offer a `turnInto` submenu of the block types and wrappers the schema supports, then `moveUp`, `moveDown`, `duplicate` and `delete` (disabled when they cannot run). Choosing an entry runs it on the block and returns focus to the document.

Implementation: `src/components/rich-text-editor/block-handle.tsx`, `src/components/rich-text-editor/use-focus-return.ts`
Verification: `src/components/rich-text-editor/block-handle.test.tsx`, `e2e/rich-text-editor.spec.ts`

## UIC-RICH-TEXT-EDITOR-10 - Export

### UIC-RICH-TEXT-EDITOR-10.1 - HTML

`serializeRichTextHtml(document, { schema })` shall return the document as HTML, rendered as each node and mark type renders itself, with runs of shared marks kept in one element, text and attribute values escaped, and no browser document needed.

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

## Hooks

| Hook                                 | Kind      | Values                                     | Description                                                                     |
| ------------------------------------ | --------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `ui-rich-text-editor`                | root      |                                            | The field's root, alongside `ui-field`.                                         |
| `ui-rich-text-editor__frame`         | slot      |                                            | The box around the toolbar row and the surface.                                 |
| `ui-rich-text-editor__toolbar`       | slot      |                                            | The row holding `toolbar`.                                                      |
| `ui-rich-text-editor__surface`       | slot      |                                            | The positioned area holding the content and the floating chrome.                |
| `ui-rich-text-editor__content`       | slot      |                                            | The editable document (role `textbox`), also ProseMirror's `ProseMirror` class. |
| `ui-rich-text-editor__placeholder`   | slot      |                                            | The empty document's only block, which shows the placeholder.                   |
| `ui-rich-text-editor__task-item`     | slot      |                                            | A task list item.                                                               |
| `ui-rich-text-editor__task-checkbox` | slot      |                                            | The task item's checkbox holder, alongside a `ui-checkbox`.                     |
| `ui-rich-text-editor__task-content`  | slot      |                                            | The task item's content.                                                        |
| `ui-format-toolbar`                  | root      |                                            | `FormatToolbar`'s row, alongside `ui-toolbar-row`.                              |
| `ui-format-toolbar__block-type`      | slot      |                                            | The block type select, alongside `ui-select-field`.                             |
| `ui-format-toolbar__link-editor`     | slot      |                                            | The link editor popover, alongside `ui-popover`.                                |
| `ui-selection-toolbar`               | root      |                                            | `SelectionToolbar`'s non-modal popover.                                         |
| `ui-selection-toolbar__row`          | slot      |                                            | Its toolbar row, alongside `ui-toolbar-row`.                                    |
| `ui-selection-toolbar__link-editor`  | slot      |                                            | Its link editor popover, alongside `ui-popover`.                                |
| `ui-insert-menu`                     | root      |                                            | The slash menu's popover, alongside `ui-completion-list`.                       |
| `ui-insert-menu__caret`              | slot      |                                            | The zero-width marker at the slash the menu opens against.                      |
| `ui-insert-menu-button`              | root      |                                            | `InsertMenuButton`'s trigger, alongside `ui-dropdown-menu`.                     |
| `ui-block-handle`                    | root      |                                            | The handle, placed beside its block.                                            |
| `ui-block-handle__grip`              | slot      |                                            | The grip that drags the block.                                                  |
| `ui-block-handle__menu`              | slot      |                                            | The block menu's trigger, alongside `ui-dropdown-menu`.                         |
| `data-readonly`                      | state     | `true`                                     | On the content: the editor refuses edits but stays focusable.                   |
| `data-disabled`                      | state     | `true`                                     | On the content: the editor is disabled.                                         |
| `data-placeholder`                   | attribute |                                            | On the placeholder block: the placeholder text.                                 |
| `data-checked`                       | state     | `true`                                     | On a task item: the task is done.                                               |
| `data-dragging`                      | state     | `true`                                     | On the block handle: its block is being dragged.                                |
| `data-placement`                     | state     | `top`, `bottom`, `left`, `right`, `center` | On the selection toolbar: the side of the selection it opened on (React Aria).  |
| `data-entering`                      | state     | `true`                                     | On the selection toolbar: it is opening (React Aria).                           |
| `data-exiting`                       | state     | `true`                                     | On the selection toolbar: it is closing (React Aria).                           |
