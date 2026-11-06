# Search Pane

`SearchPane` is a panel that searches a host's document and lists what it found: a [Find Bar](FIND-BAR.md) with the query, matching options, the count and stepping, replace controls with Replace and Replace all that are left out, hidden behind a toggle or always shown, and the results as an ordered list of one-line snippets. The host keeps the matching, the permissions, the document navigation and the edits: it reads the query and the options, reports where the search stands and every result, and follows the current result. With `replaceMode` left at `none` the pane only searches, for a read-only document. `buildSearchSnippet` and `SearchSnippet` cut and draw the snippets, and a host can use them on their own.

## UIC-SEARCH-PANE-1 - Searching

### UIC-SEARCH-PANE-1.1 - Find row

`SearchPane` shall render a `ui-search-pane` element whose header (`ui-search-pane__header`) holds a Find Bar (`ui-search-pane__find`) with the pane's `label`, `placeholder`, query (`query` controlled or `defaultQuery` uncontrolled, reported through `onQueryChange`) and matching options (`options`, with `selectedOptions` or `defaultSelectedOptions`, reported through `onSelectedOptionsChange`), and a Close button when `onClose` is given. The pane matches nothing itself and loads no document engine.

Implementation: `src/components/search-pane/search-pane.tsx`, `src/components/search-pane/use-search-pane.ts`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-1.2 - States

The root shall publish what it shows as `data-state`, each one distinct: `empty` while the query is blank, `idle` for a query the host has not searched yet (`status="idle"`), `pending` while it searches (`status="pending"`; the Find Bar shows its spinner and reads `searching`), `results` and `no-results` once it is `ready` (the default), `error` for a failed search and `unavailable` when no search can run, whatever the query. A message (`ui-search-pane__message`) reads the provider's `searchPrompt` string while `empty`, `noResults` for no results, the host's `message` or the `searchError` string for an error (as an alert) and the `message` or `searchFailed` string while unavailable; `idle`, `pending` and `results` show no message. The result list shows while there are results and stays, with the results last given, while a new search is `pending`, so a reader can keep browsing them.

Implementation: `src/components/search-pane/search-pane.tsx`, `src/components/search-pane/search-pane-state.ts`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-1.3 - Stepping through results

The current result is `currentKey` (controlled, `null` for none) or `defaultCurrentKey` (uncontrolled), reported through `onCurrentKeyChange`. The Find Bar's count reads the current result of the total, the total while none is current, or no results. Enter and Next match step to the next result and Shift+Enter and Previous match to the previous one, through every result, wrapping from the last to the first and back; from no current result they step to the first or the last. Every step reports the chosen key even when one result wraps to itself, so the host can reveal it again. The Enter that confirms a text composition steps nowhere. `emptyNavigation` passes to the Find Bar: `disabled` (the default) keeps the Previous and Next match buttons, disabled, while there is no result, and `hidden` leaves them out.

Implementation: `src/components/search-pane/use-search-pane.ts`, `src/components/search-pane/search-pane-state.ts`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-1.4 - Escape, shortcuts and focus

Escape anywhere in the pane shall call `onClose` and leave the query and the results as they are; returning focus is the host's. Without `onClose`, Escape in the query box does nothing, so it never empties the query and its results. Escape inside the options menu only closes the menu, and a composing Escape belongs to the input method. `handleRef` receives a handle whose `focusQuery()` focuses the query and selects it, and whose `focusReplacement()` shows the replace controls of a `hidable` pane, reporting the change, and focuses and selects the replacement; a host calls them for Ctrl+F or Cmd+F and Ctrl+H or Cmd+H. Inside the pane those keys do the same. With `replaceMode` `none`, `focusReplacement()` does nothing and Ctrl+H or Cmd+H is left to the host.

Implementation: `src/components/search-pane/use-search-pane.ts`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

## UIC-SEARCH-PANE-2 - Results

### UIC-SEARCH-PANE-2.1 - Result list

While there are results, a list box (`ui-search-pane__results`, named by the provider's `searchResults` string) shall hold one option (`ui-search-pane__result`) per result in the host's order. Each result has an `id`, its `source` text with the match's `start` and `end` offsets, and optionally a `label` (its section or page, `ui-search-pane__result-label`) and a `description` (`ui-search-pane__result-description`), drawn before its snippet ([UIC-SEARCH-PANE-4.2](#uic-search-pane-42---drawing-a-snippet)). The current result is the list's one selected option (`aria-selected`, `data-selected`), and stays so while focus is elsewhere. Choosing a row by pointer, or with Enter or Space after moving to it with the arrow keys, makes it current; the arrow keys alone move focus without changing the current result. Choosing the already-current row reports its key again, once per activation.

Implementation: `src/components/search-pane/search-results.tsx`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-2.2 - Current row in view

Whenever the current result changes, by stepping, by choosing a row or from the host, its row shall scroll into view (to the nearest edge), so the list follows the stepping even while focus stays in the query box.

Implementation: `src/components/search-pane/search-results.tsx`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-2.3 - Mounted rows

The list shall mount at most `maxMountedResults` rows (200 by default), a page of results that starts at a multiple of that number and holds the current result. A Show earlier button (`ui-search-pane__show-earlier`, the provider's `showEarlierResults` string with how many come before) before the list and a Show more button (`ui-search-pane__show-later`, `showLaterResults` with how many come after) after it turn the page until the current result changes; a later change back to an earlier current result follows it again rather than restoring the page turned for it. The cap never limits the count or stepping, which cover every result.

Implementation: `src/components/search-pane/search-results.tsx`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

## UIC-SEARCH-PANE-3 - Replacing

### UIC-SEARCH-PANE-3.1 - Replace modes

`replaceMode` shall choose whether the pane replaces, published as `data-replace-mode`: `none` (the default) only searches, drawing no replace toggle, replacement box or replace button and handling no replace shortcut, whatever handlers it is given; `hidable` hides the replace controls behind a toggle (UIC-SEARCH-PANE-3.2); `shown` always shows them, with no toggle, and publishes `data-replace-expanded`. The Find Bar draws the Replace button only with `onReplace` and the Replace all button only with `onReplaceAll`.

Implementation: `src/components/search-pane/search-pane.tsx`, `src/components/search-pane/use-search-pane.ts`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-3.2 - Replace disclosure

A `hidable` pane shall start its header with a toggle button (`ui-search-pane__replace-toggle`, the provider's `toggleReplace` string, `aria-expanded`, the `chevron-right` glyph while collapsed and `chevron-down` while expanded) that shows and hides the Find Bar's replacement box with Replace and Replace all. Whether they show is `isReplaceExpanded` (controlled) or `defaultReplaceExpanded` (uncontrolled, collapsed by default), reported through `onReplaceExpandedChange`; the root publishes `data-replace-expanded` while they show. The replacement (`replacement` controlled or `defaultReplacement` uncontrolled, reported through `onReplacementChange`) outlasts a collapse.

Implementation: `src/components/search-pane/search-pane.tsx`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-3.3 - Replace and Replace all

Replace and Enter in the replacement box shall call `onReplace` with the replacement and the current result's key, and Replace all calls `onReplaceAll` with the replacement; the host edits the document and reports the new results. Each action is disabled on its own: Replace by `isReplaceDisabled`, while no result is current and while the current result has `isReplaceable: false`; Replace all by `isReplaceAllDisabled` and while no result can be replaced. While the pane can replace, a row whose result cannot be replaced publishes `data-read-only` and reads the provider's `notReplaceable` string (`ui-search-pane__result-read-only`).

Implementation: `src/components/search-pane/search-pane.tsx`, `src/components/search-pane/search-results.tsx`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

## UIC-SEARCH-PANE-4 - Snippets

### UIC-SEARCH-PANE-4.1 - Building a snippet

`buildSearchSnippet({ source, start, end }, { beforeLength, afterLength, locale })` shall return one line of context around the match: the leading context (`lead`), the words immediately before the match (`near`: the last whole word before it and what follows it, such as the start of the word the match begins inside), the match, and the context after (`after`), with the snippet's `start` and `end` offsets in the source and whether text was left out before (`isStartOmitted`) or after (`isEndOmitted`). The context keeps whole words, found with `Intl.Segmenter` in `locale`, within `beforeLength` (40 by default) and `afterLength` (80 by default) characters; a word too long to keep whole is cut between graphemes. Every cut is a grapheme boundary of the whole source: the text segmented around the match widens to the nearest places no earlier text can change (two ASCII characters, or an end of the source), so a run of flags keeps its pairs and a cluster longer than the context stays whole. Each run of spaces and line breaks, across the parts, becomes one space, so a multiline source gives one line, and the spaces the source has beside the match stay while no space or punctuation is added. Nothing is left out at the source's start or end, and offsets outside the source are clamped to it.

Implementation: `src/components/search-pane/build-search-snippet.ts`
Verification: `src/components/search-pane/build-search-snippet.test.ts`

### UIC-SEARCH-PANE-4.2 - Drawing a snippet

`SearchSnippet` shall draw a built snippet as a `ui-search-snippet` element holding, in order, the leading context (`ui-search-snippet__lead`, drawn while there is any) and the near words (`ui-search-snippet__near`), each with its text in an isolated `<bdi>` run, the match in a `<mark>` (`ui-search-snippet__match`) and the context after (`ui-search-snippet__after`), with an ellipsis (`ui-search-snippet__ellipsis`) only where text was left out: at the start of the leading context, or of the near words when a long word was cut and no leading context is left, and at the end of the context after; the root publishes `data-start-omitted` and `data-end-omitted` then. The parts sit side by side with no added text, so a stylesheet can keep the source's spaces visible and, in a narrow row, give up the leading context from its start before the near words and the match. The pane draws each result's snippet with it.

Implementation: `src/components/search-pane/search-snippet.tsx`
Verification: `src/components/search-pane/search-snippet.test.tsx`, `e2e/search-pane.spec.ts`

## UIC-SEARCH-PANE-5 - Accessibility and hooks

### UIC-SEARCH-PANE-5.1 - Names, order and announcements

Every control shall be named: the query by its label, the replace toggle, the Find Bar's controls and the Show buttons by provider strings, and the result list by `searchResults`. Each option's name is its label, description and snippet text. The parts follow in this order: the replace toggle, the Find Bar, the message, Show earlier, the list and Show more. The Find Bar's count is a polite status and an error message is an alert.

Implementation: `src/components/search-pane/search-pane.tsx`, `src/components/search-pane/search-results.tsx`
Verification: `src/components/search-pane/search-pane.test.tsx`, `e2e/search-pane.spec.ts`

### UIC-SEARCH-PANE-5.2 - Hooks, caller attributes and narrow panes

`SearchPane` and `SearchSnippet` shall carry the hooks below, append the caller's `className` to their roots and forward caller `data-*` attributes and `id` to them. In the reference stylesheet the pane is a size container. The query grows and shrinks with the pane; without a count the arrows sit snug against it; a narrow pane wraps the count and its arrows together at the start of a line. The replacement takes the line below, growing and shrinking, with Replace and Replace all beside it while they fit. Each snippet keeps its match in view.

Implementation: `src/components/search-pane/search-pane.tsx`, `src/components/search-pane/search-snippet.tsx`, `labs/reference/search-pane.css`
Verification: `src/components/search-pane/search-pane.test.tsx`, `src/components/search-pane/search-snippet.test.tsx`, `e2e/search-pane.spec.ts`

## Hooks

| Hook                                 | Kind      | Values                                                                      | Description                                                         |
| ------------------------------------ | --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ui-search-pane`                     | root      |                                                                             | The pane.                                                           |
| `ui-search-pane__header`             | slot      |                                                                             | Holds the replace toggle and the Find Bar.                          |
| `ui-search-pane__replace-toggle`     | slot      |                                                                             | The button that shows and hides the replace controls.               |
| `ui-search-pane__find`               | slot      |                                                                             | The Find Bar.                                                       |
| `ui-search-pane__message`            | slot      |                                                                             | The empty, no results, error or unavailable message.                |
| `ui-search-pane__results`            | slot      |                                                                             | The result list box.                                                |
| `ui-search-pane__result`             | slot      |                                                                             | One result's option.                                                |
| `ui-search-pane__result-label`       | slot      |                                                                             | A result's label, such as its section or page.                      |
| `ui-search-pane__result-description` | slot      |                                                                             | A result's description.                                             |
| `ui-search-pane__result-read-only`   | slot      |                                                                             | The mark on a result that cannot be replaced.                       |
| `ui-search-pane__show-earlier`       | slot      |                                                                             | The button that shows the earlier page of results.                  |
| `ui-search-pane__show-later`         | slot      |                                                                             | The button that shows the next page of results.                     |
| `data-state`                         | attribute | `empty`, `idle`, `pending`, `results`, `no-results`, `error`, `unavailable` | What the pane shows.                                                |
| `data-replace-mode`                  | attribute | `none`, `hidable`, `shown`                                                  | Whether the pane replaces, and whether a toggle hides the controls. |
| `data-replace-expanded`              | state     | `true`                                                                      | On the root while the replace controls show.                        |
| `data-read-only`                     | state     | `true`                                                                      | On a result that cannot be replaced, while the pane can replace.    |
| `data-selected`                      | state     | `true`                                                                      | On the current result (React Aria).                                 |
| `data-selection-mode`                | state     | `single`                                                                    | On a result: the list's selection mode (React Aria).                |
| `data-layout`                        | state     | `stack`                                                                     | On the list: its layout (React Aria).                               |
| `data-orientation`                   | state     | `vertical`                                                                  | On the list: its orientation (React Aria).                          |
| `data-focused`                       | state     | `true`                                                                      | On the result or list that has focus (React Aria).                  |
| `data-focus-visible`                 | state     | `true`                                                                      | On the result or list that has keyboard focus (React Aria).         |
| `data-hovered`                       | state     | `true`                                                                      | On the result under the pointer (React Aria).                       |
| `data-pressed`                       | state     | `true`                                                                      | On the result being pressed (React Aria).                           |
| `data-collection`                    | state     |                                                                             | React Aria's collection marker, on the list and its results.        |
| `data-key`                           | state     |                                                                             | On a result: opaque collection key (React Aria); not for styling.   |
| `ui-search-snippet`                  | root      |                                                                             | A snippet: one line of context around a match.                      |
| `ui-search-snippet__lead`            | slot      |                                                                             | The leading context, given up first in a narrow row.                |
| `ui-search-snippet__near`            | slot      |                                                                             | The words immediately before the match.                             |
| `ui-search-snippet__match`           | slot      |                                                                             | The match, a `<mark>`.                                              |
| `ui-search-snippet__after`           | slot      |                                                                             | The context after the match.                                        |
| `ui-search-snippet__ellipsis`        | slot      |                                                                             | An ellipsis where text was left out.                                |
| `data-start-omitted`                 | state     | `true`                                                                      | On a snippet that leaves out text before it.                        |
| `data-end-omitted`                   | state     | `true`                                                                      | On a snippet that leaves out text after it.                         |
