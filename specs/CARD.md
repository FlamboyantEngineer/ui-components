# Card

`Card` is a framed container for a self-contained group of content: a settings section, a dashboard widget, a record tile or a tool panel. It draws an optional header (a title block with a description and actions, or custom header content), a body and an optional footer. Grouping without a frame belongs to layout; a region with nothing to show is an [Empty State](EMPTY-STATE.md).

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

## UIC-CARD-2 - Options

### UIC-CARD-2.1 - Variants

`variant` shall publish `data-variant`: `default` (content on the page) or `panel` (a chrome region, on a muted surface in the reference sheet).

Implementation: `src/components/card/card.tsx`, `labs/reference.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.2 - Densities

`density` shall publish `data-density`: `default` (the header, body and footer keep their own insets), `comfortable`, `compact` or `tight`, which give the card one interior padding instead, so a host never layers padding around the parts. The reference sheet uses 10, 8 and 4 pixel interiors.

Implementation: `src/components/card/card.tsx`, `labs/reference.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.3 - Selected

`isSelected` shall publish `data-selected` for the current card, such as a selected record, so the stylesheet draws a selection edge. The card offers no disabled, loading or invalid state; the control that selects a card exposes the selection to assistive technology.

Implementation: `src/components/card/card.tsx`, `labs/reference.css`
Verification: `src/components/card/card.test.tsx`, `e2e/card.spec.ts`

### UIC-CARD-2.4 - Layout options

`interactive` shall publish `data-interactive` (a hover affordance for a card inside a link or button), `flush` `data-flush` (set into a surrounding frame), `fill` `data-fill` (the body is a canvas that grows to the card's height and owns its interior) and `fullWidth` `data-full-width`.

Implementation: `src/components/card/card.tsx`, `labs/reference.css`
Verification: `src/components/card/card.test.tsx`

### UIC-CARD-2.5 - Hooks and caller attributes

`Card` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `hidden` to its root, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/card/card.tsx`
Verification: `src/components/card/card.test.tsx`

## Hooks

| Hook                   | Kind      | Values                                       | Description                                       |
| ---------------------- | --------- | -------------------------------------------- | ------------------------------------------------- |
| `ui-card`              | root      |                                              | The `<section>`.                                  |
| `ui-card__header`      | slot      |                                              | The `<header>`, when the card has header content. |
| `ui-card__heading`     | slot      |                                              | Groups the title and description.                 |
| `ui-card__title`       | slot      |                                              | The title heading.                                |
| `ui-card__description` | slot      |                                              | Supporting text under the title.                  |
| `ui-card__actions`     | slot      |                                              | Trailing header controls or status.               |
| `ui-card__body`        | slot      |                                              | The body.                                         |
| `ui-card__footer`      | slot      |                                              | The `<footer>`.                                   |
| `data-variant`         | attribute | `default`, `panel`                           | Surface.                                          |
| `data-density`         | attribute | `default`, `comfortable`, `compact`, `tight` | Interior padding.                                 |
| `data-selected`        | state     | `true`                                       | The current card.                                 |
| `data-interactive`     | state     | `true`                                       | Answers to a pointer.                             |
| `data-flush`           | state     | `true`                                       | Set into a surrounding frame.                     |
| `data-fill`            | state     | `true`                                       | The body grows to the card's height.              |
| `data-full-width`      | state     | `true`                                       | Fills the container's width.                      |
