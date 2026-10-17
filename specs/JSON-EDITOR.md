# JSON Editor

`JsonEditor` is a field for JSON text, built on the [field base](FIELD.md) around a [Code Editor](CODE-EDITOR.md). It highlights JSON, numbers its lines, reports text that does not parse as the field's error with where the problem starts and marks that place in the editor, can check the text against a subset of JSON Schema and complete keys and values from it, and offers a Format button that rewrites valid text with standard indentation. Like every field control it has a label, a description, help, a decoration, a menu, validation, dirty state with restore, and undo and redo. It does not fold objects and arrays: the text area under it shows all of the text.

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

### UIC-JSON-EDITOR-2.3 - Error mark

The place where the text stops parsing shall be a code editor diagnostic with the field's message: its token is underlined (UIC-CODE-EDITOR-3.4), its gutter row carries `data-severity="error"`, and the hover tip and F8 read the message. The code editor does not list it again below the source (`listDiagnostics` off), since the field shows it.

Implementation: `src/components/json-editor/json-check.ts`, `src/components/json-editor/json-editor.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/json-editor/json-editor.test.tsx`, `e2e/json-editor.spec.ts`

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

## UIC-JSON-EDITOR-5 - Schema

### UIC-JSON-EDITOR-5.1 - Schema subset

With `schema`, text that parses shall be checked against this subset of JSON Schema, other keywords being ignored: `type` (one or a list of `object`, `array`, `string`, `number`, `integer`, `boolean`, `null`), `enum`, `const`, `properties`, `required`, `additionalProperties` (`false`, or a schema for the other properties), `items` (one schema for every item), `minimum`, `maximum`, `minLength`, `maxLength` (in characters), `pattern` (a pattern that is not a valid expression is ignored), `minItems` and `maxItems`. A value of the wrong type or outside its `enum` or `const` is not checked further. Each problem is an error diagnostic marking the value (a missing property marks the object's `{`, a property `additionalProperties: false` refuses marks its key), with the provider strings `jsonTypeMismatch`, `jsonValueMismatch`, `jsonMissingProperty`, `jsonUnknownProperty`, `jsonTooFewItems`, `jsonTooManyItems`, `rangeUnderflow`, `rangeOverflow`, `tooShort`, `tooLong` and `patternMismatch`. The field reports the first problem in the text with `jsonProblemAt` and its line and column, before the caller's `validate` runs.

Implementation: `src/components/json-editor/json-schema.ts`, `src/components/json-editor/json-tree.ts`, `src/components/json-editor/json-check.ts`, `src/components/json-editor/json-editor.tsx`, `src/core/strings.ts`
Verification: `src/components/json-editor/json-schema.test.ts`, `src/components/json-editor/json-tree.test.ts`, `src/components/json-editor/json-editor.test.tsx`, `e2e/json-editor.spec.ts`

### UIC-JSON-EDITOR-5.2 - Key completion

At a key of an object the schema describes (found through `properties`, `additionalProperties` and `items`, in text that may not parse yet), the editor shall complete with the properties the object does not have yet: the quoted name as label, kind `property`, the allowed types as description and the property's `description` as documentation. Inserting one replaces the key typed so far and adds `: ` and a starting value as a snippet field (UIC-CODE-EDITOR-4.8): the first `enum` value or the `default`, else `""`, `0`, `false`, `null`, `{}` or `[]` by type; a key already followed by a colon is replaced alone.

Implementation: `src/components/json-editor/json-complete.ts`, `src/components/json-editor/json-tree.ts`, `src/components/json-editor/json-schema.ts`
Verification: `src/components/json-editor/json-complete.test.ts`, `src/components/json-editor/json-tree.test.ts`, `src/components/json-editor/json-editor.test.tsx`, `e2e/json-editor.spec.ts`

### UIC-JSON-EDITOR-5.3 - Value completion

At a value, the editor shall complete with the values its schema lists (`enum`, or `const`), or else `true` and `false` for a boolean, `null` for a null and the `default`, as JSON, with kind `value` and the schema's `description` as documentation. Inserting one replaces the value typed so far.

Implementation: `src/components/json-editor/json-complete.ts`
Verification: `src/components/json-editor/json-complete.test.ts`, `src/components/json-editor/json-editor.test.tsx`

### UIC-JSON-EDITOR-5.4 - When completions open

Schema completions shall be offered while a key or value is being typed, after a colon and on Ctrl+Space, and never after a complete root value.

Implementation: `src/components/json-editor/json-complete.ts`
Verification: `src/components/json-editor/json-complete.test.ts`

### UIC-JSON-EDITOR-5.5 - Hover documentation

Resting the pointer on a key or a value shall show the `description` of its schema in the code editor's hover tip (UIC-CODE-EDITOR-3.6), after any problem marked there.

Implementation: `src/components/json-editor/json-complete.ts`, `src/components/json-editor/json-editor.tsx`
Verification: `src/components/json-editor/json-complete.test.ts`, `e2e/json-editor.spec.ts`

## UIC-JSON-EDITOR-6 - Editing

### UIC-JSON-EDITOR-6.1 - Brackets and indentation

The editor shall mark the bracket at the caret and its partner (UIC-CODE-EDITOR-6.5), pair brackets and quotes with `autoCloseBrackets` (UIC-CODE-EDITOR-6.4) and keep the indentation on Enter with `indent` spaces per level (UIC-CODE-EDITOR-6.2).

Implementation: `src/components/json-editor/json-editor.tsx`
Verification: `src/components/json-editor/json-editor.test.tsx`, `e2e/json-editor.spec.ts`

## Hooks

| Hook                     | Kind | Values | Description                                                |
| ------------------------ | ---- | ------ | ---------------------------------------------------------- |
| `ui-json-editor`         | root |        | The field's root (also `ui-field`).                        |
| `ui-json-editor__format` | slot |        | The Format button (also `ui-button`), in the code toolbar. |
