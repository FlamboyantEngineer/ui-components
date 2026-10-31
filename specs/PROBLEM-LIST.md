# Problem List

`ProblemList` summarises validation problems at the top of a long form or document: a heading, the count of errors and warnings, and each problem with its severity, the label of its field and its message. Picking a problem moves focus to its field. Inside a [Form](FORM.md) it lists the problems the form's fields show and follows them as they change; it also lists problems a caller gives (`ProblemListItem`: an id, a message, and optionally a severity, a label and the id of the element to focus), such as the checks of a document.

## UIC-PROBLEM-LIST-1 - Problems

### UIC-PROBLEM-LIST-1.1 - Summary

`ProblemList` shall render a `<section>` (`ui-problem-list`) named by its heading (`ui-problem-list__title`, `title` or the provider string `problems`, one level below the enclosing section's (down to 6), else level 3), the count of errors and warnings (`ui-problem-list__summary`, provider string `problemCount`) and a list (`ui-problem-list__items`) with one `ui-problem-list__item` per problem, carrying `data-severity`. The root publishes `data-severity` with the worst severity listed (`error`, else `warning`) and `data-empty` while there is no problem, when the list is left out and the count reads `No problems`.

Implementation: `src/components/problem-list/problem-list.tsx`, `src/components/problem-list/problem-list-items.tsx`, `src/core/strings.ts`
Verification: `src/components/problem-list/problem-list.test.tsx`, `e2e/problem-list.spec.ts`

### UIC-PROBLEM-LIST-1.2 - One problem

Each problem shall show the glyph of its severity (`ui-problem-list__icon`, `error` or `warning`, decorative), its severity in words for assistive technology (provider string `problemSeverity`), its `label` when it has one (`ui-problem-list__label`) and its `message` (`ui-problem-list__message`), separated by a space in the text so they read as words without a stylesheet. Nothing but phrasing content goes inside the jump button. A problem without a severity is an `error`.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/problem-list/problem-list-items.tsx`, `src/core/strings.ts`
Verification: `src/components/problem-list/problem-list.test.tsx`

### UIC-PROBLEM-LIST-1.3 - Jump to the field

A problem that can be reached shall be a `Button` (`ui-problem-list__jump`) holding its text: pressing it moves focus to the element whose id is its `targetId` in the list's own tree (its shadow root, else its document, a frame's for a list rendered there), or to its field's control inside a form, then calls `onAction` with its id. A problem with neither a target nor `onAction` is plain text.

Implementation: `src/components/problem-list/problem-list-items.tsx`, `src/components/problem-list/problem-list.tsx`
Verification: `src/components/problem-list/problem-list.test.tsx`, `e2e/problem-list.spec.ts`

### UIC-PROBLEM-LIST-1.4 - The problems of a form

Without `problems`, a list inside a `Form` shall list every issue the form's fields show, in document order, labelled by the field's label (UIC-FORM-1.7), and follow them as fields show, change or clear their issues and as fields mount and unmount: in the form's default `submit` validation mode it fills on the first submit and empties as the reader fixes the fields. `problems` wins over the form's; outside a form, a list without `problems` is empty.

Implementation: `src/components/problem-list/problem-list.tsx`, `src/components/form/form-problems.ts`
Verification: `src/components/problem-list/problem-list.test.tsx`, `e2e/problem-list.spec.ts`

## UIC-PROBLEM-LIST-2 - Accessibility and hooks

### UIC-PROBLEM-LIST-2.1 - Announced counts

The count shall be a `status` live region that stays in the document, so a change in the number of problems, including the last one going, is announced politely; a problem's severity is read as text, never by its glyph alone.

Implementation: `src/components/problem-list/problem-list.tsx`, `src/components/problem-list/problem-list-items.tsx`
Verification: `src/components/problem-list/problem-list.test.tsx`, `e2e/problem-list.spec.ts`

### UIC-PROBLEM-LIST-2.2 - Hooks and caller attributes

`ProblemList` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on its root.

Implementation: `src/components/problem-list/problem-list.tsx`
Verification: `src/components/problem-list/problem-list.test.tsx`

## Hooks

| Hook                       | Kind  | Values             | Description                                                          |
| -------------------------- | ----- | ------------------ | -------------------------------------------------------------------- |
| `ui-problem-list`          | root  |                    | The `<section>`.                                                     |
| `ui-problem-list__title`   | slot  |                    | The heading.                                                         |
| `ui-problem-list__summary` | slot  |                    | The count of errors and warnings (`role="status"`).                  |
| `ui-problem-list__items`   | slot  |                    | The list of problems (`<ul>`).                                       |
| `ui-problem-list__item`    | slot  |                    | One problem (`<li>`).                                                |
| `ui-problem-list__jump`    | slot  |                    | The button that moves focus to a problem's field (also `ui-button`). |
| `ui-problem-list__icon`    | slot  |                    | A problem's severity glyph (also `ui-icon`).                         |
| `ui-problem-list__label`   | slot  |                    | A problem's field label.                                             |
| `ui-problem-list__message` | slot  |                    | A problem's message.                                                 |
| `data-severity`            | state | `error`, `warning` | On the root, the worst severity listed; on an item, its own.         |
| `data-empty`               | state | `true`             | On the root, while there is no problem.                              |
