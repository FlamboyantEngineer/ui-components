# Expand Toggle

`ExpandToggle` is the chevron button that expands and collapses a row or region, built on [Icon Button](ICON-BUTTON.md). In a list of rows where only some can expand, the others keep an empty box of the same size so their labels stay aligned.

## UIC-EXPAND-TOGGLE-1 - Contract

### UIC-EXPAND-TOGGLE-1.1 - Toggle

`ExpandToggle` shall render an Icon Button whose chevron points to the inline end while collapsed (`chevron-right`, or `chevron-left` right to left) and down while expanded (`chevron-down`). It reports its state in `aria-expanded` and `data-expanded`, takes `isExpanded` (controlled) or `defaultExpanded` (uncontrolled), calls `onExpandedChange` with the requested state on every press, and passes `aria-controls` through.

Implementation: `src/components/expand-toggle/expand-toggle.tsx`
Verification: `src/components/expand-toggle/expand-toggle.test.tsx`, `e2e/expand-toggle.spec.ts`

### UIC-EXPAND-TOGGLE-1.2 - Name

The toggle shall be named by the provider's `expand` string while collapsed and its `collapse` string while expanded. A `label` replaces both with one constant name.

Implementation: `src/components/expand-toggle/expand-toggle.tsx`
Verification: `src/components/expand-toggle/expand-toggle.test.tsx`

### UIC-EXPAND-TOGGLE-1.3 - Presses stay with the toggle

A press on the toggle by pointer, Enter or Space shall not reach the press or click handlers of its ancestors, so expanding a row never also activates it.

Implementation: `src/components/expand-toggle/expand-toggle.tsx`
Verification: `src/components/expand-toggle/expand-toggle.test.tsx`, `e2e/expand-toggle.spec.ts`

### UIC-EXPAND-TOGGLE-1.4 - Tab order and disabled

`excludeFromTabOrder` shall keep the toggle out of the tab order, for rows that hold focus themselves and expand with the arrow keys; it still responds to the pointer. `isDisabled` disables it natively.

Implementation: `src/components/expand-toggle/expand-toggle.tsx`
Verification: `src/components/expand-toggle/expand-toggle.test.tsx`, `e2e/expand-toggle.spec.ts`

### UIC-EXPAND-TOGGLE-1.5 - Placeholder for rows that cannot expand

With `isExpandable={false}` the toggle shall render an empty `<span>` carrying the same root class, `data-leaf` and `data-size`, hidden from assistive technology, and no button, so the stylesheet gives it the toggle's box.

Implementation: `src/components/expand-toggle/expand-toggle.tsx`, `labs/reference/expand-toggle.css`
Verification: `src/components/expand-toggle/expand-toggle.test.tsx`, `e2e/expand-toggle.spec.ts`

### UIC-EXPAND-TOGGLE-1.6 - Size, hooks and caller attributes

`size` (`xs`, `sm` by default, `md` or `lg`) shall publish `data-size`. The toggle carries the hooks below, appends the caller's `className`, and forwards caller `data-*` attributes, `id` and `ref`.

Implementation: `src/components/expand-toggle/expand-toggle.tsx`
Verification: `src/components/expand-toggle/expand-toggle.test.tsx`

## Hooks

| Hook               | Kind      | Values                 | Description                                                  |
| ------------------ | --------- | ---------------------- | ------------------------------------------------------------ |
| `ui-expand-toggle` | root      |                        | The toggle button (also `ui-icon-button`), or the empty box. |
| `data-size`        | attribute | `xs`, `sm`, `md`, `lg` | Box size.                                                    |
| `data-expanded`    | state     | `true`                 | Expanded.                                                    |
| `data-leaf`        | state     | `true`                 | The empty box of a row that cannot expand.                   |
