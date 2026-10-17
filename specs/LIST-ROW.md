# List Row

`List` and `ListRow` draw a native list of rows for generic lists: search results, recent items, notifications, file lists. Each row has one primary control (a link, a button or a focusable read-only body) holding its text, and optional trailing controls beside it. The list keeps a single tab stop and moves focus between rows with the arrow keys. `ListRowContent` draws a row's text alone, for an element that is itself the link.

## UIC-LIST-ROW-1 - List

### UIC-LIST-ROW-1.1 - Native list

`List` shall render a `<ul>` named by its `aria-label` or `aria-labelledby`, and each `ListRow` an `<li>`. Primary controls keep their native semantics: a link row's primary control is a link, an action row's a button, and a read-only row's a focusable element with no role.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.2 - One tab stop

Exactly one enabled row's primary control shall be in the tab sequence: the first row until focus enters the list, then the row that last held focus, including focus on one of its trailing controls. Moving focus between rows shall re-render only the row losing the tab stop and the row taking it.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.3 - Arrow navigation

ArrowDown and ArrowUp on a primary control shall move focus to the next or previous enabled row in document order, and Home and End to the first or last, without wrapping and without activating anything. Disabled rows are skipped. Keys pressed with a modifier, and keys pressed in trailing controls, keep their ordinary behaviour.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.4 - Boundary and requested focus

ArrowUp on the first row shall call `onNavigatePastStart` when it is set, so an associated search field can take focus back. `handleRef` shall receive `focusFirst()`, which focuses the first enabled row in the current document order, after keyed reorders included.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-1.5 - Focus recovery

When the row holding focus is removed, focus shall move to the nearest remaining row, preferring the next row at equal distance. A row whose primary control is replaced (an action row becoming read-only while it is renamed, and back) keeps focus on its new primary control. Focus that has left the list, including a blur with no related target, cancels the recovery. A removed tab-stop row leaves a remaining row in the tab sequence.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-1.6 - Pending and dividers

`isPending` shall set `aria-busy="true"` and `data-pending` on the list. `divided` shall publish `data-divided`, from which the stylesheet draws dividers between rows.

Implementation: `src/components/list-row/list-row.tsx`, `labs/reference.css`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-1.7 - List hooks and caller attributes

`List` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to the `<ul>`.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

## UIC-LIST-ROW-2 - Row

### UIC-LIST-ROW-2.1 - Primary control

A row with `href` shall render its primary control as a link, published as `data-kind="link"`. A row with `onPress` and no `href` shall render a React Aria button that runs `onPress` on click, Enter and Space (`action`). A row with neither shall render a focusable read-only element that offers no command (`static`).

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-2.2 - One link, nothing nested

A link row shall render exactly one link, holding the row's icon, title and meta, with no interactive element inside it. Trailing content shall render after the primary control as its sibling, never inside it. `ListRowContent` shall draw the same text with no control at all, for use inside an element that is itself the link or button.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`, `e2e/list-row.spec.ts`

### UIC-LIST-ROW-2.3 - Links through the provider

A link row shall render its link through the provider's link renderer with `href`, `target` and `rel`; `target="_blank"` adds `rel="noopener noreferrer"` unless `rel` is given. `onPress` shall run when the link is followed and `onAuxPress` on a middle-button click. The row never cancels a click, so modifier clicks keep their browser behaviour.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.4 - Row text

A row shall draw its `title` and, when it has content, its `meta` below it. An `icon` (a built-in glyph name or icon node) shall be drawn through `IconLabel`, beside both lines and taking the row's free width; it takes precedence over `leading`, decorative media drawn before the text and hidden from assistive technology.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.5 - Current row

`isCurrent` shall set `aria-current="page"` on a link row's link and `aria-current="true"` on other primary controls, and publish `data-current` on the row.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.6 - Disabled row

`isDisabled` shall publish `data-disabled` on the row, render a link row without its link, disable an action row's button, and leave the row out of the tab sequence and arrow navigation.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.7 - Tone

`tone` (`default`, `danger`) shall publish `data-tone` on the row, `default` when unset, for semantic emphasis such as an overdue item.

Implementation: `src/components/list-row/list-row.tsx`, `labs/reference.css`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.8 - Row hooks and caller attributes

`ListRow` and `ListRowContent` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes (and `id` for `ListRow`) to their root. The component's own attributes win over caller attributes of the same name.

Implementation: `src/components/list-row/list-row.tsx`
Verification: `src/components/list-row/list-row.test.tsx`

### UIC-LIST-ROW-2.9 - Reference layout

The reference sheet shall keep the title and the meta on one line each, ellipsized, and move trailing content below the text when the row is too narrow for both.

Implementation: `labs/reference.css`
Verification: `e2e/list-row.spec.ts`

## Hooks

| Hook                           | Kind      | Values                     | Description                                                   |
| ------------------------------ | --------- | -------------------------- | ------------------------------------------------------------- |
| `ui-list`                      | root      |                            | The `<ul>`.                                                   |
| `data-divided`                 | state     | `true`                     | Dividers between rows requested.                              |
| `data-pending`                 | state     | `true`                     | Rows are loading or updating.                                 |
| `ui-list-row`                  | root      |                            | The `<li>`.                                                   |
| `ui-list-row__primary`         | slot      |                            | The link, button or read-only body holding the row text.      |
| `ui-list-row__trailing`        | slot      |                            | Trailing controls, after the primary control.                 |
| `data-kind`                    | attribute | `link`, `action`, `static` | What the primary control is.                                  |
| `data-tone`                    | attribute | `default`, `danger`        | Semantic emphasis.                                            |
| `data-current`                 | state     | `true`                     | The current row.                                              |
| `data-disabled`                | state     | `true`                     | Disabled row, or the disabled action button (React Aria).     |
| `data-hovered`                 | state     | `true`                     | Pointer over an action row's button (React Aria).             |
| `data-pressed`                 | state     | `true`                     | An action row's button is pressed (React Aria).               |
| `data-focused`                 | state     | `true`                     | An action row's button has focus (React Aria).                |
| `data-focus-visible`           | state     | `true`                     | An action row's button has keyboard focus (React Aria).       |
| `ui-list-row-content`          | root      |                            | The row text: leading media or icon, title and meta.          |
| `ui-list-row-content__leading` | slot      |                            | Decorative leading media.                                     |
| `ui-list-row-content__text`    | slot      |                            | The title and meta lines (the `IconLabel` label with `icon`). |
| `ui-list-row-content__title`   | slot      |                            | The title line.                                               |
| `ui-list-row-content__meta`    | slot      |                            | The meta line.                                                |
