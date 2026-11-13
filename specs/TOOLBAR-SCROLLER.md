# Toolbar Scroller

`ToolbarScroller` holds one row of tools that scrolls horizontally when it is too narrow, instead of squeezing the tools over each other. Its strip is a React Aria `Toolbar`, so the tools take arrow-key focus. At an edge past which tools are hidden it shows, by default, a scroll button and, when asked with `showEdgeFades`, a decorative fade. With tools described as data it can instead move the tools that do not fit into a "more" menu, by priority.

## UIC-TOOLBAR-SCROLLER-1 - Row and toolbar

### UIC-TOOLBAR-SCROLLER-1.1 - One scrolling row

`ToolbarScroller` shall render its children as direct children of one strip element (`ui-toolbar-scroller__strip`), in their order and at their natural size. The stylesheet makes the strip scroll horizontally; the reference sheet hides its scrollbar and keeps every tool at its natural width. Wrapping is not an option: a row of tools that should wrap does not use the scroller.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `labs/reference/toolbar-scroller.css`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-1.2 - Toolbar semantics and keyboard

The strip shall be a React Aria `Toolbar`: `role="toolbar"` with horizontal `aria-orientation` and `data-orientation`, named by `aria-label` or `aria-labelledby`. Arrow Left and Arrow Right move focus between the tools (mirrored in right-to-left locales), Tab leaves the toolbar, and focus returning to the toolbar goes back to the tool that last had it. Inside a text control in the toolbar (a text input, a slider or select, a text area, editable content, or an element with role `textbox` or `combobox`) the arrow keys move the caret and move focus only from the end of the text they point to, with no modifier held (Shift, Alt, Control or Meta arrows stay with the control) and no input method composing; a field among several in a group, such as the cells of a `PinInput`, moves between them first. Inside another `role="toolbar"` element the strip becomes a `group` and leaves keyboard handling to the outer toolbar.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `src/utils/toolbar-caret-keys.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`, `src/utils/toolbar-caret-keys.test.tsx`

### UIC-TOOLBAR-SCROLLER-1.3 - Hooks and caller attributes

`ToolbarScroller` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`

## UIC-TOOLBAR-SCROLLER-2 - Overflow

### UIC-TOOLBAR-SCROLLER-2.1 - Overflow edges

The root shall publish `data-overflow-start` while content lies more than one pixel past the strip's start edge and `data-overflow-end` while content lies past its end edge, in either writing direction, as the [scroll strip hook](SCROLL-STRIP.md) measures them. Both are recomputed, within an animation frame, when the strip scrolls, when a scroll button moves it, when the strip or one of its direct children resizes, and when a direct child mounts or unmounts. This holds as well for a strip that mounts after the first render, as after a switch from `overflow="menu"` to `"scroll"`.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-2.2 - Edge fades

Edge fades shall be opt-in. With `showEdgeFades`, the scroller shall render one decorative fade per edge (`ui-toolbar-scroller__fade` with `data-edge` `start` or `end`), hidden from assistive technology, and hide each with the native `hidden` attribute while its edge hides nothing. By default it renders none. The reference sheet draws each fade over the strip's edge without taking pointer input.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `labs/reference/toolbar-scroller.css`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-2.3 - Scroll buttons

Unless `scrollButtons` is `false`, the scroller shall render a scroll button per edge (`ui-toolbar-scroller__scroll-button`, an [Icon Button](BUTTON.md) with `data-edge` `start` or `end`), hidden with the native `hidden` attribute while its edge hides nothing. Pressing one scrolls the strip by 80% of its visible width toward that edge. The buttons are named by the provider's `scrollBackward` and `scrollForward` strings, draw a chevron pointing to their edge (mirrored right-to-left), sit outside the toolbar and stay out of the tab order, because keyboard users reach every tool with the arrow keys. With `scrollButtons={false}` only the fades, when asked for, mark hidden tools; the root's `data-overflow-start` and `data-overflow-end` always do.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-2.4 - Wheel input

Wheel input over the strip shall scroll it along the row by the dominant wheel axis (downward toward the end edge, mirrored right to left), converting line and page deltas to pixels, as the [scroll strip hook](SCROLL-STRIP.md) does, and keep the page from scrolling while the strip overflows, at both of its bounds too, so the pointer over the strip never scrolls the page. A strip that fits leaves the wheel to the page. Wheel input with Control or Meta held is left to the browser, and a wheel over a menu, listbox or dialog open inside the strip keeps scrolling that popup. A strip that mounts after the first render takes wheel input too.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`

### UIC-TOOLBAR-SCROLLER-2.5 - Focused tool stays in view

When a tool in the strip receives focus, the strip shall scroll so that the tool lies clear of the visible scroll buttons and fades that cover the strip's edges.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

## UIC-TOOLBAR-SCROLLER-3 - Overflow menu

### UIC-TOOLBAR-SCROLLER-3.1 - Tools as data

`items` (each with an `id` and a `label`) and `renderItem(item)` shall draw the tools in place of `children`, each in a `ui-toolbar-scroller__item` element that is a direct child of the strip, in their order and keyed by `id`. `overflow` publishes `data-overflow` on the root: `scroll` (the default), or `menu`.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`

### UIC-TOOLBAR-SCROLLER-3.2 - Collapsing into a menu by priority

With `overflow="menu"` and `items`, the strip shall render only the tools that fit, each in a `ui-toolbar-scroller__item` element, as [`useOverflowItems`](OVERFLOW-LIST.md) measures them: tools with a higher `priority` stay longest, and tools of the same priority leave from the end, keeping their order. Tools compare by `id`, so a host that builds `items` on each render is not measured afresh each time. While tools are hidden, a `ui-toolbar-scroller__overflow` element at the end of the strip holds an icon-only [Dropdown Menu](DROPDOWN-MENU.md) named by the provider's `moreItems` text with the count, listing the hidden tools by `label` with their `icon` and `isDisabled`; choosing one runs its `onAction`. The menu button is part of the toolbar, so the arrow keys reach it. The strip does not scroll, so no fades or scroll buttons render.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `src/utils/use-overflow-items.ts`, `labs/reference/toolbar-scroller.css`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-3.3 - Changing the overflow mode

Both overflow modes shall draw the tools in the same strip element, so a change of `overflow` either way, or of `scrollButtons`, keeps every tool that stays visible mounted, with its state, uncontrolled values and focus; only the scroll buttons, fades and overflow menu come and go around them. When the tool holding focus collapses into the overflow menu, or leaves `items`, focus moves to the next tool, else the overflow menu's button, else the previous tool, so it never falls to the page.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `src/utils/use-overflow-focus.ts`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

## Hooks

| Hook                                 | Kind      | Values           | Description                                             |
| ------------------------------------ | --------- | ---------------- | ------------------------------------------------------- |
| `ui-toolbar-scroller`                | root      |                  | The `<div>` around the strip, fades and scroll buttons. |
| `ui-toolbar-scroller__strip`         | slot      |                  | The scrolling `role="toolbar"` holding the tools.       |
| `ui-toolbar-scroller__item`          | slot      |                  | One tool drawn from `items`.                            |
| `ui-toolbar-scroller__overflow`      | slot      |                  | The element holding the menu of hidden tools.           |
| `ui-toolbar-scroller__fade`          | slot      |                  | A decorative fade over one edge.                        |
| `ui-toolbar-scroller__scroll-button` | slot      |                  | A scroll button (also `ui-button`).                     |
| `data-edge`                          | attribute | `start`, `end`   | The edge a fade or scroll button belongs to.            |
| `data-overflow`                      | attribute | `scroll`, `menu` | What happens to tools that do not fit.                  |
| `data-overflow-start`                | state     | `true`           | Content is hidden past the start edge.                  |
| `data-overflow-end`                  | state     | `true`           | Content is hidden past the end edge.                    |
| `data-orientation`                   | state     | `horizontal`     | The strip's orientation (React Aria).                   |
