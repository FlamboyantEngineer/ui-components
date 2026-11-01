# Change List

`ChangeList` lists what changed in a record, one row per property: its label and its old → new value, drawn per value type (a word diff of text, the items added to and removed from a list, or the two values whole), with who made the change and when. It builds on [Description List](DESCRIPTION-LIST.md) and [Inline Text Diff](INLINE-TEXT-DIFF.md), and is the body of history entries in an [Activity Feed](ACTIVITY-FEED.md) and of comparisons in a [Version History](VERSION-HISTORY.md). It is read-only output.

## UIC-CHANGE-LIST-1 - Structure

### UIC-CHANGE-LIST-1.1 - One row per change

`ChangeList` shall render a [Description List](DESCRIPTION-LIST.md) (`<dl>`, also `ui-change-list`) with one row per item of `changes`, in order: a `DescriptionRow` (also `ui-change-list__change`) whose `<dt>` holds the change's `label` and whose value holds its values. Each row publishes `data-type` (`value` unless the change sets `type`) and `data-change`: `added` when only the new value is set, `removed` when only the old one is, and `changed` otherwise, where a value is unset when it is nullish, an empty text or an empty list.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/change-list/change-list.tsx`, `src/components/change-list/list-changes.ts`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

### UIC-CHANGE-LIST-1.2 - Compact and detailed variants

`variant` (`compact` by default, or `detailed`) shall be published as `data-variant` on the root. `compact` uses the list's `inline` layout and draws old → new on one line. `detailed` uses the `stacked` layout and draws two `ui-change-list__side` blocks, `data-side="before"` then `data-side="after"`, each starting with a `ui-change-list__caption` reading the provider's `valueBefore` or `valueAfter` string, then its value, or `ui-change-list__empty` reading the provider's `emptyValue` string when that side is unset.

Implementation: `src/components/change-list/change-list.tsx`, `src/components/change-list/change-values.tsx`, `src/core/strings/history.ts`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

### UIC-CHANGE-LIST-1.3 - Text values

A `text` change shall compare its values word by word with `createInlineWordDiff` ([UIC-INLINE-TEXT-DIFF-1.3](INLINE-TEXT-DIFF.md#uic-inline-text-diff-13---word-changes)) and draw them as an [Inline Text Diff](INLINE-TEXT-DIFF.md) (`ui-change-list__text`): `compact` draws every segment in one diff; `detailed` draws the old side without the added runs and the new side without the removed runs. A list value reads as its items joined with `, `.

Implementation: `src/components/change-list/change-values.tsx`, `src/components/inline-text-diff/inline-text-diff.tsx`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

### UIC-CHANGE-LIST-1.4 - Plain values

A `value` change shall draw its old value in a `<del>` (`ui-change-list__old`) and its new value in an `<ins>` (`ui-change-list__new`), each through `renderValue` (the text itself by default). In `compact`, an unset side is left out, and when both are set a decorative arrow (`ui-change-list__arrow`, hidden from assistive technology) sits between them beside the provider's `changedTo` string, visually hidden.

Implementation: `src/components/change-list/change-values.tsx`, `src/core/strings/history.ts`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

### UIC-CHANGE-LIST-1.5 - List values

A `list` change shall compare its values as lists of texts (a text value is a list of one, an empty or missing value a list of none): an old item the new list lacks is removed, a new item the old list lacks is added, and repeated items match one for one. Items render as a `<ul>` (`ui-change-list__items`) of `ui-change-list__item` elements publishing `data-change` (`added`, `removed` or `unchanged`), an added item's content in an `<ins>` and a removed item's in a `<del>`, each through `renderValue`. `compact` draws the removed items, then the added ones; `detailed` draws the whole old list on the old side and the whole new list on the new side, each in its order.

Implementation: `src/components/change-list/change-values.tsx`, `src/components/change-list/list-changes.ts`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

### UIC-CHANGE-LIST-1.6 - Who and when

A change with a `time` or a `person` shall show them as the row's second definition: an [Attribution](ATTRIBUTION.md) (`ui-change-list__attribution`) with `showAvatar`, `fallbackAfterDays`, `getNow` and `timeZone` passed on to it.

Implementation: `src/components/change-list/change-list.tsx`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

### UIC-CHANGE-LIST-1.7 - No changes

With no changes, `ChangeList` shall render what `renderEmptyState` returns, `null` included, else a small [Empty State](EMPTY-STATE.md) reading the provider's `noChanges` string, instead of the list.

Implementation: `src/components/change-list/change-list.tsx`, `src/core/strings/history.ts`
Verification: `src/components/change-list/change-list.test.tsx`

### UIC-CHANGE-LIST-1.8 - Hooks and caller attributes

`ChangeList` shall carry the hooks below beside the description list's, append the caller's `className`, and forward `id`, `ref`, caller `data-*` attributes, `aria-label` and `aria-labelledby` to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/change-list/change-list.tsx`
Verification: `src/components/change-list/change-list.test.tsx`

## UIC-CHANGE-LIST-2 - Accessibility

### UIC-CHANGE-LIST-2.1 - Changes in the markup

Every change shall be readable without colour: removed content in native `<del>` elements, added content in native `<ins>` elements, and the sides of a detailed change captioned in text. The list adds no role, live region or tab stop of its own; its only tab stops are those of its attributions and of the content `renderValue` draws.

Implementation: `src/components/change-list/change-values.tsx`
Verification: `src/components/change-list/change-list.test.tsx`, `e2e/change-list.spec.ts`

## Hooks

| Hook                          | Kind      | Values                                     | Description                                                                                   |
| ----------------------------- | --------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `ui-change-list`              | root      |                                            | The `<dl>` (also `ui-description-list`).                                                      |
| `ui-change-list__change`      | slot      |                                            | One change's row (also `ui-description-list__row`).                                           |
| `ui-change-list__text`        | slot      |                                            | A text change's word diff (also `ui-inline-text-diff`).                                       |
| `ui-change-list__old`         | slot      |                                            | A plain old value (`<del>`).                                                                  |
| `ui-change-list__new`         | slot      |                                            | A plain new value (`<ins>`).                                                                  |
| `ui-change-list__arrow`       | slot      |                                            | The decorative arrow between a compact change's values.                                       |
| `ui-change-list__items`       | slot      |                                            | A list change's items (`<ul>`).                                                               |
| `ui-change-list__item`        | slot      |                                            | One list item (`<li>`).                                                                       |
| `ui-change-list__side`        | slot      |                                            | The old or the new side of a detailed change.                                                 |
| `ui-change-list__caption`     | slot      |                                            | The side's caption.                                                                           |
| `ui-change-list__empty`       | slot      |                                            | Stands in for an unset side.                                                                  |
| `ui-change-list__attribution` | slot      |                                            | Who made the change and when (also `ui-attribution`).                                         |
| `data-variant`                | attribute | `compact`, `detailed`                      | One line per change, or the old and new values stacked.                                       |
| `data-type`                   | attribute | `text`, `value`, `list`                    | On a change: how its values are compared.                                                     |
| `data-change`                 | state     | `added`, `removed`, `changed`, `unchanged` | On a change (`added`, `removed`, `changed`) or a list item (`added`, `removed`, `unchanged`). |
| `data-side`                   | state     | `before`, `after`                          | On a side: which value it shows.                                                              |
