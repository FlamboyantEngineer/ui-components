# Card

`Card` is a framed container for a self-contained group of content: a settings section, a dashboard widget, a record tile or a tool panel. It draws optional media, an optional header (a title block with a description and actions, or custom header content), a body and an optional footer. With `href` or `onAction` the whole card is a link or press target. `CardGrid` arranges cards as a navigable, selectable collection. Grouping without a frame belongs to layout, or to a [Section](SECTION-HEADER.md) whose header matches a card's title block; a region with nothing to show is an [Empty State](EMPTY-STATE.md).

## UIC-CARD-1 - Structure

### UIC-CARD-1.1 - Parts

`Card` shall render a `<section>` holding a `<header>` in the `ui-card__header` slot when it has header content, its children in the `ui-card__body` slot (always), and `footer` in a `<footer>` in the `ui-card__footer` slot when given. A card without header content renders no header.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-1.2 - Title block

The header shall hold the `title` as a heading (level 3 unless `headingLevel` chooses 1 to 6) in the `ui-card__title` slot and the `description` in the `ui-card__description` slot, both inside a `ui-card__heading` group, followed by `actions` in the `ui-card__actions` slot. Empty values (`undefined`, `null`, `false` or `""`) render no slot. `header` replaces the title block and actions with the caller's own content.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-1.3 - Region name and roles

A card with a `title` shall be named by it through `aria-labelledby` and a heading ID that is unique per instance and stable across renders, so it is a region a reader can navigate to; the description and actions stay outside the name. A caller's `aria-label` or `aria-labelledby` replaces that name, and a caller `role` (the role a surrounding collection gives its items) passes through. The card itself takes no focus: a card that opens something sits inside the link or button that does.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-1.4 - Slotted title in a custom header

Custom `header` content shall receive the title's props through React Aria's `HeadingContext` under the `title` slot ([COMPOSITION.md](COMPOSITION.md#uic-composition-31---slot-props)): a React Aria `Heading` with `slot="title"`, or a host component that reads `useSlottedContext(HeadingContext, 'title')`, gets the title's `id`, the `ui-card__title` class and a `ref`. Once that element renders, the card is named by it as by its own title ([UIC-CARD-1.3](#uic-card-13---region-name-and-roles)); without one the card has no name of its own, and a caller's `aria-label` or `aria-labelledby` still wins. A `Heading` without a slot gets nothing.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

## UIC-CARD-2 - Options

### UIC-CARD-2.1 - Variants

`variant` shall publish `data-variant`: `default` (content on the page) or `panel` (a chrome region, on a muted surface in the reference sheet).

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.2 - Densities

`density` shall publish `data-density`: `default` (the header, body and footer keep their own insets), `comfortable`, `compact` or `tight`, which give the card one interior padding instead, so a host never layers padding around the parts. The reference sheet uses 10, 8 and 4 pixel interiors.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.3 - Selected

`isSelected` shall publish `data-selected` for the current card, such as a selected record, so the stylesheet draws a selection edge. The card offers no disabled, loading or invalid state; the control that selects a card exposes the selection to assistive technology.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.4 - Layout options

`interactive` shall publish `data-interactive` (a hover affordance for a card inside a link or button), `flush` `data-flush` (set into a surrounding frame), `fill` `data-fill` (the body is a canvas that grows to the card's height and owns its interior) and `fullWidth` `data-full-width`.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`

### UIC-CARD-2.5 - Hooks and caller attributes

`Card` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `hidden` to its root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`

## UIC-CARD-3 - Whole-card action

### UIC-CARD-3.1 - Title action

With `href`, the card's title shall render inside its heading as a link in the `ui-card__action` slot, drawn through the provider's link renderer with `target` and `rel` (`target="_blank"` adds `rel="noopener noreferrer"` unless `rel` is given). With `onAction` and no `href`, the title shall render as a React Aria `Button` in the same slot that calls `onAction` on pointer, Enter and Space activation; with both, following the link also calls `onAction`. The action is named by the title, the card stays a region named by its title, and the card publishes `data-interactive`.

Implementation: `src/components/card/card.tsx`, `src/components/card/card-action.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-3.2 - Pressing the card

A pointer click anywhere on a card with an action shall activate the action, with the same button and modifier keys, unless the click lands in an inner control (a link, a button, a form control or label, or an element with a widget role or a tab stop of its own), was already handled (`preventDefault`), or ends a text selection inside the card. Inner controls keep their own behaviour, and keyboard users reach the action and each inner control as separate tab stops.

Implementation: `src/components/card/card-action.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-3.3 - Slotted action in a custom header

Custom `header` content shall receive the action's props through React Aria's slot contexts under the `action` slot ([COMPOSITION.md](COMPOSITION.md#uic-composition-31---slot-props)): `LinkContext` for `href` (the address, `target`, `rel` and `onAction` as its press handler) and `ButtonContext` for `onAction` alone, each with the `ui-card__action` class and a ref the card registers. A React Aria `Link` or `Button` with `slot="action"` then becomes the action that clicks on the card activate; elements without that slot get nothing.

Implementation: `src/components/card/card-action.tsx`, `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`

## UIC-CARD-4 - Media and loading

### UIC-CARD-4.1 - Media

`media` shall render in the `ui-card__media` slot as the card's first part, before the header, for a cover image or preview that the stylesheet draws edge to edge. An empty value renders no slot.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-4.2 - Loading skeleton

`isLoading` shall publish `data-loading`, set `aria-busy="true"` and replace the body's content with a decorative `ui-card__skeleton` slot hidden from assistive technology, which the stylesheet draws as placeholder lines. The media, header and footer stay. Without it neither attribute renders.

Implementation: `src/components/card/card.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

## UIC-CARD-5 - Card collections

### UIC-CARD-5.1 - Grid

`CardGrid` shall render React Aria's `GridList` in its `grid` layout with the `ui-card-grid` root, and `CardGridItem` a `GridListItem` with the `ui-card-grid-item` root around its content, usually a `Card` that takes `role="group"` from the caller ([UIC-CARD-1.3](#uic-card-13---region-name-and-roles)). Arrow keys move focus between cards in two dimensions by their positions on screen (in a `WaterfallLayout`, Left and Right move by position and Up and Down in collection order), Home and End reach the first and last card, and typing moves to the card whose `textValue` starts with the typed text. The grid needs an `aria-label` or `aria-labelledby`.

Implementation: `src/components/card/card-grid.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-5.2 - Collection children

`CardGrid` shall pass React Aria's collection props and children through ([COLLECTIONS.md](COLLECTIONS.md)): `items` with a render function, `renderEmptyState` (publishing `data-empty`), a `Virtualizer` around the grid with `GridLayout` or `WaterfallLayout` for a waterfall of cards of different heights, and a `GridListLoadMoreItem` after the items that loads more as it scrolls into view.

Implementation: `src/components/card/card-grid.tsx`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-5.3 - Selectable cards

`selectionMode` (`single` or `multiple`), `selectedKeys`, `defaultSelectedKeys` and `onSelectionChange` shall select cards with the pointer and with Space, as React Aria's grid list does, and items publish React Aria's `data-selected`. While the grid selects with toggles (the default `selectionBehavior`), each item draws a selection [Checkbox](CHECKBOX.md) in the `ui-card-grid-item__checkbox` slot before its content, which React Aria names after the item. An item's render function receives `isSelected`, which a card draws through its own `isSelected`.

Implementation: `src/components/card/card-grid.tsx`, `labs/reference/card.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-5.4 - Card actions in a grid

`onAction` on the grid or on an item, and `href` on an item, shall act on a card as React Aria's grid list does: with toggle selection, Enter or a press opens the card while no card is selected, and selects once some are; so a card collection opens a card without nesting a link inside each card.

Implementation: `src/components/card/card-grid.tsx`
Verification: `src/components/card/card.test.tsx`

## Hooks

| Hook                          | Kind      | Values                                       | Description                                            |
| ----------------------------- | --------- | -------------------------------------------- | ------------------------------------------------------ |
| `ui-card`                     | root      |                                              | The `<section>`.                                       |
| `ui-card__media`              | slot      |                                              | Full-bleed media before the header.                    |
| `ui-card__header`             | slot      |                                              | The `<header>`, when the card has header content.      |
| `ui-card__heading`            | slot      |                                              | Groups the title and description.                      |
| `ui-card__title`              | slot      |                                              | The title heading.                                     |
| `ui-card__action`             | slot      |                                              | The title's link or button, or the slotted action.     |
| `ui-card__description`        | slot      |                                              | Supporting text under the title.                       |
| `ui-card__actions`            | slot      |                                              | Trailing header controls or status.                    |
| `ui-card__body`               | slot      |                                              | The body.                                              |
| `ui-card__skeleton`           | slot      |                                              | The decorative placeholder while loading.              |
| `ui-card__footer`             | slot      |                                              | The `<footer>`.                                        |
| `ui-card-grid`                | root      |                                              | The card collection (`role="grid"`).                   |
| `ui-card-grid-item`           | root      |                                              | One item of the collection (`role="row"`).             |
| `ui-card-grid-item__checkbox` | slot      |                                              | The selection checkbox (also `ui-checkbox`).           |
| `data-variant`                | attribute | `default`, `panel`                           | Surface.                                               |
| `data-density`                | attribute | `default`, `comfortable`, `compact`, `tight` | Interior padding.                                      |
| `data-selected`               | state     | `true`                                       | The current card, or a selected item (React Aria).     |
| `data-loading`                | state     | `true`                                       | The card's content is loading.                         |
| `data-layout`                 | state     | `grid`                                       | The grid's layout (React Aria).                        |
| `data-empty`                  | state     | `true`                                       | The grid has no items (React Aria).                    |
| `data-focused`                | state     | `true`                                       | Focus on the grid or an item (React Aria).             |
| `data-focus-visible`          | state     | `true`                                       | Keyboard focus on the grid or an item (React Aria).    |
| `data-hovered`                | state     | `true`                                       | Pointer over an item (React Aria).                     |
| `data-pressed`                | state     | `true`                                       | An item being pressed (React Aria).                    |
| `data-disabled`               | state     | `true`                                       | A disabled item (React Aria).                          |
| `data-selection-mode`         | state     | `single`, `multiple`                         | The grid's selection mode, on items (React Aria).      |
| `data-focus-visible-within`   | state     | `true`                                       | Keyboard focus inside an item (React Aria).            |
| `data-orientation`            | state     | `vertical`                                   | The grid's orientation (React Aria).                   |
| `data-collection`             | state     |                                              | React Aria's collection marker, on the grid and items. |
| `data-key`                    | state     |                                              | An item's `id` (React Aria).                           |
| `data-interactive`            | state     | `true`                                       | Answers to a pointer.                                  |
| `data-flush`                  | state     | `true`                                       | Set into a surrounding frame.                          |
| `data-fill`                   | state     | `true`                                       | The body grows to the card's height.                   |
| `data-full-width`             | state     | `true`                                       | Fills the container's width.                           |
