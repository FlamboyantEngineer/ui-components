# Popover

`Popover` is a dialog that floats against its trigger: an optional title and close button, then the reader's content, such as filters, a short form or details about a control. Unlike a [Modal](MODAL.md) it stays beside what opened it; unlike a [Tooltip](TOOLTIP.md) it may hold interactive content. It is built on React Aria's `DialogTrigger`, `Popover`, `OverlayArrow` and `Dialog`, which place it, flip it to stay in the viewport, move and contain focus, close it on Escape and outside presses, and return focus to the trigger. Its floating panel is shared with [Hover Card](HOVER-CARD.md), the anchored [Modal](MODAL.md#uic-modal-82---anchored-dialog) and the [User Card](USER-CARD.md) popover.

## UIC-POPOVER-1 - Overlay

### UIC-POPOVER-1.1 - Trigger and opening

`PopoverTrigger` shall hold one pressable trigger, such as a `Button`, and a `Popover`, and add no element of its own. Pressing the trigger opens the popover, which renders in an overlay at the end of the document body as the `ui-popover` panel holding the `ui-popover__dialog` element with `role="dialog"`; the trigger reports it in `aria-expanded`. `isOpen` with `onOpenChange` on the trigger controls the popover, `defaultOpen` opens it at first, and `onOpenChange` reports each change the reader asks for. A closed popover renders nothing.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-1.2 - Controlled popover and custom anchor

Outside a `PopoverTrigger`, `isOpen` with `onOpenChange` shall control the popover and `triggerRef` name the element it is placed against; Escape, outside presses and the close button report `onOpenChange(false)`. Inside a `PopoverTrigger`, `triggerRef` places the popover against another element than the trigger, which still opens it and receives focus on close.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-1.3 - Placement

`placement` (a `Placement`, `bottom` by default, such as `top`, `start`, `end` or `bottom start`) shall choose the side of the trigger the popover opens on, `offset` its distance from the trigger (8 pixels by default), `crossOffset` its shift along that side and `containerPadding` the space it keeps inside the viewport (12 pixels by default). The popover flips to the opposite side when it does not fit, unless `shouldFlip` is false. The panel publishes the resolved side in `data-placement`.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-1.4 - Arrow

`showArrow` shall render a `ui-popover__arrow` element (React Aria `OverlayArrow`) inside the panel, positioned against the trigger and publishing the resolved side in `data-placement`, so the stylesheet can point it at the trigger. Without it there is no arrow.

Implementation: `src/components/popover/popover.tsx`, `labs/reference/popover.css`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-1.5 - Layering and transitions

The panel shall carry the z-index of the `dropdown` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)) as a functional inline style, so it stacks above modals and drawers and below tooltips and toasts; a `layerZIndex` from `PortalContainerProvider` or `PortalHost` applies. It publishes React Aria's `data-trigger` (`DialogTrigger` inside a trigger), and `data-entering` and `data-exiting` while its entry and exit animations run, staying mounted until the exit animation ends. The reference placement examples shall reserve enough room for start placement with and without an arrow. Automatic flipping near viewport edges remains enabled; the reference arrow tip meets the trigger with no noticeable gap.

Implementation: `src/components/popover/popover.tsx`, `labs/reference/popover.css`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`, `e2e/lab-layout-regressions.spec.ts`

## UIC-POPOVER-2 - Dismissal and focus

### UIC-POPOVER-2.1 - Escape and outside presses

Escape pressed in the popover shall close it, unless `isKeyboardDismissDisabled` is set, and a press outside it shall close it, unless `shouldCloseOnInteractOutside` returns false for the element pressed.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-2.2 - Focus

When the popover opens, focus shall move to the element inside it that has `autoFocus`, otherwise to the dialog element; Tab and Shift+Tab then stay inside the popover, and when it closes focus returns to the element focused when it opened, usually the trigger.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-2.3 - Blocking the page

While a popover is open, the content outside it shall be hidden from assistive technology and inert, and page scrolling locked. With `isNonModal`, the popover leaves the page visible to assistive technology, reachable by the pointer and scrollable; an outside press does not close it by itself, but it closes when focus leaves it or the page scrolls.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

## UIC-POPOVER-3 - Content

### UIC-POPOVER-3.1 - Title

`title` shall render as the dialog's level-2 heading in the `ui-popover__title` slot of a `ui-popover__header` row and name the dialog, unless `aria-label` or `aria-labelledby` names it instead. A popover without a title takes its name from either.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-3.2 - Close button

`showCloseButton` shall add a small `Button` in the `ui-popover__close` slot at the end of the header, named by the provider's `close` string and drawing its `close` glyph, that closes the popover like Escape. Without a title or close button there is no header.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`, `e2e/popover.spec.ts`

### UIC-POPOVER-3.3 - Body

The children shall render in the `ui-popover__body` slot after the header. Children given as a function receive `close`, which closes the popover. Without children there is no body.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`

### UIC-POPOVER-3.4 - Hooks and caller attributes

`Popover` shall carry the hooks below, append the caller's `className` to the panel, forward caller `data-*` attributes to the panel and `id`, `aria-label` and `aria-labelledby` to the dialog element, and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/popover/popover.tsx`
Verification: `src/components/popover/popover.test.tsx`

## UIC-POPOVER-6 - Reserved scrollbar space

### UIC-POPOVER-6.1 - Consistent anchor spacing

A popover shall keep the same configured gap on every side with and without an arrow when scroll locking reserves a scrollbar gutter. Right-based positions against the document shall account for its actual containing width; positions inside another containing block shall use that block's geometry. Resizing shall update the correction without changing focus, dismissal or flipping behaviour.

Implementation: `src/components/popover/popover.tsx`, `src/components/popover/use-popover-gutter.ts`
Verification: `src/components/popover/use-popover-gutter.test.tsx`, `e2e/popover.spec.ts`

## Hooks

| Hook                 | Kind  | Values                           | Description                                                 |
| -------------------- | ----- | -------------------------------- | ----------------------------------------------------------- |
| `ui-popover`         | root  |                                  | The floating panel (React Aria `Popover`).                  |
| `ui-popover__arrow`  | slot  |                                  | The arrow pointing at the trigger.                          |
| `ui-popover__dialog` | slot  |                                  | The `role="dialog"` element.                                |
| `ui-popover__header` | slot  |                                  | The title and close button row.                             |
| `ui-popover__title`  | slot  |                                  | The `<h2>` title.                                           |
| `ui-popover__close`  | slot  |                                  | The header close button (also `ui-button`).                 |
| `ui-popover__body`   | slot  |                                  | The body.                                                   |
| `data-placement`     | state | `top`, `bottom`, `left`, `right` | The resolved side, on the panel and the arrow (React Aria). |
| `data-trigger`       | state | `DialogTrigger`                  | On the panel inside a `PopoverTrigger`, what opened it.     |
| `data-entering`      | state | `true`                           | On the panel while its entry animation runs (React Aria).   |
| `data-exiting`       | state | `true`                           | On the panel while its exit animation runs (React Aria).    |
