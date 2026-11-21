# Tooltip

`Tooltip` shows a short, non-interactive hint for a control, built on React Aria's `TooltipTrigger` and `Tooltip`. It opens when its trigger is hovered or keyboard focused and closes when the reader moves on. Content the reader acts on belongs in a popover or menu, never in a tooltip. Text cut short by its box uses [Truncation Tooltip](TOOLTIP.md), which shares this panel's hooks. `AnchoredTooltip` shows the same panel, opened by the caller, against an element it already owns or a rectangle.

## UIC-TOOLTIP-1 - Contract

### UIC-TOOLTIP-1.1 - Trigger and panel

`Tooltip` shall wrap one focusable trigger (a library `Button` or `Link`) and render its `content` in the `ui-tooltip__content` slot of a panel with `role="tooltip"`, portalled to the end of the overlay container ([UIC-PORTAL-1.2](PORTAL.md#uic-portal-12---choosing-the-container)): the document body, or the container a `PortalHost` or `PortalContainerProvider` above chooses. The panel never takes focus, holds no interactive content and adds no wrapper element around the trigger. Inside a caller's own `Tooltip` or `HoverCardTrigger`, a `Tooltip` renders its trigger alone (still named by a `label` hint), so the caller's trigger keeps its hover, focus and long-press handling and its popup semantics; the outer trigger wins.

`TooltipTrigger` shall also accept a focusable element (including a native button or link) followed by its `TooltipContent`, with the same timing, outside ownership, focus and description behavior. It owns the open state and adds no wrapper. The `TooltipContent` owns the panel's placement, variant and attributes. A caller's ref reaches the panel when open.

Implementation: `src/components/tooltip/tooltip.tsx`, `src/components/tooltip/caller-trigger.ts`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.2 - Opening

Hovering the trigger with a mouse or pen shall open the panel after `delay` milliseconds (500 by default); keyboard focus shall open it at once. The first genuine pointer movement onto a trigger shall work without a prior interaction elsewhere. An enter caused only by layout or keyboard navigation while the input is not a pointer shall wait for genuine pointer movement. Right after one tooltip closes, a neighbouring trigger opens its tooltip without the delay, and only one tooltip is open at a time. Touch never opens it. `trigger="focus"` opens it on keyboard focus only and `isDisabled` never opens it.

Implementation: `src/components/tooltip/tooltip.tsx`, `src/utils/use-pointer-entry.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `src/utils/use-pointer-entry.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.3 - Closing

The panel shall close when the pointer leaves the trigger (after `closeDelay`, 500 milliseconds by default, so the reader can move onto the hint), when the trigger loses focus, when it is pressed (unless `shouldCloseOnPress` is false) and when Escape is pressed. Closing a tooltip shall leave Escape available to the owning surface rather than consume the key globally. The tooltip does not move focus itself; a surface that also handles Escape applies its own focus rule. A pending hover opening is cancelled when the pointer leaves.

Implementation: `src/components/tooltip/tooltip.tsx`, `src/components/tooltip/tooltip-escape.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.4 - Description

While the panel is open, the trigger shall be described by it through `aria-describedby` (unless the hint is its label, [UIC-TOOLTIP-1.9](#uic-tooltip-19---label-relationship)), and the reference shall be removed when it closes. The trigger keeps its own accessible name. A trigger that sets its own `aria-describedby` keeps that value instead (React Aria gives the trigger's props precedence).

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.5 - Placement

`placement` (`top` by default, or any `Placement` such as `bottom`, `start` or `end top`) shall choose the preferred side; the panel flips to the opposite side when it does not fit and stays inside the viewport, 8 pixels from the trigger to leave room for the arrow. `Tooltip` uses React Aria's whole CSS pixel positioning: document coordinates are floored after adding the 8-pixel offset, so fractional trigger edges can make the drawn gap less than one pixel smaller. The panel and its `ui-tooltip__arrow` publish the resolved side in `data-placement`. The panel of `Tooltip` and of `AnchoredTooltip` sits on the `tooltip` overlay layer ([UIC-PORTAL-2.2](PORTAL.md#uic-portal-22---stacking)): it publishes `data-layer="tooltip"` and takes its inline z-index from `useLayerZIndex('tooltip')` instead of React Aria's 100000, so it stacks above menus and below toasts and a provider's `layerZIndex` applies. An anchored tooltip remains on the accessible top layer while a modal is open; the modal does not make its hint inert or hide it from assistive technology.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.6 - Variants

`variant` shall publish `data-variant` on the panel: `default` (the hint for a control) or `info` (a softer explanatory note beside content).

Implementation: `src/components/tooltip/tooltip.tsx`, `labs/reference/tooltip.css`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-1.7 - Controlled state

`isOpen` with `onOpenChange` shall control the panel, and `defaultOpen` shall open it initially; hover, focus, Escape and press then report changes through `onOpenChange`. While `isDisabled`, the panel is drawn closed even when a controlled owner keeps `isOpen` true, and an open panel is closed once per change to disabled through `onOpenChange(false)`, so an uncontrolled panel stays closed when it is enabled again. The trigger keeps its element, focus and own action.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.8 - Hooks and caller attributes

The panel shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes. Its `id` stays React Aria's, which describes the trigger by it. It publishes React Aria's `data-entering` and `data-exiting` during its transitions.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`

### UIC-TOOLTIP-1.9 - Label relationship

With `relationship="label"` and string `content`, the hint shall be the trigger's accessible name whether the panel is open or not: the trigger element receives the content as its `aria-label` (it must forward `aria-label` to its focusable element, as `Button` and `Link` do). The open panel then describes nothing, so the name is read once; a trigger's own `aria-describedby` still wins. A trigger's own `aria-label` also wins, for a name that says more than the hint (a count, say); the hint still adds no description. Use it for a control whose only label is its hint, such as an icon-only segment or a collapsed navigation entry that is not a `Button`; an icon-only `Button` takes its hint through its own `tooltip` prop instead ([UIC-BUTTON-11.7](BUTTON.md)). Content that is not a string cannot be a name, so it describes the trigger as usual.

Implementation: `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/tooltip.test.tsx`, `e2e/tooltip.spec.ts`

## UIC-TOOLTIP-2 - Anchored tooltip

### UIC-TOOLTIP-2.1 - Existing elements

`AnchoredTooltip` shall show its `content` in the same panel and hooks as `Tooltip` (`ui-tooltip`, `role="tooltip"`), rendered straight into the overlay container that a [Portal](PORTAL.md) uses, with the `tooltip` layer's z-index, and nothing on the server or until hydrated while `isOpen` is true and hide it when false, pointing at an `anchor` the caller already owns: an HTML or SVG element, or a ref to one. It renders no trigger and nothing around the anchor, and nothing in it opens or closes the panel: the caller owns the state. The panel takes `variant`, `placement` (default `top`, flipping when it does not fit), the caller's `id`, `className` and `data-*`, and publishes `data-placement`, `data-entering` and `data-exiting` as `Tooltip` does. Its `ui-tooltip__arrow` sits out of the panel's flow on the side facing the anchor, as React Aria places `Tooltip`'s, so the panel is only as tall as its content.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-2.2 - Rectangles

An `anchor` with a `getBoundingClientRect()` method and no element, such as a text range or a region of a canvas, shall place the panel against that rectangle, in viewport pixels as `getBoundingClientRect` returns them, read again at each opening, scroll and resize, so a rectangle that moves takes the panel with it.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `e2e/tooltip.spec.ts`

### UIC-TOOLTIP-2.3 - Relationships

The panel's `id` is the caller's `id`, or a stable generated one. While open, `relationship="description"` (the default) shall add it to an element anchor's `aria-describedby` and `relationship="label"` to its `aria-labelledby`, after the ids already there. When the host changes or removes that attribute, including independently of the tooltip's renders, the relationship shall be restored on mutation delivery, preserving the current host tokens and their order. An attribute already containing the tooltip id shall remain unchanged, without duplicate tokens or repeated writes once settled. Closing, unmounting or changing the anchor, id or relationship shall release the previous relationship: remove only the tooltip id from the current token list (and the attribute when none remain), preserving the latest host tokens, even if a host update is pending delivery. Released relationships shall not be restored by later host updates. `relationship="none"` shows the hint visually only: the panel is `aria-hidden` and the anchor's name and description do not change, for a hint that repeats a name readers already hear. A rectangle anchor has no element, so no relationship.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `src/components/tooltip/anchored-tooltip-relationships.test.tsx`, `e2e/tooltip-relationships.spec.ts`

### UIC-TOOLTIP-2.4 - Following and cleaning up

The open panel shall follow its anchor through page and container scrolling, window resizing and changes of the anchor's or the panel's size, without closing. With no anchor, a ref holding nothing, or an element no longer in the document, it shows nothing; unmounting it while open removes the panel and its relationship. The anchor element is read again after every render and, while open, whenever nodes come or go in its document: a stable ref that now holds a replacement element moves the relationship and the position to the replacement, an anchor that leaves the document hides the panel and releases its relationship, and one put back shows it again.

Implementation: `src/components/tooltip/anchored-tooltip.tsx`
Verification: `src/components/tooltip/anchored-tooltip.test.tsx`, `e2e/tooltip.spec.ts`

## Truncation Tooltip

`TruncationTooltip` renders text that the stylesheet may cut short, with an ellipsis or a line clamp, and shows the whole text in a tooltip only while it is cut. It completes text a layout cut; a hint that explains a control is a [Tooltip](TOOLTIP.md). Its panel is the Tooltip's `default` panel, so it shares that component's hooks.

## UIC-TOOLTIP-3 - Contract

### UIC-TOOLTIP-3.1 - Text

`TruncationTooltip` shall render its children in a `ui-truncation-tooltip` `<span>`, adding no role, tab stop or accessible name. The stylesheet decides how the text is cut; the full text always stays in the page.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`, `labs/reference/tooltip.css`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`, `e2e/tooltip-truncation-tooltip.spec.ts`

### UIC-TOOLTIP-3.2 - Only when cut

When a mouse or pen rests on the text for `delay` milliseconds (500 by default), the component shall show the tooltip only if the text overflows its box, horizontally or vertically. Text that fits shows nothing, a pending opening is cancelled when the pointer leaves, and touch never opens it.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`, `e2e/tooltip-truncation-tooltip.spec.ts`

### UIC-TOOLTIP-3.3 - Keyboard focus

When keyboard focus reaches the text or the nearest focusable element holding it, such as a link or a row, the tooltip shall open at once if the text is cut, and close when that element loses focus. Focus while the reader uses a pointer opens nothing: focus that follows a pointer press on that element, and focus a script moves there after a pointer press anywhere (as focus restoration does when a menu or dialog closes), as React Aria's tooltips open only on visible focus.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`, `e2e/tooltip-truncation-tooltip.spec.ts`

### UIC-TOOLTIP-3.4 - Dismissal

The tooltip shall close when the pointer leaves the text, when the text is pressed (and stay closed until the pointer enters again), on blur, on scroll and on Escape. Escape is never consumed: it closes the tooltip and goes on, so a dialog or menu around the text closes on the same press. An Escape that belongs to an input method's composition (`isComposing`, or the legacy key code 229), or that something already handled, leaves the tooltip open.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`, `e2e/tooltip-truncation-tooltip.spec.ts`

### UIC-TOOLTIP-3.5 - Visual only

The panel shall have `role="tooltip"`, show the children's text in the Tooltip's `default` variant, also carry the `ui-truncation-tooltip__panel` class, and be visual only: because the text is already the accessible content, the component adds no `aria-describedby` and never moves focus. The panel holds a copy of the text's markup taken from the page, hidden from assistive technology and inert, with every `id` removed: it renders no second instance of the children, so it owns no ids, refs or focusable elements, and a ref, id or control in the children stays the page's one. The copy keeps the markup's direction and formatting, such as the left-to-right isolation of a folder path. `placement` (`top` by default) chooses the preferred side, flipping when it does not fit. Inside a control that has its own [Tooltip](TOOLTIP.md), the panel keeps a separate id and is positioned against the text.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`, `src/components/tooltip/tooltip.tsx`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`, `e2e/tooltip-truncation-tooltip.spec.ts`

### UIC-TOOLTIP-3.6 - Hooks and caller attributes

`TruncationTooltip` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `ref` and the other native `<span>` attributes ([UIC-COMPOSITION-2.4](COMPOSITION.md#uic-composition-24---native-props-of-containers): all of them but `dangerouslySetInnerHTML`) to the text, except the pointer handlers it owns (`onPointerEnter`, `onPointerLeave`, `onPointerDown`). A component whose root is the text that may be cut renders its root as a `TruncationTooltip`.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`

## UIC-TOOLTIP-4 - Expanding in place

### UIC-TOOLTIP-4.1 - Show more and show less

With `expandable`, while the text is cut the component shall draw a link-styled React Aria button after the text in the `ui-truncation-tooltip__toggle` slot, labelled by the provider's `showMore` string, with `aria-expanded="false"` and `aria-controls` naming the text (the caller's `id`, or a generated one). Pressing it shows the text whole: the text publishes `data-expanded`, which the stylesheet uses to stop cutting it, and the control reads `showLess` with `aria-expanded="true"` until pressed again. The reference stylesheet gives this link-styled control the accent text color, readable in both light and dark themes. Whether the text is cut is measured again when it resizes, when its content changes (a child re-rendering its own text) and when fonts finish loading. Text that fits draws no control, whole text never opens the tooltip, and `isExpanded`, `defaultExpanded` and `onExpandedChange` control the state.

Implementation: `src/components/tooltip/truncation-tooltip.tsx`, `src/core/strings/content.ts`, `labs/reference/tooltip.css`
Verification: `src/components/tooltip/truncation-tooltip.test.tsx`, `e2e/tooltip-truncation-tooltip.spec.ts`

## Hooks

| Hook                            | Kind      | Values / Meaning                           |
| ------------------------------- | --------- | ------------------------------------------ |
| `ui-tooltip`                    | root      |                                            | The panel (`role="tooltip"`), portalled.                                                |
| `ui-tooltip__arrow`             | slot      |                                            | The arrow, positioned against the trigger.                                              |
| `ui-tooltip__content`           | slot      |                                            | The hint content.                                                                       |
| `data-variant`                  | attribute | `default`, `info`                          | Hint for a control or explanatory note.                                                 |
| `data-layer`                    | attribute | `tooltip`                                  | The overlay layer; its z-index is set inline from it.                                   |
| `data-placement`                | state     | `top`, `bottom`, `left`, `right`, `center` | Resolved side, on the panel and the arrow (React Aria).                                 |
| `data-entering`                 | state     | `true`                                     | While opening (React Aria).                                                             |
| `data-exiting`                  | state     | `true`                                     | While closing (React Aria).                                                             |
| `ui-truncation-tooltip`         | root      |                                            | The text (`<span>`) the stylesheet may cut.                                             |
| `ui-truncation-tooltip__panel`  | slot      |                                            | The shown panel, also `ui-tooltip` with its hooks.                                      |
| `ui-truncation-tooltip__toggle` | slot      |                                            | The show more or less control, after the text with React Aria press and focus behavior. |
| `data-expanded`                 | state     | `true`                                     | Expandable text shown whole.                                                            |
| `data-hovered`                  | state     | `true`                                     | Pointer over the expand control.                                                        |
| `data-pressed`                  | state     | `true`                                     | Expand control being pressed.                                                           |
| `data-focused`                  | state     | `true`                                     | Expand control focused.                                                                 |
| `data-focus-visible`            | state     | `true`                                     | Expand control keyboard focus.                                                          |
