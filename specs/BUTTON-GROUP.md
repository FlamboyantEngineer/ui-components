# Button Group

`ButtonGroup` holds a few related [Buttons](BUTTON.md), [Icon Buttons](BUTTON.md) or [Dropdown Menu](DROPDOWN-MENU.md) triggers in one labelled group, built on React Aria's `Group`. Its `density` spaces them apart or joins them into one attached control, `orientation` lays them out in a row or a column, and `justified` shares the group's length between them. Every button keeps its own tab stop; a row of tools that is one tab stop with arrow-key focus is a toolbar ([Action Row](ACTION-ROW.md), [Toolbar Scroller](TOOLBAR-SCROLLER.md)).

## UIC-BUTTON-GROUP-1 - Group

### UIC-BUTTON-GROUP-1.1 - Labelled group

`ButtonGroup` shall render its children, in order, inside one element with role `group` named by `aria-label` or `aria-labelledby`. It changes nothing about the buttons: each keeps its own variant, size, states and tab stop. The root publishes `data-hovered`, `data-focus-within` and `data-focus-visible` while the pointer is over it or focus is inside it.

Implementation: `src/components/button-group/button-group.tsx`
Verification: `src/components/button-group/button-group.test.tsx`, `e2e/button-group.spec.ts`

### UIC-BUTTON-GROUP-1.2 - Density

`density` shall publish `data-density`: `default` (the default) and `compact` space the buttons apart, and `attached` joins them into one control. The reference sheet draws 8 and 2 pixel gaps, and for `attached` no gap, one shared border between neighbours and rounded corners only at the group's ends. On a shared edge a hovered button is drawn above its resting neighbours, a selected button above a hovered one, so its whole border shows at rest and while a neighbour is hovered, and a keyboard-focused button above all, so its focus ring is never covered, in either orientation and direction, enabled or disabled.

Implementation: `src/components/button-group/button-group.tsx`, `labs/reference/button-group.css`
Verification: `src/components/button-group/button-group.test.tsx`, `e2e/button-group.spec.ts`

### UIC-BUTTON-GROUP-1.3 - Orientation and justification

`orientation` (`horizontal` by default, or `vertical`) shall publish `data-orientation`, and the reference sheet lays the buttons out in a row or a column. `justified` shall publish `data-justified`, and the reference sheet stretches the group to its container and gives every button an equal share of its length.

Implementation: `src/components/button-group/button-group.tsx`, `labs/reference/button-group.css`
Verification: `src/components/button-group/button-group.test.tsx`, `e2e/button-group.spec.ts`

### UIC-BUTTON-GROUP-1.4 - Hooks, caller attributes and swapping

`ButtonGroup` shall carry the hooks below, append the caller's `className`, forward caller `data-*` attributes, `id` and `ref` to its root, keep its own hook values over caller attributes of the same name, and take `render`, typed `ElementRender<'div', ButtonGroupRenderState>`, so the caller can swap the root `<div>` ([COMPOSITION.md](COMPOSITION.md)); the state holds `isHovered`, `isFocusWithin` and `isFocusVisible`.

Implementation: `src/components/button-group/button-group.tsx`
Verification: `src/components/button-group/button-group.test.tsx`, `e2e/button-group.spec.ts`

## Hooks

| Hook                 | Kind      | Values                           | Description                                      |
| -------------------- | --------- | -------------------------------- | ------------------------------------------------ |
| `ui-button-group`    | root      |                                  | The group (`<div role="group">`).                |
| `data-density`       | attribute | `default`, `compact`, `attached` | How close the buttons sit.                       |
| `data-orientation`   | attribute | `horizontal`, `vertical`         | Row or column.                                   |
| `data-justified`     | state     | `true`                           | The buttons share the group's length equally.    |
| `data-hovered`       | state     | `true`                           | The pointer is over the group (React Aria).      |
| `data-focus-within`  | state     | `true`                           | Focus is inside the group (React Aria).          |
| `data-focus-visible` | state     | `true`                           | Keyboard focus is inside the group (React Aria). |
