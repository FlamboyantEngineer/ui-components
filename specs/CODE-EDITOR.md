# Code Editor

`CodeEditor` is a lightweight surface for editing source code: a native text area laid over a highlighted copy of the source, so the browser keeps the caret, selection, undo, input methods and screen-reader text while the colours come from the layer behind it. Everything about the language comes from the caller: `tokenize` splits the source into typed tokens, `diagnostics` reports problems, and `completions` is the vocabulary offered for the word before the caret. It can number lines and show a toolbar row. The caller owns the text (`value`, `onChange`). [JSON Editor](JSON-EDITOR.md) builds on it.

## UIC-CODE-EDITOR-1 - Surface

### UIC-CODE-EDITOR-1.1 - Text area over a highlighted copy

`CodeEditor` shall render its `value` in a React Aria `TextArea` (`ui-code-editor__input`), the control, with spelling, autocorrection, autocapitalization and autocomplete off unless the caller sets them, and report each edit through `onChange`. Behind it, a `<pre>` (`ui-code-editor__highlight`) hidden from assistive technology draws the same text, so a stylesheet can make the text area's text transparent and let the copy paint it. The text area takes the caller's text area props (`aria-label`, `aria-labelledby`, `placeholder`, `readOnly`, handlers).

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.2 - Tokens

`tokenize` shall split the source into tokens that cover it exactly, in order. Each token with a `type` renders in a `ui-code-editor__token` span carrying `data-token` with that type (`keyword`, `string`, …); tokens without one render as plain text. Without `tokenize` the source is one plain run. The copy ends with a line break, so its last line is as tall as the text area's.

Implementation: `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.3 - Aligned layers

The highlighted copy and the gutter shall follow the text area's scroll offset in the scroll event itself, and again after the value, the wrapping, the line numbers or the measured width change, so the caret never drifts from the text the reader sees.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.4 - Size and wrapping

`size` (`sm`, `md` by default, `lg`) shall publish `data-size`, from which the stylesheet sets the starting height. `wrap` (`soft` by default, or `off`) shall publish `data-wrap` and set the text area's `wrap`: `soft` wraps long lines and `off` scrolls them sideways.

Implementation: `src/components/code-editor/code-editor.tsx`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.5 - Toolbar

`toolbar` shall render in `ui-code-editor__toolbar`, a row above the source, for the caller's label, counts and tools.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

### UIC-CODE-EDITOR-1.6 - Read-only and disabled

A `readOnly` or `disabled` editor shall pass the lock to its text area, publish `data-readonly` or `data-disabled` on its root and offer no completions.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-completion.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

## UIC-CODE-EDITOR-2 - Line numbers

### UIC-CODE-EDITOR-2.1 - Gutter

`lineNumbers` shall draw a gutter (`ui-code-editor__gutter`, hidden from assistive technology) with one row (`ui-code-editor__line`) per source line, split on line feeds, holding its number (`ui-code-editor__line-number`) and a hidden copy of the line (`ui-code-editor__line-text`, a zero-width space for an empty line), and publish `data-numbered` on the root.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-2.2 - Wrapped lines

The gutter shall publish the text area's measured client width as `--ui-code-editor-text-width`, so the stylesheet lets each hidden line copy wrap where the text area wraps: a wrapped line keeps one number and the rows stay level with the lines they number.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-3 - Diagnostics

### UIC-CODE-EDITOR-3.1 - Diagnostics list

`diagnostics` shall render below the source as a polite live list (`ui-code-editor__diagnostics`) of `ui-code-editor__diagnostic` items reading `line:column message` (or `line message`, or the message alone), each with `data-severity` (`error` by default, or `warning`). While the list has items its id is the last reference of the text area's `aria-describedby`, after the caller's.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.2 - Invalid

An editor with an `error` diagnostic, or whose caller sets `aria-invalid`, shall publish `data-invalid` on its root and give its text area `aria-invalid="true"`. Warnings alone leave it valid.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.3 - Marked lines

A gutter row whose line a diagnostic points at shall carry `data-severity` with the worst severity reported there.

Implementation: `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

## UIC-CODE-EDITOR-4 - Completions

### UIC-CODE-EDITOR-4.1 - Matching

The word before the caret (a letter, `_` or `$` followed by letters, digits, `_`, `$` and `.`) shall be completed with the `completions` whose label starts with it, ignoring case, except one equal to it. An empty word is completed with nothing.

Implementation: `src/components/code-editor/code-completion.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

### UIC-CODE-EDITOR-4.2 - Opening

With `completions`, the text area shall autocomplete from a list (`aria-autocomplete="list"`, `aria-haspopup="listbox"`), and typing or moving the caret by key or pointer in an editable editor shall open the list of matches (`ui-code-editor__completions`, a listbox named by the provider string `suggestions`) with its first option active. Each option (`ui-code-editor__completion`) shows its label (`ui-code-editor__completion-label`) and description (`ui-code-editor__completion-description`). While open, `aria-controls` names the list and `aria-activedescendant` the active option, which carries `aria-selected="true"` and `data-focused`. The text area keeps its text box role, which takes no other role, and keeps focus.

Implementation: `src/components/code-editor/code-completion.tsx`, `src/components/code-editor/code-editor.tsx`, `src/core/strings.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.3 - Choosing

While the list is open, ArrowDown and ArrowUp shall move the active option, wrapping at either end, Enter or Tab insert it and Escape close the list until the next edit; those keys go no further than the editor. Moving the pointer over an option activates it and pressing it inserts it without taking focus from the text area. Losing focus closes the list.

Implementation: `src/components/code-editor/code-completion.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.4 - Inserting

Inserting an option shall replace the word before the caret with its label through `onChange`, place the caret after the label and close the list.

Implementation: `src/components/code-editor/code-completion.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.5 - Position

The list shall open in a non-modal React Aria popover (`ui-code-editor__popover`) on the `dropdown` overlay layer, at a caret marker (`ui-code-editor__caret`) placed in the highlighted copy while the list is open: below the caret line, or above it when there is more room there, kept inside the viewport. It follows the caret as the reader types and as the text area scrolls.

Implementation: `src/components/code-editor/code-completion.tsx`, `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-5 - Attributes

### UIC-CODE-EDITOR-5.1 - Hooks and caller attributes

`CodeEditor` shall carry the hooks below, put the caller's `className` and `data-*` attributes on its root, and its `id` and `ref` on the text area, so a label can point at it and a field can focus it.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

## Hooks

| Hook                                     | Kind      | Values             | Description                                                            |
| ---------------------------------------- | --------- | ------------------ | ---------------------------------------------------------------------- |
| `ui-code-editor`                         | root      |                    | The editor's frame.                                                    |
| `ui-code-editor__toolbar`                | slot      |                    | The toolbar row above the source.                                      |
| `ui-code-editor__surface`                | slot      |                    | Holds the gutter and the code area.                                    |
| `ui-code-editor__gutter`                 | slot      |                    | The line numbers.                                                      |
| `ui-code-editor__line`                   | slot      |                    | A gutter row.                                                          |
| `ui-code-editor__line-number`            | slot      |                    | A line's number.                                                       |
| `ui-code-editor__line-text`              | slot      |                    | A hidden copy of the line that gives the row its wrapped height.       |
| `ui-code-editor__code`                   | slot      |                    | Stacks the highlighted copy and the text area.                         |
| `ui-code-editor__highlight`              | slot      |                    | The highlighted copy of the source.                                    |
| `ui-code-editor__token`                  | slot      |                    | A typed token in the copy.                                             |
| `ui-code-editor__caret`                  | slot      |                    | The empty marker at the caret while the completion list is open.       |
| `ui-code-editor__input`                  | slot      |                    | The text area.                                                         |
| `ui-code-editor__diagnostics`            | slot      |                    | The diagnostics list.                                                  |
| `ui-code-editor__diagnostic`             | slot      |                    | One diagnostic.                                                        |
| `ui-code-editor__popover`                | slot      |                    | The completion popover.                                                |
| `ui-code-editor__completions`            | slot      |                    | The completion listbox.                                                |
| `ui-code-editor__completion`             | slot      |                    | A completion option.                                                   |
| `ui-code-editor__completion-label`       | slot      |                    | An option's label.                                                     |
| `ui-code-editor__completion-description` | slot      |                    | An option's description.                                               |
| `data-size`                              | attribute | `sm`, `md`, `lg`   | Starting height.                                                       |
| `data-wrap`                              | attribute | `soft`, `off`      | Whether long lines wrap.                                               |
| `data-token`                             | attribute |                    | On a token: its type, from the caller's tokenizer.                     |
| `data-numbered`                          | state     | `true`             | The gutter shows.                                                      |
| `data-invalid`                           | state     | `true`             | An error is reported (root), or the text area is invalid (React Aria). |
| `data-readonly`                          | state     | `true`             | Read-only.                                                             |
| `data-disabled`                          | state     | `true`             | Disabled (root, and the text area through React Aria).                 |
| `data-severity`                          | state     | `error`, `warning` | On a diagnostic or a gutter row: the severity.                         |
| `data-focused`                           | state     | `true`             | The text area has focus (React Aria), or the active completion option. |
| `data-focus-visible`                     | state     | `true`             | Keyboard focus on the text area (React Aria).                          |
| `data-hovered`                           | state     | `true`             | Pointer over the text area (React Aria).                               |
| `data-placement`                         | state     |                    | Where the popover sits against the caret (React Aria).                 |
| `data-entering`                          | state     | `true`             | The popover is opening (React Aria).                                   |
| `data-exiting`                           | state     | `true`             | The popover is closing (React Aria).                                   |
| `--ui-code-editor-text-width`            | property  |                    | On the gutter: the text area's client width, in pixels.                |
