# JSON Editor

`JsonEditor` is a field for JSON text, built on the [field base](FIELD.md) around a [Code Editor](CODE-EDITOR.md). It highlights JSON, numbers its lines, reports text that does not parse as the field's error with where the problem starts, and offers a Format button that rewrites valid text with standard indentation. Like every field control it has a label, a description, help, a decoration, a menu, validation, dirty state with restore, and undo and redo.

## UIC-JSON-EDITOR-1 - Editor

### UIC-JSON-EDITOR-1.1 - Field around a code editor

`JsonEditor` shall render a `Field` (root `ui-field`, also `ui-json-editor`) whose control is a `CodeEditor` text area named by the field's label, with line numbers unless `lineNumbers` is `false`, long lines scrolling sideways (`wrap="off"`), the starting height of `size` (`md` by default) and the caller's `placeholder`. It takes the field props (`FieldInputProps<string>`), and the caller's `className`, `id` and `data-*` attributes go on the field's root.

Implementation: `src/components/json-editor/json-editor.tsx`
Verification: `src/components/json-editor/json-editor.test.tsx`, `e2e/json-editor.spec.ts`

### UIC-JSON-EDITOR-1.2 - Highlighting

The editor shall highlight JSON with code editor tokens covering the text exactly: object keys (`key`), other strings (`string`), numbers (`number`), `true`, `false` and `null` (`literal`), braces, brackets, colons and commas (`punctuation`), and any other character outside whitespace (`invalid`).

Implementation: `src/components/json-editor/json-text.ts`
Verification: `src/components/json-editor/json-text.test.ts`, `e2e/json-editor.spec.ts`

## UIC-JSON-EDITOR-2 - Validation

### UIC-JSON-EDITOR-2.1 - Parse errors

Text that does not parse as JSON shall make the field invalid with the provider string `invalidJsonAt` naming the line and column where parsing stopped, or `invalidJson` when the parser does not say. This check runs before the caller's `validate`. Blank text parses as no value: it is valid unless the field is required.

Implementation: `src/components/json-editor/json-editor.tsx`, `src/components/json-editor/json-text.ts`, `src/core/strings.ts`
Verification: `src/components/json-editor/json-editor.test.tsx`, `src/components/json-editor/json-text.test.ts`, `e2e/json-editor.spec.ts`

### UIC-JSON-EDITOR-2.2 - Error location

The line and column, counted from 1, shall be those of the first token that breaks JSON's grammar (a missing value, a trailing comma, an unclosed bracket at the end of the text). When the tokens follow the grammar but the parser still refuses the text (an invalid escape, for example), they are read from the parser's message, which gives either `line L column C` or a character `position`.

Implementation: `src/components/json-editor/json-text.ts`
Verification: `src/components/json-editor/json-text.test.ts`

## UIC-JSON-EDITOR-3 - Formatting

### UIC-JSON-EDITOR-3.1 - Format button

An editable editor shall show a Format button (`ui-json-editor__format`, provider string `format`) in the code editor's toolbar. Pressing it rewrites the text as parsed JSON with `indent` spaces per level (2 by default) and commits it. The button is disabled while the text is blank, does not parse or is already formatted; a read-only or disabled editor shows none.

Implementation: `src/components/json-editor/json-editor.tsx`, `src/components/json-editor/json-text.ts`, `src/core/strings.ts`
Verification: `src/components/json-editor/json-editor.test.tsx`, `src/components/json-editor/json-text.test.ts`, `e2e/json-editor.spec.ts`

## UIC-JSON-EDITOR-4 - Field behaviour

### UIC-JSON-EDITOR-4.1 - Commit, dirty state and restore

The editor shall commit its text when the text area loses focus. While the text differs from the committed text the field is dirty and offers its restore button, which puts the committed text back.

Implementation: `src/components/json-editor/json-editor.tsx`
Verification: `src/components/json-editor/json-editor.test.tsx`, `e2e/json-editor.spec.ts`

### UIC-JSON-EDITOR-4.2 - Undo, redo and menu

Ctrl+Z or Cmd+Z in the editor shall undo the field and Ctrl+Shift+Z, Cmd+Shift+Z or Ctrl+Y redo it, and the field menu shall offer the caller's entries; Clear sets empty text and Set to default the default text.

Implementation: `src/components/json-editor/json-editor.tsx`
Verification: `src/components/json-editor/json-editor.test.tsx`

### UIC-JSON-EDITOR-4.3 - Locked editor

A read-only editor shall keep its text and line numbers visible and refuse edits; a disabled editor disables its text area. Neither is ever dirty.

Implementation: `src/components/json-editor/json-editor.tsx`
Verification: `src/components/json-editor/json-editor.test.tsx`

## Hooks

| Hook                     | Kind | Values | Description                                                |
| ------------------------ | ---- | ------ | ---------------------------------------------------------- |
| `ui-json-editor`         | root |        | The field's root (also `ui-field`).                        |
| `ui-json-editor__format` | slot |        | The Format button (also `ui-button`), in the code toolbar. |
