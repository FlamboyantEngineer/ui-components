# Floating Toolbar

`FloatingToolbar` is a toolbar floating over a box on the page, such as a selected text range in an editor: a [Toolbar Row](LAYOUT.md) in a non-modal popover that never takes focus as it opens or moves, so typing and selecting carry on beneath it. The editor decides when it shows and what it floats over; [Rich Text Editor](RICH-TEXT-EDITOR.md#uic-rich-text-editor-7---selection-toolbar)'s `SelectionToolbar` is built on it.

## UIC-FLOATING-TOOLBAR-1 - Contract

### UIC-FLOATING-TOOLBAR-1.1 - Placing

While `isOpen`, `FloatingToolbar` shall render a non-modal React Aria popover (`ui-floating-toolbar`) on the `dropdown` overlay layer against `triggerRef`, or against the viewport box `getTargetRect` gives when it gives one, at `placement` (`top start` by default), kept inside the viewport. It is placed again whenever `targetKey` changes, as the caller changes it when its box moves. Opening and moving it leave focus where it is, and it hides nothing of the page.

Implementation: `src/components/floating-toolbar/floating-toolbar.tsx`
Verification: `src/components/floating-toolbar/floating-toolbar.test.tsx`, `e2e/floating-toolbar.spec.ts`

### UIC-FLOATING-TOOLBAR-1.2 - The row and focus

The popover shall hold a `ToolbarRow` (`ui-floating-toolbar__row`, beside `ui-toolbar-row` and the caller's `rowClassName`) named by `aria-label` or `aria-labelledby`, holding `children`, with arrow keys moving focus among them. `rowRef` reaches the row, so the caller can move focus into it, and `onFocus` and `onBlur` hear focus entering and leaving its controls. Escape inside the row calls `onDismiss`, and goes no further, for the caller to hide the toolbar and return focus.

Implementation: `src/components/floating-toolbar/floating-toolbar.tsx`
Verification: `src/components/floating-toolbar/floating-toolbar.test.tsx`, `e2e/floating-toolbar.spec.ts`

### UIC-FLOATING-TOOLBAR-1.3 - Hooks and caller attributes

`FloatingToolbar` shall carry the hooks below, append the caller's `className` to its root and forward caller `data-*` attributes to it.

Implementation: `src/components/floating-toolbar/floating-toolbar.tsx`
Verification: `src/components/floating-toolbar/floating-toolbar.test.tsx`

## Hooks

| Hook                       | Kind  | Values                                     | Description                                         |
| -------------------------- | ----- | ------------------------------------------ | --------------------------------------------------- |
| `ui-floating-toolbar`      | root  |                                            | The non-modal popover.                              |
| `ui-floating-toolbar__row` | slot  |                                            | Its toolbar row, alongside `ui-toolbar-row`.        |
| `data-placement`           | state | `top`, `bottom`, `left`, `right`, `center` | Side of the box the toolbar opened on (React Aria). |
