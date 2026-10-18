# Tag Group

`TagGroup` shows a set of short values, such as chosen filters, labels or people, as tags in one focusable collection built on React Aria's `TagGroup`, `TagList` and `Tag`. The arrow keys move between tags, and with `onRemove` every tag can be removed by its remove button or by Delete and Backspace. Tags take the shared sizes and tones. A single non-interactive value is a [Badge](BADGE.md); a token the reader presses to act is a [Button](BUTTON.md) with the `chip` variant; a field that chooses several values from a list is a multiple [Select Field](SELECT-FIELD.md).

## UIC-TAG-GROUP-1 - Contract

### UIC-TAG-GROUP-1.1 - Structure

`TagGroup` shall render React Aria's `TagGroup` as its root (`ui-tag-group`, a `<div>`) holding a `TagList` (`ui-tag-group__list`, `role="grid"`) named by the group's `aria-label` or `aria-labelledby`. Each `Tag` is a row (`ui-tag-group__tag`, `role="row"`) named by its `textValue`, which defaults to its children when they are plain text, with its children in `ui-tag-group__label`.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`, `e2e/tag-group.spec.ts`

### UIC-TAG-GROUP-1.2 - Items or children

The tags shall be the group's `Tag` children, or, with `items`, the `Tag` its render function returns for each item. A tag's `id` is its collection key. Rendering new items or children updates the tags, their content and their names.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`

### UIC-TAG-GROUP-1.3 - Sizes

`size` shall publish `data-size` on the root: `sm`, `md` (the default) or `lg`. The reference sheet draws 18, 22 and 26 pixel tags.

Implementation: `src/components/tag-group/tag-group.tsx`, `labs/reference/tag-group.css`
Verification: `src/components/tag-group/tag-group.test.tsx`, `e2e/tag-group.spec.ts`

### UIC-TAG-GROUP-1.4 - Tones

Every tag shall publish `data-tone`: its own `tone`, else the group's `tone`, else `neutral`, from the shared tones (`neutral`, `info`, `success`, `warning`, `danger`). A change of the group's tone or size updates tags already rendered. The tone is never the only signal: the tag's text states the value.

Implementation: `src/components/tag-group/tag-group.tsx`, `labs/reference/tag-group.css`
Verification: `src/components/tag-group/tag-group.test.tsx`, `e2e/tag-group.spec.ts`

### UIC-TAG-GROUP-1.5 - Empty state

While the group holds no tag, the list shall publish `data-empty` and show what `renderEmptyState` returns inside `ui-tag-group__empty`; without `renderEmptyState` it shows nothing.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`, `e2e/tag-group.spec.ts`

### UIC-TAG-GROUP-1.6 - Hooks and caller attributes

`TagGroup` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root. `Tag` appends its `className` and forwards caller `data-*` attributes to its row, so a caller can mark a tag (for example `data-change="added"`); hook values win over caller attributes of the same name.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`

## UIC-TAG-GROUP-2 - Interaction

### UIC-TAG-GROUP-2.1 - Keyboard

Only one tag shall be in the tab order: the last focused one, or the first at the start. The arrow keys, Home and End move between tags, passing over disabled ones, and Tab moves from the focused tag to its remove button, if it has one, and then out of the list.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`, `e2e/tag-group.spec.ts`

### UIC-TAG-GROUP-2.2 - Removal

With `onRemove`, each enabled tag shall publish `data-allows-removing` and end with a remove button (`ui-tag-group__remove`, an `IconButton` with the `close` glyph named by the provider string `remove` read with the tag's name, "Remove Apple"). Pressing it, or Delete or Backspace on a focused tag, calls `onRemove` with the set of keys to remove: that tag's, or every selected tag's when the focused tag is selected. When the caller removes the focused tag, focus moves to a neighbouring tag. Without `onRemove`, tags draw no remove button, ignore Delete and Backspace and stay focusable, so a read-only set stays readable and navigable.

Implementation: `src/components/tag-group/tag-group.tsx`, `src/core/strings.ts`
Verification: `src/components/tag-group/tag-group.test.tsx`, `e2e/tag-group.spec.ts`

### UIC-TAG-GROUP-2.3 - Disabled tags

A tag with `isDisabled`, or listed in the group's `disabledKeys`, shall publish `data-disabled`, leave the tab order and arrow-key path, and draw no remove button.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`

### UIC-TAG-GROUP-2.4 - Selection

With `selectionMode` (`single` or `multiple`), pressing a tag shall select it: `selectedKeys` or `defaultSelectedKeys`, tag keys or `'all'`, with `onSelectionChange`, called with the shared `Selection` (a set of keys or `'all'`), hold the selection, `disallowEmptySelection` keeps one tag selected, and selected tags publish `data-selected` and `aria-selected`.

Implementation: `src/components/tag-group/tag-group.tsx`
Verification: `src/components/tag-group/tag-group.test.tsx`

## Hooks

| Hook                   | Kind      | Values                                            | Description                                                               |
| ---------------------- | --------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| `ui-tag-group`         | root      |                                                   | The group's `<div>`.                                                      |
| `ui-tag-group__list`   | slot      |                                                   | The list of tags (`role="grid"`, or `group` while empty).                 |
| `ui-tag-group__tag`    | slot      |                                                   | One tag (`role="row"`).                                                   |
| `ui-tag-group__label`  | slot      |                                                   | A tag's content.                                                          |
| `ui-tag-group__remove` | slot      |                                                   | A tag's remove button (also `ui-icon-button`).                            |
| `ui-tag-group__empty`  | slot      |                                                   | The empty state inside the list.                                          |
| `data-size`            | attribute | `sm`, `md`, `lg`                                  | On the root: the tags' scale.                                             |
| `data-tone`            | attribute | `neutral`, `info`, `success`, `warning`, `danger` | On a tag: its tone.                                                       |
| `data-key`             | attribute |                                                   | On a tag: its `id`, written by React Aria.                                |
| `data-collection`      | attribute |                                                   | React Aria's collection identifier on the list and tags; not for styling. |
| `data-selection-mode`  | attribute | `single`, `multiple`                              | On a tag: the group's selection mode, when it has one (React Aria).       |
| `data-empty`           | state     | `true`                                            | On the list: it holds no tag (React Aria).                                |
| `data-allows-removing` | state     | `true`                                            | On a tag: the group has `onRemove` (React Aria).                          |
| `data-selected`        | state     | `true`                                            | On a tag: selected (React Aria).                                          |
| `data-disabled`        | state     | `true`                                            | On a tag: disabled (React Aria).                                          |
| `data-hovered`         | state     | `true`                                            | On a tag: under the pointer, when it can be selected (React Aria).        |
| `data-pressed`         | state     | `true`                                            | On a tag: being pressed (React Aria).                                     |
| `data-focused`         | state     | `true`                                            | On the list or a tag: focused (React Aria).                               |
| `data-focus-visible`   | state     | `true`                                            | On the list or a tag: focused from the keyboard (React Aria).             |
