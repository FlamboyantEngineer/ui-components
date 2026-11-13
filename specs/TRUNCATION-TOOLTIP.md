# Truncation Tooltip

`TruncationTooltip` renders text that the stylesheet may cut short, with an ellipsis or a line clamp, and shows the whole text in a tooltip only while it is cut. It completes text a layout cut; a hint that explains a control is a [Tooltip](TOOLTIP.md). Its panel is the Tooltip's `default` panel, so it shares that component's hooks.

## UIC-TRUNCATION-TOOLTIP-1 - Contract

### UIC-TRUNCATION-TOOLTIP-1.1 - Text

`TruncationTooltip` shall render its children in a `ui-truncation-tooltip` `<span>`, adding no role, tab stop or accessible name. The stylesheet decides how the text is cut; the full text always stays in the page.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`, `labs/reference/truncation-tooltip.css`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`, `e2e/truncation-tooltip.spec.ts`

### UIC-TRUNCATION-TOOLTIP-1.2 - Only when cut

When a mouse or pen rests on the text for `delay` milliseconds (500 by default), the component shall show the tooltip only if the text overflows its box, horizontally or vertically. Text that fits shows nothing, a pending opening is cancelled when the pointer leaves, and touch never opens it.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`, `e2e/truncation-tooltip.spec.ts`

### UIC-TRUNCATION-TOOLTIP-1.3 - Keyboard focus

When keyboard focus reaches the text or the nearest focusable element holding it, such as a link or a row, the tooltip shall open at once if the text is cut, and close when that element loses focus. Focus while the reader uses a pointer opens nothing: focus that follows a pointer press on that element, and focus a script moves there after a pointer press anywhere (as focus restoration does when a menu or dialog closes), as React Aria's tooltips open only on visible focus.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`, `e2e/truncation-tooltip.spec.ts`

### UIC-TRUNCATION-TOOLTIP-1.4 - Dismissal

The tooltip shall close when the pointer leaves the text, when the text is pressed (and stay closed until the pointer enters again), on blur, on scroll and on Escape. Escape is never consumed: it closes the tooltip and goes on, so a dialog or menu around the text closes on the same press. An Escape that belongs to an input method's composition (`isComposing`, or the legacy key code 229), or that something already handled, leaves the tooltip open.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`, `e2e/truncation-tooltip.spec.ts`

### UIC-TRUNCATION-TOOLTIP-1.5 - Visual only

The panel shall have `role="tooltip"`, show the children's text in the Tooltip's `default` variant, also carry the `ui-truncation-tooltip__panel` class, and be visual only: because the text is already the accessible content, the component adds no `aria-describedby` and never moves focus. The panel holds a copy of the text's markup taken from the page, hidden from assistive technology and inert, with every `id` removed: it renders no second instance of the children, so it owns no ids, refs or focusable elements, and a ref, id or control in the children stays the page's one. The copy keeps the markup's direction and formatting, such as a [Path](PATH.md)'s left-to-right isolation. `placement` (`top` by default) chooses the preferred side, flipping when it does not fit. Inside a control that has its own [Tooltip](TOOLTIP.md), the panel keeps a separate id and is positioned against the text.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`, `src/components/tooltip/tooltip.tsx`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`, `e2e/truncation-tooltip.spec.ts`

### UIC-TRUNCATION-TOOLTIP-1.6 - Hooks and caller attributes

`TruncationTooltip` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `ref` and the other native `<span>` attributes ([UIC-COMPOSITION-2.4](COMPOSITION.md#uic-composition-24---native-props-of-containers): all of them but `dangerouslySetInnerHTML`) to the text, except the pointer handlers it owns (`onPointerEnter`, `onPointerLeave`, `onPointerDown`). A component whose root is the text that may be cut, such as [Path](PATH.md), renders its root as a `TruncationTooltip`.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`

## UIC-TRUNCATION-TOOLTIP-2 - Expanding in place

### UIC-TRUNCATION-TOOLTIP-2.1 - Show more and show less

With `expandable`, while the text is cut the component shall draw a link-styled [Button](BUTTON.md) after the text in the `ui-truncation-tooltip__toggle` slot, labelled by the provider's `showMore` string, with `aria-expanded="false"` and `aria-controls` naming the text (the caller's `id`, or a generated one). Pressing it shows the text whole: the text publishes `data-expanded`, which the stylesheet uses to stop cutting it, and the control reads `showLess` with `aria-expanded="true"` until pressed again. Whether the text is cut is measured again when it resizes, when its content changes (a child re-rendering its own text) and when fonts finish loading. Text that fits draws no control, whole text never opens the tooltip, and `isExpanded`, `defaultExpanded` and `onExpandedChange` control the state.

Implementation: `src/components/truncation-tooltip/truncation-tooltip.tsx`, `src/core/strings/content.ts`, `labs/reference/truncation-tooltip.css`
Verification: `src/components/truncation-tooltip/truncation-tooltip.test.tsx`, `e2e/truncation-tooltip.spec.ts`

## Hooks

| Hook                            | Kind  | Values | Description                                                       |
| ------------------------------- | ----- | ------ | ----------------------------------------------------------------- |
| `ui-truncation-tooltip`         | root  |        | The text (`<span>`) the stylesheet may cut.                       |
| `ui-truncation-tooltip__panel`  | slot  |        | The shown panel, also `ui-tooltip` with its hooks.                |
| `ui-truncation-tooltip__toggle` | slot  |        | The show more or less control, after the text (also `ui-button`). |
| `data-expanded`                 | state | `true` | Expandable text shown whole.                                      |
