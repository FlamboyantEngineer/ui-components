# Toolbar Scroller

`ToolbarScroller` holds one row of tools that scrolls horizontally when it is too narrow, instead of squeezing the tools over each other. Its strip is a React Aria `Toolbar`, so the tools take arrow-key focus. At an edge past which tools are hidden it shows a decorative fade and, by default, a scroll button.

## UIC-TOOLBAR-SCROLLER-1 - Row and toolbar

### UIC-TOOLBAR-SCROLLER-1.1 - One scrolling row

`ToolbarScroller` shall render its children as direct children of one strip element (`ui-toolbar-scroller__strip`), in their order and at their natural size. The stylesheet makes the strip scroll horizontally; the reference sheet hides its scrollbar and keeps every tool at its natural width. Wrapping is not an option: a row of tools that should wrap does not use the scroller.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `labs/reference.css`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-1.2 - Toolbar semantics and keyboard

The strip shall be a React Aria `Toolbar`: `role="toolbar"` with horizontal `aria-orientation` and `data-orientation`, named by `aria-label` or `aria-labelledby`. Arrow Left and Arrow Right move focus between the tools (mirrored in right-to-left locales), Tab leaves the toolbar, and focus returning to the toolbar goes back to the tool that last had it. Inside another `role="toolbar"` element the strip becomes a `group` and leaves keyboard handling to the outer toolbar.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-1.3 - Hooks and caller attributes

`ToolbarScroller` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`

## UIC-TOOLBAR-SCROLLER-2 - Overflow

### UIC-TOOLBAR-SCROLLER-2.1 - Overflow edges

The root shall publish `data-overflow-start` while content lies more than one pixel past the strip's start edge and `data-overflow-end` while content lies past its end edge, in either writing direction. Both are recomputed when the strip scrolls, when the strip or one of its direct children resizes, and when a direct child mounts or unmounts.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-2.2 - Edge fades

The scroller shall render one decorative fade per edge (`ui-toolbar-scroller__fade` with `data-edge` `start` or `end`), hidden from assistive technology, and hide each with the native `hidden` attribute while its edge hides nothing. The reference sheet draws each fade over the strip's edge without taking pointer input.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`, `labs/reference.css`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-2.3 - Scroll buttons

Unless `scrollButtons` is `false`, the scroller shall render a scroll button per edge (`ui-toolbar-scroller__scroll-button`, an [Icon Button](ICON-BUTTON.md) with `data-edge` `start` or `end`), hidden with the native `hidden` attribute while its edge hides nothing. Pressing one scrolls the strip by 80% of its visible width toward that edge. The buttons are named by the provider's `scrollBackward` and `scrollForward` strings, draw a chevron pointing to their edge (mirrored right-to-left), sit outside the toolbar and stay out of the tab order, because keyboard users reach every tool with the arrow keys. With `scrollButtons={false}` only the fades mark hidden tools.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

### UIC-TOOLBAR-SCROLLER-2.4 - Wheel input

A vertical wheel over the strip shall scroll it along the row (downward toward the end edge), converting line and page deltas to pixels, and prevent the page from scrolling only while the strip moves. A strip at its bound, or one that fits, leaves the wheel to the page. Horizontal wheel input and wheel input with Control or Meta held are left to the browser. A wheel over a menu, listbox, dialog, tree or grid open inside the strip keeps scrolling that popup.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`

### UIC-TOOLBAR-SCROLLER-2.5 - Focused tool stays in view

When a tool in the strip receives focus, the strip shall scroll so that the tool lies clear of the visible scroll buttons and fades that cover the strip's edges.

Implementation: `src/components/toolbar-scroller/toolbar-scroller.tsx`
Verification: `src/components/toolbar-scroller/toolbar-scroller.test.tsx`, `e2e/toolbar-scroller.spec.ts`

## Hooks

| Hook                                 | Kind      | Values         | Description                                             |
| ------------------------------------ | --------- | -------------- | ------------------------------------------------------- |
| `ui-toolbar-scroller`                | root      |                | The `<div>` around the strip, fades and scroll buttons. |
| `ui-toolbar-scroller__strip`         | slot      |                | The scrolling `role="toolbar"` holding the tools.       |
| `ui-toolbar-scroller__fade`          | slot      |                | A decorative fade over one edge.                        |
| `ui-toolbar-scroller__scroll-button` | slot      |                | A scroll button (also `ui-icon-button`).                |
| `data-edge`                          | attribute | `start`, `end` | The edge a fade or scroll button belongs to.            |
| `data-overflow-start`                | state     | `true`         | Content is hidden past the start edge.                  |
| `data-overflow-end`                  | state     | `true`         | Content is hidden past the end edge.                    |
| `data-orientation`                   | state     | `horizontal`   | The strip's orientation (React Aria).                   |
