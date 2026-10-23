# Code Editor

`CodeEditor` is a lightweight surface for editing source code: a native text area laid over a highlighted copy of the source, so the browser keeps the caret, selection, undo, input methods and screen-reader text while the colours come from the layer behind it. Everything about the language comes from the caller: `tokenize` splits the source into typed tokens, `diagnostics` reports problems (listed, underlined, marked in the gutter and shown in hover tips), `completions` is a vocabulary or a source of completions, and `renderHover` adds hover information. The editor keeps indentation on Enter, can indent with Tab, pair brackets and quotes, matches the bracket at the caret, and can find and replace in a [Find Bar](FIND-BAR.md). It can number lines, from 1 or from the first line of an excerpt, and show a toolbar row. The caller owns the text (`value`, `onChange`). [JSON Editor](JSON-EDITOR.md) builds on it.

The editor stays a text area: it does not fold code and it re-tokenizes and redraws the whole source on each change, so it suits documents of a few thousand lines.

## UIC-CODE-EDITOR-1 - Surface

### UIC-CODE-EDITOR-1.1 - Text area over a highlighted copy

`CodeEditor` shall render its `value` in a `<textarea>` (`ui-code-editor__input`), the control, with spelling, autocorrection, autocapitalization and autocomplete off, and report each edit through `onChange`. Behind it, a `<pre>` (`ui-code-editor__highlight`) hidden from assistive technology draws the same text, so a stylesheet can make the text area's text transparent and let the copy paint it. The text area takes the caller's `placeholder`, labelling props (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`), `aria-errormessage`, `isRequired` (as `aria-required`) and its focus and keyboard handlers (`onFocus`, `onBlur`, `onKeyDown`, `onKeyUp`), which run after the editor's own.

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

An `isReadOnly` or `isDisabled` editor shall make its text area natively read-only or disabled, publish `data-readonly` or `data-disabled` on its root and offer no completions.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/completion-list/use-completions.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`

### UIC-CODE-EDITOR-1.7 - Single line

`multiline={false}` shall keep the source on one line, for a query or an expression: the text area has one row, reports `aria-multiline="false"` and never wraps (`data-wrap="off"` whatever `wrap` says), the root publishes `data-single-line`, Enter inserts no line break and reaches the caller's `onKeyDown` (after an open completion list has taken it), and line breaks typed or pasted into the text reach `onChange` as spaces. Multiple lines are the default.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-area.tsx`, `src/components/code-editor/use-code-keys.ts`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/query-field.spec.ts`

## UIC-CODE-EDITOR-2 - Line numbers

### UIC-CODE-EDITOR-2.1 - Gutter

`lineNumbers` shall draw a gutter (`ui-code-editor__gutter`, hidden from assistive technology) with one row (`ui-code-editor__line`) per source line, split on line feeds, holding its number (`ui-code-editor__line-number`) and a hidden copy of the line (`ui-code-editor__line-text`, a zero-width space for an empty line), and publish `data-numbered` on the root.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-2.2 - Wrapped lines

The gutter shall publish the text area's measured client width as `--ui-code-editor-text-width`, so the stylesheet lets each hidden line copy wrap where the text area wraps: a wrapped line keeps one number and the rows stay level with the lines they number.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-2.3 - First line number

`firstLineNumber` (1 by default) shall be the number of the gutter's first row, for an excerpt of a longer text; the rows count up from it. Diagnostics count lines the same way: their `line` and `endLine` name lines as the gutter numbers them, so the gutter rows (UIC-CODE-EDITOR-3.3), the marked ranges (UIC-CODE-EDITOR-3.4), the hover tips and F8 follow the line a diagnostic names, the list reads it as given, and a diagnostic naming a line outside the excerpt marks nothing.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-ranges.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/code-ranges.test.ts`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-3 - Diagnostics

### UIC-CODE-EDITOR-3.1 - Diagnostics list

`diagnostics` shall render below the source as a polite live list (`ui-code-editor__diagnostics`) of `ui-code-editor__diagnostic` items reading `line:column message` (or `line message`, or the message alone), each with `data-severity` (`error` by default, or `warning`). While the list has items its id is the last reference of the text area's `aria-describedby`, after the caller's. With `listDiagnostics` set to `false` there is no list, and the marks, the gutter, the hover tips and F8 remain.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.2 - Invalid

An editor with an `error` diagnostic, or whose caller sets `isInvalid`, shall publish `data-invalid` on its root and give its text area `aria-invalid="true"`. Warnings alone leave it valid.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.3 - Marked lines

A gutter row whose line a diagnostic points at shall carry `data-severity` with the worst severity reported there.

Implementation: `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

### UIC-CODE-EDITOR-3.4 - Marked ranges

The highlighted copy shall draw the source each diagnostic points at inside `ui-code-editor__mark` with `data-severity` (the worst one where marks overlap): from its `column` up to `endLine` and `endColumn` (counted from 1, the end excluded, `endLine` defaulting to `line`), or else the word at its column (at least one character, the one before the line end when the column is past it); a diagnostic with a line and no column marks the line's text without its indentation.

Implementation: `src/components/code-editor/code-ranges.ts`, `src/components/code-editor/code-segments.ts`, `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/code-ranges.test.ts`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.5 - Next and previous problem

F8 in the text area shall select the next marked range after the caret and Shift+F8 the previous one, wrapping at either end, scroll it into view, show its hover tip and read its message out in a polite status (`ui-code-editor__announcement`, visually hidden), which renders while the editor has `diagnostics`. Without a marked range the keys do nothing.

Implementation: `src/components/code-editor/use-code-editor.ts`, `src/components/code-editor/use-code-keys.ts`, `src/components/code-editor/code-geometry.ts`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.6 - Hover tip

When the pointer rests on a marked range, or on an offset for which `renderHover` returns content, a non-modal React Aria popover (`ui-code-editor__tooltip`) on the `tooltip` overlay layer shall point at that character with, inside a `role="tooltip"` element, the message of each problem marked there (a `ui-code-editor__diagnostic` with `data-severity`) followed by the caller's content. The tip stays while the pointer moves into it, hides shortly after the pointer leaves both, and closes on Escape, on an edit and when the text area loses focus.

Implementation: `src/components/code-editor/code-hover.tsx`, `src/components/code-editor/code-geometry.ts`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-4 - Completions

### UIC-CODE-EDITOR-4.1 - Matching

The word before the caret (a letter, `_` or `$` followed by letters, digits, `_`, `$` and `.`) shall be completed with the `completions` that match it, ignoring case: first the labels that start with it, then the labels holding its characters in order from the start of a word (after a space, `.`, `_`, `-`, `/` or `:`, or at a lowercase-to-uppercase change), each group in the given order. A label equal to the word is left out. An empty word is completed with nothing unless the reader asks (UIC-CODE-EDITOR-4.2).

Implementation: `src/components/code-editor/completion-match.ts`, `src/components/code-editor/use-code-completion.ts`, `src/components/completion-list/completion-match.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/completion-match.test.ts`

### UIC-CODE-EDITOR-4.2 - Opening

With `completions`, the text area shall autocomplete from a list (`aria-autocomplete="list"`, `aria-haspopup="listbox"`), and typing or moving the caret by key or pointer in an editable editor shall open the list of matches, and Ctrl+Space open it whatever the word before the caret, an empty word matching every completion. The list is a [Completion List](COMPLETION-LIST.md) (a listbox named by the provider string `suggestions`, with its own hooks) with its first option active, each option showing its label and description. While open, `aria-controls` names the list and `aria-activedescendant` the active option, which carries `aria-selected="true"` and `data-focused`. The text area keeps its text box role, which takes no other role, and keeps focus. The editor runs the shared completions engine ([UIC-COMPLETION-LIST-2](COMPLETION-LIST.md#uic-completion-list-2---completions-engine)).

Implementation: `src/components/code-editor/use-code-completion.ts`, `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-area.tsx`, `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/use-completions.ts`, `src/core/strings.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.3 - Choosing

While the list is open, ArrowDown and ArrowUp shall move the active option, wrapping at either end, Enter or Tab (not Shift+Tab) insert it and Escape close the list until the next edit; those keys go no further than the editor. Moving the pointer over an option activates it and pressing it inserts it without taking focus from the text area. Losing focus closes the list.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/use-completions.ts`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.4 - Inserting

Inserting an option shall replace the word before the caret (or the range its source names, UIC-CODE-EDITOR-4.6) with its label as an editor edit (UIC-CODE-EDITOR-6.1), place the caret after the inserted text and close the list.

Implementation: `src/components/code-editor/use-code-completion.ts`, `src/components/code-editor/use-code-edits.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.5 - Position

The list shall open in a non-modal React Aria popover (the Completion List's root, also `ui-code-editor__popover`) on the `dropdown` overlay layer, at a caret marker (`ui-code-editor__caret`) placed in the highlighted copy while the list is open: below the caret line, or above it when there is more room there, kept inside the viewport. It follows the caret as the reader types and as the text area scrolls.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.6 - Completion sources

`completions` may instead be a source: a function called on each edit, caret move and Ctrl+Space with the text, the caret, the word before the caret and whether the reader asked, which returns, at once or as a promise, the completions or `{ options, from, to }` naming the text they replace (from `from`, defaulting to the start of the word, to `to`, defaulting to the caret). The options are matched as in UIC-CODE-EDITOR-4.1 against the text from `from` to the caret; when that text is empty, all of them show after an edit or Ctrl+Space and none after a bare caret move. Only the latest lookup's answer shows, and closing the list discards a pending one.

Implementation: `src/components/code-editor/use-code-completion.ts`, `src/components/completion-list/use-completions.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.7 - Kinds and documentation

An option shall publish its completion's `kind` as `data-kind`. While an option with `documentation` is active, the popover shows that text in `ui-completion-list__documentation` after the list, and the option is described by it (`aria-describedby`). Pressing the documentation keeps focus in the text area.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/completion-match.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.8 - Snippets

A completion's `insertText` shall be inserted instead of its label. Only `insertText` interprets `${…}` as a field holding its default text; a label is literal text. A backslash before `$`, `}` or another backslash quotes that character, including inside a field. Other backslashes remain literal. The lines after the first take the indentation of the line the insertion goes into. After the insertion the first field is selected (or else the caret goes after the insertion), and while the caret stays in the current field Tab selects the next field, then the end of the insertion, and Shift+Tab the previous field; Tab with the caret elsewhere, or after the last field, ends the stepping.

Implementation: `src/components/code-editor/completion-match.ts`, `src/components/code-editor/use-code-completion.ts`, `src/components/code-editor/use-code-snippet.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/completion-match.test.ts`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-5 - Attributes

### UIC-CODE-EDITOR-5.1 - Hooks and caller attributes

`CodeEditor` shall carry the hooks below, put the caller's `className` and `data-*` attributes on its root, and its `id` and `ref` on the text area, so a label can point at it and a field can focus it.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

## UIC-CODE-EDITOR-6 - Editing

### UIC-CODE-EDITOR-6.1 - Editor edits

The editor's own edits (line breaks, indentation, pairs, completions and replacements) shall go through the browser's editing when the text area has focus, so undo reverts them one at a time and `onChange` reports them, and otherwise through `onChange`, restoring the edit's selection once the new value is rendered. A read-only or disabled editor makes none of them.

Implementation: `src/components/code-editor/use-code-edits.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-6.2 - Line breaks keep the indentation

Enter without Ctrl, Meta or Alt shall start the new line with the indentation of the current one, one level (`indent` spaces, 2 by default) more after an opening bracket, and when the caret sits right before the matching closing bracket, move that bracket to a line of its own at the current indentation.

Implementation: `src/components/code-editor/code-editing.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-editing.test.ts`, `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-6.3 - Tab indentation

With `indentWithTab`, Tab shall insert spaces up to the next indentation stop at a caret or over a selection within one line, and indent every non-empty line of a selection across lines by one level; Shift+Tab removes one level (a tab, or up to `indent` spaces) from each line the selection touches. Tab then stays in the editor, except right after Escape, when Tab and Shift+Tab move focus as usual.

Implementation: `src/components/code-editor/code-editing.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-editing.test.ts`, `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-6.4 - Bracket and quote pairs

With `autoCloseBrackets`, typing `(`, `[`, `{`, `"`, `'` or `` ` `` at a caret before the end of the text, a space, a closing bracket or `,`, `;`, `:` (a quote not right after a letter, digit, `_` or `$`) shall insert its partner too and leave the caret between them; typed over a selection, it wraps the selection. Typing the closer the editor inserted, right before it, steps over it, and Backspace between an empty pair deletes both characters.

Implementation: `src/components/code-editor/code-editing.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-editing.test.ts`, `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-6.5 - Matching brackets

While the text area has focus with a collapsed caret, the bracket right before the caret (or else right after it) and its partner shall render inside `ui-code-editor__bracket`; a bracket without a partner carries `data-unmatched`. Nested brackets must match by type in order; an intervening mismatched pair leaves the bracket unmatched. Brackets inside tokens typed `string`, `key` or `comment` are not counted.

Implementation: `src/components/code-editor/code-ranges.ts`, `src/components/code-editor/code-segments.ts`, `src/components/code-editor/use-code-editor.ts`
Verification: `src/components/code-editor/code-ranges.test.ts`, `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-7 - Find and replace

### UIC-CODE-EDITOR-7.1 - Find row

With `allowsSearch`, Ctrl+F or Cmd+F in the text area shall open a [Find Bar](FIND-BAR.md) (also `ui-code-editor__search`) between the toolbar and the source, and move focus to its find box (named by the provider string `find`) with its text selected, seeded with the text area's selection when that is one line. The bar's status reads the current match of the total (`stepOfTotal`) or `noResults`, its Previous match and Next match buttons are disabled without matches, and it ends with a Close button.

Implementation: `src/components/code-editor/code-search.tsx`, `src/components/code-editor/use-code-search.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-7.2 - Matches

The places the literal query occurs, using Unicode case-insensitive matching and without overlaps, shall render inside `ui-code-editor__match`, the current one with `data-current`. Ranges always refer to the original source, including after characters whose lowercase form changes length. Changing the query makes the first match at or after the caret current; the buttons, Enter and Shift+Enter in the find box move to the next and previous match, wrapping, and the text area scrolls the current match into view.

Implementation: `src/components/code-editor/use-code-search.ts`, `src/components/code-editor/code-ranges.ts`, `src/components/code-editor/code-segments.ts`, `src/components/code-editor/use-code-editor.ts`
Verification: `src/components/code-editor/code-ranges.test.ts`, `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-7.3 - Replacing

In an editable editor the bar shall also hold its replacement box (provider string `replaceWith`), a Replace button that replaces the current match and moves to the next one, and a Replace all button that replaces every match in one edit; Enter in the replacement box replaces. A read-only or disabled editor shows none of them.

Implementation: `src/components/code-editor/code-search.tsx`, `src/components/code-editor/use-code-search.ts`
Verification: `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-7.4 - Closing the row

Escape in the bar, or its Close button, shall close it and return focus to the text area with the current match selected.

Implementation: `src/components/code-editor/use-code-search.ts`, `src/components/code-editor/code-search.tsx`
Verification: `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

## Hooks

| Hook                           | Kind      | Values             | Description                                                              |
| ------------------------------ | --------- | ------------------ | ------------------------------------------------------------------------ |
| `ui-code-editor`               | root      |                    | The editor's frame.                                                      |
| `ui-code-editor__toolbar`      | slot      |                    | The toolbar row above the source.                                        |
| `ui-code-editor__surface`      | slot      |                    | Holds the gutter and the code area.                                      |
| `ui-code-editor__gutter`       | slot      |                    | The line numbers.                                                        |
| `ui-code-editor__line`         | slot      |                    | A gutter row.                                                            |
| `ui-code-editor__line-number`  | slot      |                    | A line's number.                                                         |
| `ui-code-editor__line-text`    | slot      |                    | A hidden copy of the line that gives the row its wrapped height.         |
| `ui-code-editor__code`         | slot      |                    | Stacks the highlighted copy and the text area.                           |
| `ui-code-editor__highlight`    | slot      |                    | The highlighted copy of the source.                                      |
| `ui-code-editor__token`        | slot      |                    | A typed token in the copy.                                               |
| `ui-code-editor__mark`         | slot      |                    | Source a diagnostic points at, in the copy.                              |
| `ui-code-editor__match`        | slot      |                    | A search match, in the copy.                                             |
| `ui-code-editor__bracket`      | slot      |                    | The bracket at the caret or its partner, in the copy.                    |
| `ui-code-editor__caret`        | slot      |                    | The empty marker at the caret while the completion list is open.         |
| `ui-code-editor__input`        | slot      |                    | The text area.                                                           |
| `ui-code-editor__diagnostics`  | slot      |                    | The diagnostics list.                                                    |
| `ui-code-editor__diagnostic`   | slot      |                    | One diagnostic, in the list or the hover tip.                            |
| `ui-code-editor__announcement` | slot      |                    | The visually hidden status that reads a problem out.                     |
| `ui-code-editor__tooltip`      | slot      |                    | The hover tip popover.                                                   |
| `ui-code-editor__popover`      | slot      |                    | The completion list (also `ui-completion-list`).                         |
| `ui-code-editor__search`       | slot      |                    | The find and replace row, a Find Bar beside its own `ui-find-bar` hooks. |
| `data-size`                    | attribute | `sm`, `md`, `lg`   | Starting height.                                                         |
| `data-wrap`                    | attribute | `soft`, `off`      | Whether long lines wrap.                                                 |
| `data-token`                   | attribute |                    | On a token: its type, from the caller's tokenizer.                       |
| `data-numbered`                | state     | `true`             | The gutter shows.                                                        |
| `data-single-line`             | state     | `true`             | The source stays on one line (`multiline={false}`).                      |
| `data-invalid`                 | state     | `true`             | An error is reported (root), or the text area is invalid (React Aria).   |
| `data-readonly`                | state     | `true`             | Read-only.                                                               |
| `data-disabled`                | state     | `true`             | Disabled (root, and the text area through React Aria).                   |
| `data-severity`                | state     | `error`, `warning` | On a diagnostic, a mark or a gutter row: the severity.                   |
| `data-current`                 | state     | `true`             | On a search match: the current one.                                      |
| `data-unmatched`               | state     | `true`             | On a bracket: it has no partner.                                         |
| `data-focused`                 | state     | `true`             | The text area has focus (React Aria).                                    |
| `data-focus-visible`           | state     | `true`             | Keyboard focus on the text area (React Aria).                            |
| `data-hovered`                 | state     | `true`             | Pointer over the text area (React Aria).                                 |
| `data-placement`               | state     |                    | Where the popover sits against the caret (React Aria).                   |
| `data-entering`                | state     | `true`             | The popover is opening (React Aria).                                     |
| `data-exiting`                 | state     | `true`             | The popover is closing (React Aria).                                     |
| `--ui-code-editor-text-width`  | property  |                    | On the gutter: the text area's client width, in pixels.                  |
