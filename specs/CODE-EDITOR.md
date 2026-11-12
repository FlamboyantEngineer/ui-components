# Code Editor

`CodeEditor` edits source text as a field by default, with `variant="surface"` for embedding inside another field or widget. Basic language presets and custom syntax or tokenizers color a native textarea through an aligned highlight layer. JSON fields include parsing, optional schema validation, completion and formatting. Other languages accept caller diagnostics and completions. The editor provides indentation, paired brackets, bracket matching, find/replace, optional line numbers, custom scrollbars with diagnostic marks, hover information and F8 problem navigation.

## UIC-CODE-EDITOR-1 - Surface

### UIC-CODE-EDITOR-1.1 - Text area over a highlighted copy

`CodeEditor` shall render its `value` in a `<textarea>` (`ui-code-editor__input`), the control, with spelling, autocorrection, autocapitalization and autocomplete off, and report each edit through `onChange`. Behind it, a `<pre>` (`ui-code-editor__highlight`) hidden from assistive technology draws the same text, so a stylesheet can make the text area's text transparent and let the copy paint it. The text area takes the caller's `placeholder`, `name` (so a form submits the source under it), labelling props (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`), `aria-errormessage`, `isRequired` (as `aria-required`) and its focus and keyboard handlers (`onFocus`, `onBlur`, `onKeyDown`, `onKeyUp`), which run after the editor's own.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.2 - Tokens

`tokenize` shall split the source into tokens that cover it exactly, in order. Each token with a `type` renders in a `ui-code-editor__token` span carrying `data-token` with that type (`keyword`, `string`, …); tokens without one render as plain text. Without a preset, custom syntax or tokenizer the source is one plain run. The copy ends with a line break, so its last line is as tall as the text area's.

Implementation: `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.3 - Aligned layers

The highlighted copy and the gutter shall follow the text area's scroll offset in the scroll event itself, and again after the value, the wrapping, the line numbers or the measured width change, so the caret never drifts from the text the reader sees.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-1.4 - Size and wrapping

`size` (`sm`, `md` by default, `lg`) shall publish `data-size`, from which the stylesheet sets the starting height and the source metrics (font size, line height and inset) that the text area, the highlighted copy, the gutter and the caret marker share, so a larger size has larger text and the layers stay level at every size. `wrap` (`soft` by default, or `off`) shall publish `data-wrap` and set the text area's `wrap`: `soft` wraps long lines and `off` scrolls them sideways.

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

### UIC-CODE-EDITOR-1.8 - Resizing

`resize` shall publish `data-resize`: `vertical` (the default) lets the reader resize the surface's height, `both` its height and width, and `none` neither; a single-line editor publishes `none` whatever `resize` says. The reference sheet puts the grip on the surface, not the text area, so the text area, the highlighted copy and the gutter resize together. With `both`, the frame wraps the surface, which keeps its starting width, grows sideways only into the room its container gives it, shrinks to 200 pixels and takes the toolbar, search row and problem list with it; a code field takes the same width. Soft-wrapped lines rewrap, and the text, caret, selection and focus stay. The field variant passes `resize` to its surface.

Implementation: `src/components/code-editor/code-surface.tsx`, `src/components/code-editor/use-code-surface.ts`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-2 - Line numbers

### UIC-CODE-EDITOR-2.1 - Gutter

`lineNumbers` shall draw a gutter (`ui-code-editor__gutter`, hidden from assistive technology) with one row (`ui-code-editor__line`) per source line, split on line feeds, holding its number (`ui-code-editor__line-number`) and a hidden copy of the line (`ui-code-editor__line-text`, a zero-width space for an empty line), and publish `data-numbered` on the root. The reference sheet clips the gutter's background to the surface frame's rounded corners, so the frame's border stays whole where the gutter meets it.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-2.2 - Wrapped lines

The gutter shall publish the text area's measured client width as `--ui-code-editor-text-width`, so the stylesheet lets each hidden line copy wrap where the text area wraps: a wrapped line keeps one number and the rows stay level with the lines they number.

Implementation: `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-editor.tsx`, `labs/reference/code-editor.css`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-2.3 - First line number

`firstLineNumber` (1 by default) shall be the number of the gutter's first row, for an excerpt of a longer text; the rows count up from it. Diagnostics count lines the same way: their `line` and `endLine` name lines as the gutter numbers them, so the gutter rows (UIC-CODE-EDITOR-3.3), the marked ranges (UIC-CODE-EDITOR-3.4), the hover tips and F8 follow the line a diagnostic names, the list reads it as given, and a diagnostic naming a line outside the excerpt marks nothing. A JSON field's own parse and schema problems (UIC-CODE-EDITOR-9.3, UIC-CODE-EDITOR-13.1) number their lines the same way, in their marks and in the field's message, so they sit with the caller's diagnostics on the same rows.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-layers.tsx`, `src/components/code-editor/code-ranges.ts`, `src/components/code-editor/json-check.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/code-ranges.test.ts`, `src/components/code-editor/code-json.test.tsx`, `e2e/code-editor.spec.ts`, `e2e/code-json.spec.ts`

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

F8 in the text area shall select the next marked range after the caret and Shift+F8 the previous one, wrapping at either end, scroll it into view (measured in the text area's own pixels, also under an ancestor `transform: scale()`), show its hover tip on the next animation frame (after any scrolling the browser does to reveal the selection, so that scrolling neither closes the tip nor leaves it pointing at the range's old place) and read its message out in a polite status (`ui-code-editor__announcement`, visually hidden), which renders while the editor has `diagnostics`. Without a marked range the keys do nothing.

Implementation: `src/components/code-editor/use-code-editor.ts`, `src/components/code-editor/use-code-keys.ts`, `src/components/code-editor/code-geometry.ts`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-3.6 - Hover tip

When the pointer rests on a marked range, or on an offset for which `renderHover` returns content, a non-modal React Aria popover (`ui-code-editor__tooltip`) on the `tooltip` overlay layer shall point at that character with, inside a `role="tooltip"` element, the message of each problem marked there (a `ui-code-editor__diagnostic` with `data-severity`) followed by the caller's content. The tip stays while the pointer moves into it, hides shortly after the pointer leaves both, and closes on Escape, on an edit and when the text area loses focus. The Escape that closes a tip is marked handled and goes no further, so an overlay around the editor stays open until the next Escape. Finding the character under the pointer reads the copy's text once per render of the copy and bisects it, so pointer moves stay cheap on a long source. The copy is cut into segments and rendered again only when its tokens or decorations (problems, search matches, the matched bracket, the completion caret) change, so a tip that follows the pointer neither renders the copy again nor reads it again.

Implementation: `src/components/code-editor/code-hover.tsx`, `src/components/code-editor/code-geometry.ts`, `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/use-code-editor.ts`, `src/components/code-editor/code-layers.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/code-hover.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-4 - Completions

### UIC-CODE-EDITOR-4.1 - Matching

The word before the caret (a letter, `_` or `$` followed by letters, digits, `_`, `$` and `.`) shall be completed with the `completions` that match it, ignoring case: first the labels that start with it, then the labels holding its characters in order from the start of a word (after a space, `.`, `_`, `-`, `/` or `:`, or at a lowercase-to-uppercase change), each group in the given order. A label equal to the word is left out. An empty word is completed with nothing unless the reader asks (UIC-CODE-EDITOR-4.2).

Implementation: `src/components/code-editor/completion-match.ts`, `src/components/code-editor/use-code-completion.ts`, `src/components/completion-list/completion-match.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/completion-match.test.ts`

### UIC-CODE-EDITOR-4.2 - Opening

With `completions`, the text area shall autocomplete from a list (`aria-autocomplete="list"`, `aria-haspopup="listbox"`), and typing or moving the caret by key or pointer in an editable editor shall open the list of matches, and Ctrl+Space open it whatever the word before the caret, an empty word matching every completion. The list is a [Completion List](COMPLETION-LIST.md) (a listbox named by the provider string `suggestions`, with its own hooks) with its first option active, each option showing its label and description. While open, `aria-controls` names the list and `aria-activedescendant` the active option, which carries `aria-selected="true"` and `data-focused`. The text area keeps its text box role, which takes no other role, and keeps focus. The editor runs the shared completions engine ([UIC-COMPLETION-LIST-2](COMPLETION-LIST.md#uic-completion-list-2---completions-engine)).

Controlled updates through a collection such as a table cell shall keep the same text area, focus and caret. Input-triggered completions shall look up the typed text once the controlled cell update has committed, while that edit still owns the same text and caret, before the engine reconciles replaced text. Narrowing an open list shall keep it open without waiting for another animation frame. A later input, caret move, loss of focus, unmount, replacement source or locked editor cancels the deferred lookup.

Starting input-method composition shall close suggestions and cancel a pending answer. Intermediate composition input shall still report text changes, but shall not request or reopen suggestions, and composition keys shall stay with the input method. Ending composition shall resume suggestions once for the committed final text and caret, including an unchanged final value or a final input delivered after `compositionend`.

Implementation: `src/components/code-editor/use-code-completion.ts`, `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-area.tsx`, `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/use-completions.ts`, `src/core/strings.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/code-table-completion.test.tsx`, `src/components/code-editor/code-composition.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.3 - Choosing

While the list is open, ArrowDown and ArrowUp shall move the active option, wrapping at either end, Enter or Tab (not Shift+Tab) insert it once the list is on screen and Escape close the list until the next edit; those keys go no further than the editor. Without `indentWithTab`, Tab while no list shows asks for the completions at the caret and shows them without inserting ([UIC-COMPLETION-LIST-2.8](COMPLETION-LIST.md#uic-completion-list-28---seen-before-inserted)), after snippet stepping has had it; with `indentWithTab`, Tab indents or, after Escape, leaves. Moving the pointer over an option activates it and pressing it inserts it without taking focus from the text area. Losing focus closes the list.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/use-completions.ts`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.4 - Inserting

Inserting an option shall replace the word before the caret (or the range its source names, UIC-CODE-EDITOR-4.6) with its label as an editor edit (UIC-CODE-EDITOR-6.1), place the caret after the inserted text and close the list.

Implementation: `src/components/code-editor/use-code-completion.ts`, `src/components/code-editor/use-code-edits.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-4.5 - Position

The list shall open in a non-modal React Aria popover (the Completion List's root, also `ui-code-editor__popover`) on the `dropdown` overlay layer, at a caret marker (`ui-code-editor__caret`) placed in the highlighted copy while the list is open: below the caret line, or above it when there is more room there, kept inside the viewport. It follows the caret as the reader types and as the text area scrolls, staying open when the text area scrolls itself to keep the caret in view and the highlighted copy scrolls with it, at every size. When an input lookup follows a controlled-value commit, positioning shall measure the newly committed caret marker before the next paint.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/use-mirror-scroll-hold.ts`, `src/components/code-editor/code-layers.tsx`
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

A completion's `insertText` shall be inserted instead of its label. Only `insertText` interprets `${…}` as a field holding its default text; a label is literal text. A backslash before `$`, `}` or another backslash quotes that character, including inside a field. Other backslashes remain literal. The lines after the first take the indentation of the line the insertion goes into. After the insertion the first field is selected (or else the caret goes after the insertion), and while the caret stays in the current field Tab selects the next field, then the end of the insertion, and Shift+Tab the previous field; Tab with the caret elsewhere, or after the last field, ends the stepping. So does any change to the text outside the current field (a replaced, restored, reset or undone text, even of the same length, or an edit elsewhere), the editor becoming read-only or disabled, Escape (so Escape then Tab leaves the editor) and leaving the editor; edits inside the current field keep it and move the later fields.

Implementation: `src/components/code-editor/completion-match.ts`, `src/components/code-editor/use-code-completion.ts`, `src/components/code-editor/use-code-snippet.ts`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/completion-match.test.ts`, `src/components/code-editor/use-code-completion.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-5 - Attributes

### UIC-CODE-EDITOR-5.1 - Hooks and caller attributes

`CodeEditor` shall carry the hooks below, put the caller's `className` and `data-*` attributes on its root, and its `id` and `ref` on the text area, so a label can point at it and a field can focus it. The `ref` is merged as UIC-COMPOSITION-2.2 describes, so a React 19 callback ref's cleanup runs on detach.

Implementation: `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`

## UIC-CODE-EDITOR-6 - Editing

### UIC-CODE-EDITOR-6.1 - Editor edits

The editor's own edits (line breaks, indentation, pairs, completions and replacements) shall go through the browser's editing, so undo and redo in the text area revert and repeat them one at a time among the reader's own typing, and `onChange` reports them. An edit made while focus is elsewhere, such as Replace or Replace all from the search bar, briefly moves focus to the text area for the edit and gives it back to the control that had it, with that field's selection. Without browser editing the edit goes through `onChange`, restoring the edit's selection once the new value is rendered. Completions read the final caret or selection restored after an editor edit, including inside a newly inserted quote pair. A read-only or disabled editor makes none of them. Keys an input method owns (pressed during a composition, or reported with key code 229 as one ends) make no edit and neither accept, dismiss nor step through completions or snippet fields; they reach only the caller's `onKeyDown`.

Implementation: `src/components/code-editor/use-code-edits.ts`, `src/components/code-editor/use-code-keys.ts`, `src/components/code-editor/code-area.tsx`
Verification: `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/use-code-completion.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-6.2 - Line breaks keep the indentation

Enter without Ctrl, Meta or Alt shall start the new line with the indentation of the current one, one level (`indent` spaces, 2 by default) more after an opening bracket, and when the caret sits right before the matching closing bracket, move that bracket to a line of its own at the current indentation.

Implementation: `src/components/code-editor/code-editing.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-editing.test.ts`, `src/components/code-editor/code-editor.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-6.3 - Tab indentation

With `indentWithTab`, Tab shall insert spaces up to the next indentation stop at a caret or over a selection within one line, and indent every non-empty line of a selection across lines by one level; Shift+Tab removes one level (a tab, or up to `indent` spaces) from each line the selection touches. A caret or selection endpoint inside removed indentation stays at that line's start. Tab then stays in the editor, except right after Escape, when Tab and Shift+Tab move focus as usual; a modifier key pressed on its own after Escape, such as the Shift of Shift+Tab, keeps that. The very start of the text is on the first line, even when the text starts with a line break, for Tab, Shift+Tab, Enter and the indentation of inserted completions.

Implementation: `src/components/code-editor/code-editing.ts`, `src/components/code-editor/use-code-keys.ts`, `src/utils/find-line-start.ts`
Verification: `src/components/code-editor/code-editing.test.ts`, `src/utils/find-line-start.test.ts`, `src/components/code-editor/code-editor.test.tsx`, `src/components/code-editor/use-code-keys.test.tsx`, `e2e/code-editor.spec.ts`

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

With `allowsSearch`, Ctrl+F or Cmd+F in the text area (on a non-Latin layout, the key in the F key's place, [UIC-SHORTCUT-1.8](SHORTCUT.md)) shall open a [Find Bar](FIND-BAR.md) (also `ui-code-editor__search`) between the toolbar and the source, and move focus to its find box (named by the provider string `find`) with its text selected, seeded with the text area's selection when that is one line. The bar's status reads the current match of the total (`stepOfTotal`) or `noResults`, its Previous match and Next match buttons are disabled without matches, and it ends with a Close button.

Implementation: `src/components/code-editor/code-search.tsx`, `src/components/code-editor/use-code-search.ts`, `src/components/code-editor/use-code-keys.ts`
Verification: `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-7.2 - Matches

The places the literal query occurs, using Unicode case-insensitive matching and without overlaps, shall render inside `ui-code-editor__match`, the current one with `data-current`. Ranges always refer to the original source, including after characters whose lowercase form changes length. Changing the query makes the first match at or after the caret current; the buttons, Enter and Shift+Enter in the find box move to the next and previous match, wrapping, and the text area scrolls the current match into view.

Implementation: `src/components/code-editor/use-code-search.ts`, `src/components/code-editor/code-ranges.ts`, `src/components/code-editor/code-segments.ts`, `src/components/code-editor/use-code-editor.ts`
Verification: `src/components/code-editor/code-ranges.test.ts`, `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-7.3 - Replacing

In an editable editor the bar shall also hold its replacement box (provider string `replaceWith`), a Replace button that replaces the current match and moves to the next one, and a Replace all button that replaces every match in one edit, one undo step (UIC-CODE-EDITOR-6.1); Enter in the replacement box replaces. Focus stays on the control that replaced, unless no match is left and the Replace buttons turn disabled, when it moves to the find box. A read-only or disabled editor shows none of them.

Implementation: `src/components/code-editor/code-search.tsx`, `src/components/code-editor/use-code-search.ts`
Verification: `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

### UIC-CODE-EDITOR-7.4 - Closing the row

Escape in the bar, or its Close button, shall close it and return focus to the text area with the current match selected.

Implementation: `src/components/code-editor/use-code-search.ts`, `src/components/code-editor/code-search.tsx`
Verification: `src/components/code-editor/code-search.test.tsx`, `e2e/code-editor.spec.ts`

## UIC-CODE-EDITOR-8 - Field layout and JSON highlighting

### UIC-CODE-EDITOR-8.1 - Field around a code editor

`CodeEditor` shall render a `Field` (root `ui-field`, also `ui-code-editor`) whose control is a `CodeEditor` text area named by the field's label, with line numbers unless `lineNumbers` is `false`, long lines scrolling sideways (`wrap="off"`), the starting height of `size` (`sm`, `md` by default, `lg`, which is also the field's size) and the caller's `placeholder`. It takes the field props (`FieldInputProps<string>`), and the caller's `className`, `id` and `data-*` attributes go on the field's root.

Implementation: `src/components/code-editor/code-field.tsx`
Verification: `src/components/code-editor/code-json.test.tsx`, `e2e/code-json.spec.ts`

### UIC-CODE-EDITOR-8.2 - Highlighting

The editor shall highlight JSON with code editor tokens covering the text exactly: object keys (`key`), other strings (`string`), numbers (`number`), `true`, `false` and `null` (`literal`), braces, brackets, colons and commas (`punctuation`), and any other character outside whitespace (`invalid`).

Implementation: `src/components/code-editor/json-text.ts`
Verification: `src/components/code-editor/json-text.test.ts`, `e2e/code-json.spec.ts`

## UIC-CODE-EDITOR-9 - JSON validation

### UIC-CODE-EDITOR-9.1 - Parse errors

Text that does not parse as JSON shall make the field invalid with the provider string `invalidJsonAt` naming the line and column where parsing stopped, or `invalidJson` when the parser does not say. This check runs before the caller's `validate`. Blank text parses as no value: it is valid unless the field is required.

Implementation: `src/components/code-editor/code-field.tsx`, `src/components/code-editor/json-text.ts`, `src/core/strings.ts`
Verification: `src/components/code-editor/code-json.test.tsx`, `src/components/code-editor/json-text.test.ts`, `e2e/code-json.spec.ts`

### UIC-CODE-EDITOR-9.2 - Error location

The line and column, counted from 1, shall be those of the first token that breaks JSON's grammar (a missing value, a trailing comma, an unclosed bracket at the end of the text). The grammar check also handles deeply nested unfinished containers without recursive calls. When the tokens follow the grammar but the parser still refuses the text (an invalid escape, for example), they are read from the parser's message, which gives either `line L column C` or a character `position`.

Implementation: `src/components/code-editor/json-text.ts`
Verification: `src/components/code-editor/json-text.test.ts`

### UIC-CODE-EDITOR-9.3 - Error mark

The place where the text stops parsing shall be a code editor diagnostic with the field's message: its token is underlined (UIC-CODE-EDITOR-3.4), its gutter row carries `data-severity="error"`, and the hover tip and F8 read the message. The code editor does not list it again below the source (`listDiagnostics` off), since the field shows it.

Implementation: `src/components/code-editor/json-check.ts`, `src/components/code-editor/code-field.tsx`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-json.test.tsx`, `e2e/code-json.spec.ts`

## UIC-CODE-EDITOR-10 - JSON formatting

### UIC-CODE-EDITOR-10.1 - Format button

An editor that is not read-only shall show a Format button (`ui-code-editor__format`, provider string `format`) in the code editor's toolbar. Pressing it lays the text out with `indent` spaces per level (2 by default, 0 to 10) and commits it. Formatting changes only whitespace: every number, string and repeated key keeps the text it was written with, so an integer past what a JavaScript number holds, `-0` or a long fraction survives as written. The button is disabled while the editor is disabled, so disabling never changes its size, and while the text is blank, does not parse or is already formatted; a read-only editor shows none. The button coming or going, as `readOnly` or `language` changes, keeps the elements, focus and state of the caller's `toolbar` content. Working out whether the text is already formatted never holds up typing: the button follows the text once rendering has time to spare, and a press formats the text as it is then.

Implementation: `src/components/code-editor/code-field.tsx`, `src/components/code-editor/json-text.ts`, `src/core/strings.ts`
Verification: `src/components/code-editor/code-json.test.tsx`, `src/components/code-editor/json-text.test.ts`, `e2e/code-json.spec.ts`

## UIC-CODE-EDITOR-11 - Field behaviour

### UIC-CODE-EDITOR-11.1 - Commit, dirty state and restore

The editor shall commit its text when focus leaves the field (UIC-FIELD-1.11), so Tab from the edited text area reaches the restore button without committing. While the text differs from the committed text the field is dirty and offers its restore button, which puts the committed text back.

Implementation: `src/components/code-editor/code-field.tsx`
Verification: `src/components/code-editor/code-json.test.tsx`, `e2e/code-json.spec.ts`

### UIC-CODE-EDITOR-11.2 - Undo, redo and menu

Ctrl+Z or Cmd+Z in the editor shall undo the field and Ctrl+Shift+Z, Cmd+Shift+Z or Ctrl+Y redo it, and the field menu shall offer the caller's entries; Clear sets empty text and Set to default the default text.

Implementation: `src/components/code-editor/code-field.tsx`
Verification: `src/components/code-editor/code-json.test.tsx`

### UIC-CODE-EDITOR-11.3 - Locked editor

A read-only editor shall keep its text and line numbers visible and refuse edits; a disabled editor disables its text area. Neither is ever dirty.

Implementation: `src/components/code-editor/code-field.tsx`
Verification: `src/components/code-editor/code-json.test.tsx`

## UIC-CODE-EDITOR-12 - Languages and fields

### UIC-CODE-EDITOR-12.1 - Built-in and custom syntax

`language` selects basic highlighting for text (default), JSON, JavaScript, TypeScript, HTML, CSS, SQL, Python, Markdown, C (`c`), C++ (`cpp`), YAML, XML or shell scripts (`shell`). These presets highlight syntax without providing a language server, and mark tokens with the kinds `keyword`, `string`, `number`, `comment`, `key` (an object key, a YAML key or an XML attribute name), `literal` (a JSON literal or a shell variable), `punctuation` (JSON punctuation or a shell operator) and `link`. `syntax` accepts ordered `{ type, pattern: RegExp }` rules for another language, preserving regex flags and ignoring empty matches; it is the extension point for a language without a preset. `tokenize` overrides syntax and language. Every tokenizer preserves source text exactly; token kinds publish `data-token` for the stylesheet. `resolveCodeTokenizer({ language, syntax })` is public and stable: it returns the tokenizer the editor uses for them, a function from source text to `CodeToken[]` (`{ text, type? }`, in source order and covering the text exactly, so a token's offsets are the running sum of the lengths before it), or none for plain text. A [Code Block](CODE-BLOCK.md), or a host highlighting code elsewhere, can highlight with the same presets through it.

Implementation: `src/components/code-editor/code-languages.ts`, `src/components/code-editor/code-editor.tsx`
Verification: `src/components/code-editor/code-languages.test.tsx`

### UIC-CODE-EDITOR-12.2 - Field and surface variants

`variant="field"` is the default: a string field with label, descriptions, validation, dirty state, restore, undo, menu, native form name and commit on blur. `variant="surface"` is a controlled editing surface for composition in another field or widget. JSON field mode provides parsing, optional JSON Schema checks, completions, hover documentation and formatting; other languages accept caller diagnostics and completion sources. Caller errors also make a field invalid.

Implementation: `src/components/code-editor/code-editor.tsx`, `src/components/code-editor/code-field.tsx`, `src/components/code-editor/code-surface.tsx`
Verification: `src/components/code-editor/code-languages.test.tsx`, `src/components/code-editor/code-json.test.tsx`, `src/components/code-editor/code-editor.test.tsx`

### UIC-CODE-EDITOR-12.3 - Diagnostic scrollbar marks

Multiline surfaces hide native scrollbars and draw the shared custom scrollbars around the native textarea viewport. Colored marks inside the vertical track map each diagnostic line or multiline range to its position in the whole document, including wrapped text and non-default first line numbers, measured in the gutter's own pixels so they stay in place under an ancestor `transform: scale()`. Error marks are red and warning marks amber in the reference stylesheet. The track and thumb preserve pointer drag, paging, wheel and keyboard scrolling, while existing F8 diagnostic navigation remains available. Editor thumbs stay out of the Tab sequence so Tab can reach the field restore controls; focusing a thumb by pointer still enables its scrolling keys. Measurements refresh when text or layout changes; obsolete marks disappear with diagnostics.

Implementation: `src/components/code-editor/code-scrollbars.tsx`, `src/components/scroll-region/overlay-scrollbars.tsx`
Verification: `e2e/code-overview.spec.ts`

## UIC-CODE-EDITOR-13 - JSON schema

### UIC-CODE-EDITOR-13.1 - Schema subset

With `schema`, text that parses shall be checked against this subset of JSON Schema, other keywords being ignored: `type` (one or a list of `object`, `array`, `string`, `number`, `integer`, `boolean`, `null`), `enum`, `const`, `properties`, `required`, `additionalProperties` (`false`, or a schema for the other properties), `items` (one schema for every item), `minimum`, `maximum`, `minLength`, `maxLength` (in characters), `pattern` (a pattern that is not a valid expression is ignored), `minItems` and `maxItems`. Both `enum` and `const` apply when both are given. Structured values compare recursively by value: array order matters, object key order does not, and a repeated object key takes its last value as `JSON.parse` does. Only own entries in `properties` describe keys; prototype names such as `constructor` are ordinary keys. A value of the wrong type or outside its `enum` or `const` is not checked further. Parsing, validation, equality and formatting use explicit container stacks, so valid deep nesting does not exhaust the JavaScript call stack, and a node without an enumeration or constant is not reserialized to validate it. Each problem is an error diagnostic marking the value (a missing property marks the object's `{`, a property `additionalProperties: false` refuses marks its key), with the provider strings `jsonTypeMismatch`, `jsonValueMismatch`, `jsonMissingProperty`, `jsonUnknownProperty`, `jsonTooFewItems`, `jsonTooManyItems`, `rangeUnderflow`, `rangeOverflow`, `tooShort`, `tooLong` and `patternMismatch`. The field reports the first problem in the text with `jsonProblemAt` and its line and column, before the caller's `validate` runs.

Implementation: `src/components/code-editor/json-schema.ts`, `src/components/code-editor/json-tree.ts`, `src/components/code-editor/json-value.ts`, `src/components/code-editor/json-check.ts`, `src/components/code-editor/code-field.tsx`, `src/core/strings.ts`
Verification: `src/components/code-editor/json-schema.test.ts`, `src/components/code-editor/json-tree.test.ts`, `src/components/code-editor/json-check.test.ts`, `src/components/code-editor/code-json.test.tsx`, `e2e/code-json.spec.ts`

### UIC-CODE-EDITOR-13.2 - Key completion

At a key of an object the schema describes (found through `properties`, `additionalProperties` and `items`, in text that may not parse yet), the editor shall complete with the properties the object does not have yet: the quoted name as label, kind `property`, the allowed types as description and the property's `description` as documentation. Inserting one replaces the key typed so far and adds `: ` and a starting value as a snippet field (UIC-CODE-EDITOR-4.8): the `const`, first `enum` value (including `null`) or the `default`, else `""`, `0`, `false`, `null`, `{}` or `[]` by type; a key already followed by a colon is replaced alone. Serialized keys and starting values preserve literal dollar signs, braces and backslashes instead of interpreting them as snippet fields.

Implementation: `src/components/code-editor/json-complete.ts`, `src/components/code-editor/json-tree.ts`, `src/components/code-editor/json-schema.ts`
Verification: `src/components/code-editor/json-complete.test.ts`, `src/components/code-editor/json-tree.test.ts`, `src/components/code-editor/code-json.test.tsx`, `e2e/code-json.spec.ts`

### UIC-CODE-EDITOR-13.3 - Value completion

At a value, the editor shall complete with the values its schema lists (`const`, or `enum`), or else `true` and `false` for a boolean, `null` for a null and the `default`, as JSON, with kind `value` and the schema's `description` as documentation. Inserting one replaces the value typed so far with literal JSON, preserving any snippet-like characters in its strings.

Implementation: `src/components/code-editor/json-complete.ts`
Verification: `src/components/code-editor/json-complete.test.ts`, `src/components/code-editor/code-json.test.tsx`

### UIC-CODE-EDITOR-13.4 - When completions open

Schema completions shall be offered while a key or value is being typed, after a colon and on Ctrl+Space, and never after a complete root value.

Implementation: `src/components/code-editor/json-complete.ts`
Verification: `src/components/code-editor/json-complete.test.ts`

### UIC-CODE-EDITOR-13.5 - Hover documentation

Resting the pointer on a key or a value shall show the `description` of its schema in the code editor's hover tip (UIC-CODE-EDITOR-3.6), after any problem marked there. JSON escapes in property names are decoded before looking up their schema.

Implementation: `src/components/code-editor/json-complete.ts`, `src/components/code-editor/code-field.tsx`
Verification: `src/components/code-editor/json-complete.test.ts`, `e2e/code-json.spec.ts`

## UIC-CODE-EDITOR-14 - JSON editing

### UIC-CODE-EDITOR-14.1 - Brackets and indentation

The editor shall mark the bracket at the caret and its partner (UIC-CODE-EDITOR-6.5), pair brackets and quotes with `autoCloseBrackets` (UIC-CODE-EDITOR-6.4) and keep the indentation on Enter with `indent` spaces per level (UIC-CODE-EDITOR-6.2).

Implementation: `src/components/code-editor/code-field.tsx`
Verification: `src/components/code-editor/code-json.test.tsx`, `e2e/code-json.spec.ts`

## Hooks

| Hook                            | Kind      | Values                                                                                                                     | Description                                                              |
| ------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `ui-code-editor`                | root      |                                                                                                                            | The editor's frame.                                                      |
| `ui-code-editor__toolbar`       | slot      |                                                                                                                            | The toolbar row above the source.                                        |
| `ui-code-editor__surface`       | slot      |                                                                                                                            | Holds the gutter and the code area.                                      |
| `ui-code-editor__gutter`        | slot      |                                                                                                                            | The line numbers.                                                        |
| `ui-code-editor__line`          | slot      |                                                                                                                            | A gutter row.                                                            |
| `ui-code-editor__line-number`   | slot      |                                                                                                                            | A line's number.                                                         |
| `ui-code-editor__line-text`     | slot      |                                                                                                                            | A hidden copy of the line that gives the row its wrapped height.         |
| `ui-code-editor__code`          | slot      |                                                                                                                            | Stacks the highlighted copy and the text area.                           |
| `ui-code-editor__highlight`     | slot      |                                                                                                                            | The highlighted copy of the source.                                      |
| `ui-code-editor__token`         | slot      |                                                                                                                            | A typed token in the copy.                                               |
| `ui-code-editor__mark`          | slot      |                                                                                                                            | Source a diagnostic points at, in the copy.                              |
| `ui-code-editor__match`         | slot      |                                                                                                                            | A search match, in the copy.                                             |
| `ui-code-editor__bracket`       | slot      |                                                                                                                            | The bracket at the caret or its partner, in the copy.                    |
| `ui-code-editor__caret`         | slot      |                                                                                                                            | The empty marker at the caret while the completion list is open.         |
| `ui-code-editor__input`         | slot      |                                                                                                                            | The text area.                                                           |
| `ui-code-editor__diagnostics`   | slot      |                                                                                                                            | The diagnostics list.                                                    |
| `ui-code-editor__diagnostic`    | slot      |                                                                                                                            | One diagnostic, in the list or the hover tip.                            |
| `ui-code-editor__announcement`  | slot      |                                                                                                                            | The visually hidden status that reads a problem out.                     |
| `ui-code-editor__tooltip`       | slot      |                                                                                                                            | The hover tip popover.                                                   |
| `ui-code-editor__popover`       | slot      |                                                                                                                            | The completion list (also `ui-completion-list`).                         |
| `ui-code-editor__search`        | slot      |                                                                                                                            | The find and replace row, a Find Bar beside its own `ui-find-bar` hooks. |
| `data-size`                     | attribute | `sm`, `md`, `lg`                                                                                                           | Starting height and source metrics.                                      |
| `data-resize`                   | attribute | `vertical`, `both`, `none`                                                                                                 | Which way the reader may resize the surface.                             |
| `data-wrap`                     | attribute | `soft`, `off`                                                                                                              | Whether long lines wrap.                                                 |
| `data-token`                    | attribute |                                                                                                                            | On a token: its type, from the caller's tokenizer.                       |
| `data-numbered`                 | state     | `true`                                                                                                                     | The gutter shows.                                                        |
| `data-single-line`              | state     | `true`                                                                                                                     | The source stays on one line (`multiline={false}`).                      |
| `data-invalid`                  | state     | `true`                                                                                                                     | An error is reported (root), or the text area is invalid (React Aria).   |
| `data-readonly`                 | state     | `true`                                                                                                                     | Read-only.                                                               |
| `data-disabled`                 | state     | `true`                                                                                                                     | Disabled (root, and the text area through React Aria).                   |
| `data-severity`                 | state     | `error`, `warning`                                                                                                         | On a diagnostic, a mark or a gutter row: the severity.                   |
| `data-current`                  | state     | `true`                                                                                                                     | On a search match: the current one.                                      |
| `data-unmatched`                | state     | `true`                                                                                                                     | On a bracket: it has no partner.                                         |
| `data-focused`                  | state     | `true`                                                                                                                     | The text area has focus (React Aria).                                    |
| `data-focus-visible`            | state     | `true`                                                                                                                     | Keyboard focus on the text area (React Aria).                            |
| `data-hovered`                  | state     | `true`                                                                                                                     | Pointer over the text area (React Aria).                                 |
| `data-placement`                | state     |                                                                                                                            | Where the popover sits against the caret (React Aria).                   |
| `data-entering`                 | state     | `true`                                                                                                                     | The popover is opening (React Aria).                                     |
| `data-exiting`                  | state     | `true`                                                                                                                     | The popover is closing (React Aria).                                     |
| `--ui-code-editor-text-width`   | property  |                                                                                                                            | On the gutter: the text area's client width, in pixels.                  |
| `ui-code-editor__format`        | slot      |                                                                                                                            | JSON Format button.                                                      |
| `ui-code-editor__scrollbars`    | slot      |                                                                                                                            | Custom scrollbars around the native textarea.                            |
| `ui-code-editor__scroll-marker` | slot      |                                                                                                                            | Diagnostic range inside the vertical track.                              |
| `data-variant`                  | attribute | `field`, `surface`                                                                                                         | Field wrapper or editing surface.                                        |
| `data-language`                 | attribute | `text`, `json`, `javascript`, `typescript`, `html`, `css`, `sql`, `python`, `markdown`, `c`, `cpp`, `yaml`, `xml`, `shell` | Basic syntax preset.                                                     |
| `data-measurement`              | state     | `true`                                                                                                                     | Gutter used only to measure diagnostic lines.                            |
