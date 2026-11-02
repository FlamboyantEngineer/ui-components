# Completion List

`CompletionList` is the list of completions for an editor that keeps focus and owns the caret: a listbox in a non-modal popover against an anchor (the editor's frame, or a caret marker the editor places), with the active option's documentation, an empty state and a footer. It draws options only: the editor moves the active option, names it in `aria-activedescendant` and inserts it. The completions engine behind [Text Field](TEXT-FIELD.md#uic-text-field-5---completions), [Message Composer](MESSAGE-COMPOSER.md) and [Code Editor](CODE-EDITOR.md#uic-code-editor-4---completions) completions (matching, sources, keys and insertion) and `createTriggerCompletions`, a source for trigger characters such as `@` and `#`, are specified here too.

## UIC-COMPLETION-LIST-1 - List

### UIC-COMPLETION-LIST-1.1 - Popover

While `isOpen`, and while it has items or an empty state to show, `CompletionList` shall render a non-modal React Aria popover (`ui-completion-list`) on the `dropdown` overlay layer against `anchorRef`: below it, aligned with its start, or above it when there is more room there, kept inside the viewport, publishing the anchor's width as `--ui-trigger-width`. The popover never takes focus or hides the rest of the page, and it follows the anchor to where it has moved whenever it renders with new items, as an editor passes them when its caret marker moves. `onOpenChange` hears the popover ask to close, as React Aria does when an element holding the anchor scrolls, except for a mirror layer: an element holding the anchor but not the focused control, such as an editor's highlighted copy that scrolls with its text area, moves the list instead of closing it.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/use-mirror-scroll-hold.ts`
Verification: `src/components/completion-list/completion-list.test.tsx`, `e2e/completion-list.spec.ts`

### UIC-COMPLETION-LIST-1.2 - Options

Each item shall render an option (`ui-completion-list__option`, role `option`) in a listbox (`ui-completion-list__listbox`) whose id is the caller's `id` (or a generated one), named by `aria-label`, `aria-labelledby` or else the provider string `suggestions`. An option's id is `getCompletionOptionId(listId, key)`, with the key's primitive type encoded so numeric and text keys that read alike remain distinct; it shows the item's label (`ui-completion-list__label`) and description (`ui-completion-list__description`), separated by a space so the option is named "Lyon France" rather than "LyonFrance", or what `renderItem(item, { isActive })` draws instead, and publishes the item's `kind` as `data-kind`. The option whose key is `activeKey` carries `aria-selected="true"` and `data-focused`, and stays scrolled into view within the list's own scroll area (measured in that area's own pixels, so also under an ancestor `transform: scale()`), without scrolling the editor or document; the list and its option are found by id in the anchor's own tree (the shadow root holding it, else its document), never in an outer document. Opening waits for focus-driven viewport scrolling to finish, so keyboard focus on an editor below the viewport leaves its completion list usable; `onShownChange` hears the list come on screen and leave it, so an editor inserts by key only an option the reader can see (UIC-COMPLETION-LIST-2.8). The reference sheet sizes the list to its content within the viewport and lines its options up in content-sized kind, label and description columns, so a column no option uses takes no room: each kind is a small tag tinted by what it names (keywords, functions, fields, values and people each in their own colour, others muted), the description is quieter and truncates before a long label does, and the active option keeps its background in both themes.

Implementation: `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/completion-option-id.ts`, `src/components/completion-list/use-active-completion.ts`, `src/utils/use-frame-flag.ts`, `src/core/strings/content.ts`, `labs/reference/completion-list.css`
Verification: `src/components/completion-list/completion-list.test.tsx`, `src/components/completion-list/use-active-completion.test.tsx`, `src/utils/use-frame-flag.test.ts`, `e2e/completion-list.spec.ts`, `e2e/query-field.spec.ts`

### UIC-COMPLETION-LIST-1.3 - Pointer

Hovering an option that is not active with a mouse or pen shall call `onActiveKeyChange` with its key (a touch does not hover), and pressing an option shall call `onAction` with its key. Options take React Aria's press and hover interactions, so a touch that moves off an option before it lifts or is cancelled does not act. A press on an option, the documentation or the footer keeps focus and the caret where they are, in the editor.

Implementation: `src/components/completion-list/completion-list.tsx`
Verification: `src/components/completion-list/completion-list.test.tsx`, `e2e/completion-list.spec.ts`

### UIC-COMPLETION-LIST-1.4 - Documentation, empty state and footer

While the active item has `documentation`, the popover shall show it after the listbox in `ui-completion-list__documentation`, which describes the active option (`aria-describedby`). With no items, `renderEmptyState` draws what shows instead of the listbox, such as a busy line while a source looks options up or a note that nothing matches, in a status (`ui-completion-list__empty`) that takes the list's id; without it the list stays closed. `footer` renders after the options in `ui-completion-list__footer`, such as a match count and key hints.

Implementation: `src/components/completion-list/completion-list.tsx`
Verification: `src/components/completion-list/completion-list.test.tsx`, `e2e/completion-list.spec.ts`

### UIC-COMPLETION-LIST-1.5 - Hooks and caller attributes

`CompletionList` shall carry the hooks below, append the caller's `className` to its root (the popover) and forward caller `data-*` attributes to it. The caller's `id` goes on the listbox (or the empty state), the element an editor names in `aria-controls`.

Implementation: `src/components/completion-list/completion-list.tsx`
Verification: `src/components/completion-list/completion-list.test.tsx`

## UIC-COMPLETION-LIST-2 - Completions engine

### UIC-COMPLETION-LIST-2.1 - Matching

`matchCompletions(completions, query)` shall keep the completions whose label matches the query, ignoring case, best first and otherwise in their order: labels that start with it, then labels holding its characters in order from the start of a word (after a space, `.`, `_`, `-`, `/` or `:`, or at a lowercase-to-uppercase change). A label equal to the query is left out, and an empty query keeps them all. `scoreCompletion` gives the rank: 0 for a prefix, 1 for a word prefix, more for a scattered match, `null` for none.

Implementation: `src/components/completion-list/completion-match.ts`
Verification: `src/components/completion-list/text-completions.test.tsx`, `src/components/code-editor/completion-match.test.ts`

### UIC-COMPLETION-LIST-2.2 - Lookups

The engine shall look completions up on each edit, on each caret move by a navigation key the list did not use or by the pointer, and on Ctrl+Space, from a vocabulary or a source. A vocabulary completes the word before the caret (each control says how it reads words) and is asked for nothing while that word is empty unless the reader pressed Ctrl+Space. A source is called with `{ value, caret, query, isExplicit }` and returns, at once or as a promise, completions or `{ options, from, to, filter }`: the text from `from` (the start of the word by default) to `to` (the caret by default) is what a completion replaces, and the options are matched (UIC-COMPLETION-LIST-2.1) against the text from `from` to the caret unless `filter` is `false`. When that text is empty, all options show after an edit or Ctrl+Space and none after a bare caret move. Only the latest lookup's answer shows; while a source's answer to an edit is pending, an open list stays open, narrowed to the options that still match the typed text and following the caret, and a caret move hides it until its answer comes. A source that rejects, or throws before it answers, shows nothing for that lookup and leaves the control working. Closing the list discards a pending answer, and a read-only or disabled control looks nothing up. Locking the control or removing its completions closes its current list and discards pending answers; unlocking or restoring completions requires a fresh lookup and cannot reveal the old list.

Implementation: `src/components/completion-list/use-completions.ts`
Verification: `src/components/completion-list/text-completions.test.tsx`

### UIC-COMPLETION-LIST-2.3 - Keys

While the list is open, ArrowDown and ArrowUp shall move the active option, wrapping at either end, Enter or Tab (not Shift+Tab) insert it once the list is on screen (UIC-COMPLETION-LIST-2.8), and Escape close the list and discard a pending answer, until the next lookup; Ctrl+Space asks for completions whether the list is open or not. Those keys have their default prevented and go no further than the control, so the control's other key handling (committing, sending, reverting) does not see them. Keys an input method owns are left alone, Escape included: those pressed during a composition and the Enter some browsers report with key code 229 as a composition ends. The first option is active whenever the list opens.

Implementation: `src/components/completion-list/use-completions.ts`
Verification: `src/components/completion-list/text-completions.test.tsx`

### UIC-COMPLETION-LIST-2.4 - Text insertion

In a text input or text area, inserting a completion shall replace the text it completes with its `insertText`, or its label, as a browser edit that stays on the undo stack and reaches the control as input, or else through the control's value, and place the caret after the inserted text, then close the list. A control without a caret, such as an email input, takes the completion as the end of its text: the edit replaces the whole value, as a browser edit where the browser offers one, and no caret is placed. An insertion callback captured before the list closed, the control locked or its completions were removed cannot edit the value; repeated calls before the next render insert only once. A vocabulary there completes the letters, digits, `_` and `-` before the caret. The control keeps its text box role and autocompletes from a list (`aria-autocomplete="list"`, `aria-haspopup="listbox"`); while the list is open, `aria-controls` names it and `aria-activedescendant` names the active option.

Implementation: `src/components/completion-list/text-completions.ts`, `src/components/completion-list/completion-list.tsx`
Verification: `src/components/completion-list/text-completions.test.tsx`, `e2e/text-field.spec.ts`

### UIC-COMPLETION-LIST-2.5 - Trigger characters

`createTriggerCompletions(triggers)` shall return a source that, when a trigger's `character` sits at the start of the text or after white space, on the caret's line, and the text from it to the caret is a query (no white space, or with `allowsSpaces` no line break and no leading space), asks that trigger's `getCompletions(query)`, at once or as a promise, and answers its completions as given (not filtered again), replacing the trigger character and its query. Elsewhere it answers nothing, so `alice@example.com` opens no list.

Implementation: `src/components/completion-list/trigger-completions.ts`
Verification: `src/components/completion-list/trigger-completions.test.ts`, `e2e/completion-list.spec.ts`

### UIC-COMPLETION-LIST-2.6 - Replaced text

A lookup and the list it opens shall belong to the text they were looked up for: the engine's own edits and caret moves carry them along (UIC-COMPLETION-LIST-2.2), but a value the control is given from outside, such as a controlled replacement, a reset or a recalled message, closes the list and discards a pending answer, which then shows nothing. Inserting checks again that the control still holds that text, and closes the list instead of editing when it does not, so an answer for earlier text never replaces part of the new one. Rendering the control again with the same value keeps the list as it is. TextField, MessageComposer and CodeEditor share this behaviour.

Implementation: `src/components/completion-list/use-completions.ts`
Verification: `src/components/text-field/use-text-field-input.test.tsx`, `src/components/message-composer/message-composer.test.tsx`, `src/components/code-editor/code-editor.test.tsx`, `e2e/completion-list.spec.ts`

### UIC-COMPLETION-LIST-2.7 - Replaced source

A lookup and the list it opens shall also belong to the source that answered them: when the control's `completions` change to another source while a lookup is pending or a list is open, the old answer is discarded before it shows or inserts, and the new source is asked again for the same text and caret. Until a new source that answers later has answered, no list shows, so an option of the old source can neither be seen nor inserted. A vocabulary is the same source while it lists equal completions in the same order, so an inline list written again on each render keeps its list without asking again; a source function is the same source while it is the same function, so a host keeps it stable (defined once, or memoised) to avoid asking again on every render. TextField, MessageComposer and CodeEditor share this behaviour, alongside the replaced-text guard of UIC-COMPLETION-LIST-2.6.

Implementation: `src/components/completion-list/use-completions.ts`
Verification: `src/components/text-field/use-text-field-input.test.tsx`, `src/components/message-composer/message-composer.test.tsx`, `src/components/code-editor/code-editor.test.tsx`, `e2e/completion-list.spec.ts`

### UIC-COMPLETION-LIST-2.8 - Seen before inserted

The engine shall insert by key only an option the reader can see: it knows the list is on screen when the list reports it (`setShown`, from the list's `onShownChange`), which happens a frame after the list opens. Until then Enter and Tab wait (their default prevented, inserting nothing). Tab (alone, not owned by an input method) while no list is on screen, as after Escape or a list that only a pending answer will open, shall show the completions without inserting one, through `revealOnTab`: an answer already on its way keeps Tab and shows when it comes; otherwise the place at the caret is looked up as after an edit, and Tab is kept only when that lookup shows options at once. With nothing to show, or a source that answers later and has nothing pending, Tab moves focus as usual, as Shift+Tab always does. So the first Tab shows the list, the next Tab inserts its active option and the Tab after that leaves once nothing completes the text. TextField, MessageComposer and CodeEditor (without `indentWithTab`, so also QueryField and FormulaBar) share this behaviour; a rich MessageComposer's mention and command list waits for the screen the same way and shows again on Tab after Escape.

Implementation: `src/components/completion-list/use-completions.ts`, `src/components/completion-list/completion-list.tsx`, `src/components/completion-list/text-completions.ts`, `src/components/code-editor/code-area.tsx`, `src/components/message-composer/rich/use-rich-completions.ts`
Verification: `src/components/completion-list/text-completions.test.tsx`, `e2e/query-field.spec.ts`

## Hooks

| Hook                                | Kind      | Values                                     | Description                                             |
| ----------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------- |
| `ui-completion-list`                | root      |                                            | The non-modal popover.                                  |
| `--ui-trigger-width`                | property  |                                            | Width of the element the popover opens from, in pixels. |
| `ui-completion-list__listbox`       | slot      |                                            | The listbox of options.                                 |
| `ui-completion-list__option`        | slot      |                                            | An option.                                              |
| `ui-completion-list__label`         | slot      |                                            | An option's label.                                      |
| `ui-completion-list__description`   | slot      |                                            | An option's description.                                |
| `ui-completion-list__documentation` | slot      |                                            | The active option's documentation.                      |
| `ui-completion-list__empty`         | slot      |                                            | What shows while there are no options.                  |
| `ui-completion-list__footer`        | slot      |                                            | The line after the options.                             |
| `data-kind`                         | attribute |                                            | On an option: the completion's kind.                    |
| `data-focused`                      | state     | `true`                                     | On an option: the active option.                        |
| `data-placement`                    | state     | `top`, `bottom`, `left`, `right`, `center` | Side of the anchor the popover opened on (React Aria).  |
| `data-entering`                     | state     | `true`                                     | The popover is opening (React Aria).                    |
| `data-exiting`                      | state     | `true`                                     | The popover is closing (React Aria).                    |
