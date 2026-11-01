# Drawer

`Drawer` is a panel that slides in from an edge of the viewport over a page it blocks, for navigation, filters, details or a task that keeps the page in view: a title, an optional close button, a body and a footer, sharing [Modal](MODAL.md)'s vocabulary. It is built on React Aria's `SheetTrigger`, `SheetOverlay`, `SheetBackdrop`, `Sheet` and `SheetContent`, which slide it in and out by scrolling, so a swipe or a scroll toward its edge dismisses it natively, and provide snap points, nesting, the focus trap, Escape, outside presses, hiding the page from assistive technology and focus restoration.

## UIC-DRAWER-1 - Overlay

### UIC-DRAWER-1.1 - Trigger and opening

`DrawerTrigger` shall hold one pressable trigger, such as a `Button`, and a `Drawer`, and add no element of its own; pressing the trigger opens the drawer. `isOpen` with `onOpenChange`, on the trigger or on a drawer outside a trigger, controls it, `defaultOpen` opens it at first, and `onOpenChange` reports each change the reader asks for. While open the drawer renders, in an overlay at the end of the document body, the `ui-drawer` overlay covering the page, the `ui-drawer__backdrop`, the `ui-drawer__panel` that slides and the `ui-drawer__dialog` element with `role="dialog"` filling it. A closed drawer renders nothing.

Implementation: `src/components/drawer/drawer.tsx`, `src/components/portal/portal.tsx`, `src/components/modal/modal-presentations.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-1.2 - Position

`position` shall choose the viewport edge the panel rests against and slides in from: `end` (the default), `start`, `left`, `right`, `top` or `bottom`, with `start` and `end` the left and right edges in left-to-right text and the other way round in right-to-left text. The overlay, backdrop and panel publish the resolved edge in `data-position`.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-1.3 - Size

The overlay shall publish `size` in `data-size`: `sm`, `md` (the default) or `lg`, which the host stylesheet maps to the panel's width beside a side edge or its height against the top or bottom edge; the reference sheet uses 320, 400 and 560 pixels wide, kept 48 pixels short of the viewport, or 30, 50 and 80 percent of the viewport high. The stylesheet keeps the panel short of the whole viewport along the axis it slides on: React Aria's sheet only notices that it has left once it no longer touches the viewport's edge.

Implementation: `src/components/drawer/drawer.tsx`, `labs/reference/drawer.css`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-1.4 - Layering

The overlay shall carry the z-index of its overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)) as a functional inline style, so modals, popovers, menus, tooltips and toasts opened from a drawer stack above it; a `layerZIndex` from `PortalContainerProvider` or `PortalHost` applies. The layer is `drawer`, raised to the layer of the overlay the drawer is rendered in when that one stacks higher: a drawer opened from a modal's content takes the `modal` layer and, rendered after the modal, paints above its scrim and panel, as does a drawer opened from inside that drawer (and a `DockPanel`'s overlay drawer in a modal). `layer` sets it explicitly.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-1.5 - Entering and exiting

The panel shall slide in from its edge when the drawer opens and out toward it when it closes. The overlay and backdrop publish `data-entering` while it slides in, the overlay, backdrop and panel publish `data-exiting` while it slides out, and the drawer stays mounted until it has left the viewport.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

## UIC-DRAWER-2 - Dismissal

### UIC-DRAWER-2.1 - Escape

Escape pressed in the drawer shall close it, unless `isKeyboardDismissDisabled` is set or a component inside the drawer handles it itself, by stopping it or by calling `preventDefault`, such as an editor cancelling its draft; the next Escape it leaves alone closes the drawer. With drawers nested, Escape closes only the topmost.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-2.2 - Outside presses

A press outside the panel, such as on the backdrop, shall close the drawer, unless `isDismissable` is false or `shouldCloseOnInteractOutside` returns false for the element pressed.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-2.3 - Swiping

Swiping or scrolling the panel toward its edge until it has left the viewport shall close the drawer. `swipeDirection` chooses the direction (the drawer's edge by default, or `vertical` or `horizontal` for both ways along an axis), and the drawer publishes it in `data-swipe-direction` on the overlay, backdrop and panel.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-2.4 - Preventing dismissal

`isDismissDisabled` shall refuse every way of dismissing the drawer at once: Escape, outside presses and swiping past its smallest snap point are ignored, and the close button is disabled, for a task the reader must finish. The drawer's own content can still close it.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

## UIC-DRAWER-3 - Focus

### UIC-DRAWER-3.1 - Focus and blocking the page

Once the panel has slid in, focus shall move to the element inside it that has `autoFocus`, otherwise to the dialog element; Tab and Shift+Tab stay inside the drawer, and the page outside is hidden from assistive technology, inert and not scrollable. When the drawer closes, focus returns to the element focused when it opened, usually the trigger.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

## UIC-DRAWER-4 - Content

### UIC-DRAWER-4.1 - Title and close button

`title` shall render as the dialog's level-2 heading in the `ui-drawer__title` slot of the `ui-drawer__header` row and name the dialog. `showCloseButton` shall add a `Button` in the `ui-drawer__close` slot at the end of the header, named by the provider's `close` string and drawing its `close` glyph, that closes the drawer like Escape.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-4.2 - Body and footer

The children shall render in the `ui-drawer__body` slot after the header; children given as a function receive `close`, which closes the drawer. `footer` shall render in the `ui-drawer__footer` slot after the body. Without children or footer, their slot does not render.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-4.3 - Hooks and caller attributes

`Drawer` shall carry the hooks below, append the caller's `className` to the overlay, forward caller `data-*` attributes to the overlay and `id` to the dialog element, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`

## UIC-DRAWER-5 - Snap points and nesting

### UIC-DRAWER-5.1 - Snap points

`snapPoints` shall make the panel rest at each of the given amounts of itself left visible (numbers in pixels, percentages of the panel), opening at the first; swiping moves it between them, and past the smallest one closes it unless dismissal is prevented. The overlay, backdrop and panel publish `data-expanded` while the panel is fully revealed.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

### UIC-DRAWER-5.2 - Nested drawers

A drawer opened from inside another shall stack above it. Each publishes its place among the open drawers in `data-stack-index` (0 for the lowest) on its overlay, backdrop and panel, and a drawer with another open above it publishes `data-has-descendants`, so the stylesheet can recede it. Closing the top drawer returns focus inside the one beneath.

Implementation: `src/components/drawer/drawer.tsx`
Verification: `src/components/drawer/drawer.test.tsx`, `e2e/drawer.spec.ts`

## Hooks

| Hook                   | Kind      | Values                                                     | Description                                                         |
| ---------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `ui-drawer`            | root      |                                                            | The overlay covering the page.                                      |
| `ui-drawer__backdrop`  | slot      |                                                            | The backdrop behind the panel.                                      |
| `ui-drawer__panel`     | slot      |                                                            | The panel that slides in (React Aria `Sheet`).                      |
| `ui-drawer__dialog`    | slot      |                                                            | The `role="dialog"` element filling the panel.                      |
| `ui-drawer__header`    | slot      |                                                            | The header row.                                                     |
| `ui-drawer__title`     | slot      |                                                            | The `<h2>` title.                                                   |
| `ui-drawer__close`     | slot      |                                                            | The header close button (also `ui-button`).                         |
| `ui-drawer__body`      | slot      |                                                            | The body.                                                           |
| `ui-drawer__footer`    | slot      |                                                            | The footer.                                                         |
| `data-size`            | attribute | `sm`, `md`, `lg`                                           | On the overlay, the panel's extent away from its edge.              |
| `data-position`        | attribute | `top`, `bottom`, `left`, `right`                           | The resolved edge, on the overlay, backdrop and panel (React Aria). |
| `data-swipe-direction` | attribute | `top`, `bottom`, `left`, `right`, `vertical`, `horizontal` | The resolved swipe direction, on the same elements (React Aria).    |
| `data-stack-index`     | state     |                                                            | Its place among open drawers, from 0, on the same elements.         |
| `data-has-descendants` | state     | `true`                                                     | Another drawer is open above it, on the same elements.              |
| `data-expanded`        | state     | `true`                                                     | The panel is fully revealed, on the same elements (React Aria).     |
| `data-entering`        | state     | `true`                                                     | While it slides in, on the overlay and backdrop (React Aria).       |
| `data-exiting`         | state     | `true`                                                     | While it slides out, on the same elements (React Aria).             |
| `data-sheet-content`   | state     | `true`                                                     | React Aria's sheet content marker, on the dialog; not for styling.  |
