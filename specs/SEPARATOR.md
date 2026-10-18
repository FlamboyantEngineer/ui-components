# Separator

`Separator` draws a rule between groups of content: sections of a page, groups of fields, items in a row of links. It is built on React Aria's `Separator`, which owns the `separator` role and its orientation. It is horizontal or vertical, takes a line style, and may carry a label drawn across the line ("or", a date, a section name), with a start and an end line on either side. A rule that only adds visual rhythm can be decorative, which removes it from the accessibility tree. The separators of [Toolbar Row](LAYOUT.md#uic-layout-37---toolbar-groups-and-separators) and [Menu](MENU.md#uic-menu-32---separators) are separators too ([UIC-SEPARATOR-4.1](#uic-separator-41---separators-of-other-components)); the decorative dividers between `Stack` and `Cluster` children are not, since their element follows the parent's content model ([UIC-LAYOUT-2.7](LAYOUT.md#uic-layout-27---dividers)).

## UIC-SEPARATOR-1 - Contract

### UIC-SEPARATOR-1.1 - Element

`Separator` shall render React Aria's `Separator`: an `<hr>` by default, a `<div>` when it is vertical or labelled (an `<hr>` can hold neither), or the element `elementType` names. It holds no children unless labelled.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-1.2 - Orientation

`orientation` shall publish `data-orientation`: `horizontal` (the default), a rule across the block axis that the stylesheet stretches along the inline axis, or `vertical`, a rule between inline items that the stylesheet stretches to the height of its row.

Implementation: `src/components/separator/separator.tsx`, `labs/reference/separator.css`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-1.3 - Line styles

`variant` shall publish `data-variant`: `solid` (the default), `dashed` or `dotted`. The stylesheet draws the line in that style, on a labelled separator's start and end lines too.

Implementation: `src/components/separator/separator.tsx`, `labs/reference/separator.css`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-1.4 - Hooks and caller attributes

`Separator` shall carry the hooks below, append the caller's `className`, forward `id`, caller `data-*` attributes and React Aria's DOM props, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`

### UIC-SEPARATOR-1.5 - Element swapping

React Aria's `render` shall pass through ([COMPOSITION.md](COMPOSITION.md#uic-composition-11---react-aria-components)): it receives the element's finished props, with the hook classes and data attributes, the role and orientation (or `role="none"` when decorative) and, on a labelled separator, its lines and label as `children`.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`

## UIC-SEPARATOR-2 - Labels

### UIC-SEPARATOR-2.1 - Labelled separator

A separator given a non-empty `label` shall render, in order, a `ui-separator__start-line` slot, the label in a `ui-separator__label` slot and a `ui-separator__end-line` slot. The lines are empty and hidden from assistive technology; the stylesheet lays the three out along the separator's axis so a line runs on each side of the label.

Implementation: `src/components/separator/separator.tsx`, `labs/reference/separator.css`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-2.2 - Label position

`labelPosition` shall publish `data-label-position` on a labelled separator: `start`, `center` (the default) or `end`, where the label sits along the line in the writing direction. The stylesheet shortens the line on the label's side to a fixed inset. An unlabelled separator publishes no label position.

Implementation: `src/components/separator/separator.tsx`, `labs/reference/separator.css`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

## UIC-SEPARATOR-3 - Accessibility

### UIC-SEPARATOR-3.1 - Role and orientation

A separator shall have the `separator` role (implicit on an `<hr>`, set on other elements) and state `aria-orientation="vertical"` when vertical; a horizontal separator relies on the role's default orientation.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-3.2 - Name

A labelled separator shall be named by its label through `aria-labelledby`, so assistive technology announces the label with the separator even where it treats a separator's content as presentational. A caller's `aria-label` or `aria-labelledby` names it instead. An unlabelled separator has no name unless the caller gives one.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-3.3 - Keyboard

A separator shall take no focus and add no tab stop: it is static content that Tab and arrow-key navigation pass over, in toolbars and menus too.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

### UIC-SEPARATOR-3.4 - Decorative separators

`decorative` shall render the rule with `role="none"` and no orientation or name, for a rule that only adds visual rhythm between content whose structure is already conveyed (list items, cards under their own headings), as Radix's separator does. A decorative separator's label stays readable as plain text. It keeps its hooks.

Implementation: `src/components/separator/separator.tsx`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

## UIC-SEPARATOR-4 - Composition

### UIC-SEPARATOR-4.1 - Separators of other components

`ToolbarRowSeparator` and `MenuSeparator` shall render a `Separator`, so they carry `ui-separator`, `data-orientation` and `data-variant` beside their own hooks (`ui-toolbar-row__separator`, `ui-menu-separator`) and keep their roles, orientation and props. A stylesheet styles their own hooks over the generic separator; the reference sheet keeps its generic separator rules at zero specificity for that reason.

Implementation: `src/components/separator/separator.tsx`, `src/components/layout/toolbar-row.tsx`, `src/components/menu/menu-item.tsx`, `labs/reference/separator.css`
Verification: `src/components/separator/separator.test.tsx`, `e2e/separator.spec.ts`

## Hooks

| Hook                       | Kind      | Values                      | Description                                                  |
| -------------------------- | --------- | --------------------------- | ------------------------------------------------------------ |
| `ui-separator`             | root      |                             | The rule: `<hr>`, or `<div>` when vertical or labelled.      |
| `ui-separator__start-line` | slot      |                             | The line before a label.                                     |
| `ui-separator__label`      | slot      |                             | The label drawn across the line.                             |
| `ui-separator__end-line`   | slot      |                             | The line after a label.                                      |
| `data-orientation`         | attribute | `horizontal`, `vertical`    | Direction of the rule.                                       |
| `data-variant`             | attribute | `solid`, `dashed`, `dotted` | Line style.                                                  |
| `data-label-position`      | attribute | `start`, `center`, `end`    | Where a labelled separator's label sits; absent without one. |
