# Visually Hidden

`VisuallyHidden` holds content that assistive technology perceives but the page does not show: the name of an icon-only control, the context a short value needs to make sense when read aloud ("12 kg of apples"), or a heading a layout implies. It is built on React Aria's `VisuallyHidden`, which hides the element with functional inline styles (clipped to one pixel, out of the flow) rather than `display: none`, so the content stays in the accessibility tree. With `isFocusable` it shows while it or a descendant has focus, which is how a skip link appears for keyboard users. Components that hide their own text (a count badge's full count, a copy button's live status) keep their own slots; this component is for callers.

## UIC-VISUALLY-HIDDEN-1 - Contract

### UIC-VISUALLY-HIDDEN-1.1 - Hidden from view

`VisuallyHidden` shall render React Aria's `VisuallyHidden`: a `<div>` holding its children, hidden with React Aria's inline styles (absolutely positioned, one pixel, clipped, overflow hidden) so it takes no space in the layout and the children stay in the document and its accessibility tree.

Implementation: `src/components/visually-hidden/visually-hidden.tsx`
Verification: `src/components/visually-hidden/visually-hidden.test.tsx`, `e2e/visually-hidden.spec.ts`

### UIC-VISUALLY-HIDDEN-1.2 - Element type

`elementType` shall choose the element React Aria renders, such as a `<span>` inside phrasing content (a sentence, a button label), so the markup stays valid.

Implementation: `src/components/visually-hidden/visually-hidden.tsx`
Verification: `src/components/visually-hidden/visually-hidden.test.tsx`, `e2e/visually-hidden.spec.ts`

### UIC-VISUALLY-HIDDEN-1.3 - Hooks and caller attributes

`VisuallyHidden` shall carry the hooks below, append the caller's `className`, forward `id`, caller `data-*` attributes and React Aria's DOM props (its focus handlers run beside the component's own), and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/visually-hidden/visually-hidden.tsx`
Verification: `src/components/visually-hidden/visually-hidden.test.tsx`

## UIC-VISUALLY-HIDDEN-2 - Accessibility

### UIC-VISUALLY-HIDDEN-2.1 - Names and descriptions

Text inside `VisuallyHidden` shall count towards the accessible name of the element that holds it, so an icon-only button whose only text is hidden is named by that text, and a value reads with the context the hidden text adds. The component adds no role.

Implementation: `src/components/visually-hidden/visually-hidden.tsx`
Verification: `src/components/visually-hidden/visually-hidden.test.tsx`, `e2e/visually-hidden.spec.ts`

### UIC-VISUALLY-HIDDEN-2.2 - Shown on focus

With `isFocusable`, the content shall show (React Aria drops its hiding styles) and the root publish `data-focus-within` while the root or a descendant has focus, and hide again when focus leaves, so a skip link appears when a keyboard user tabs to it and Enter follows it. Without `isFocusable`, focused content stays hidden and publishes no `data-focus-within`.

Implementation: `src/components/visually-hidden/visually-hidden.tsx`
Verification: `src/components/visually-hidden/visually-hidden.test.tsx`, `e2e/visually-hidden.spec.ts`

## Hooks

| Hook                 | Kind  | Values | Description                                                        |
| -------------------- | ----- | ------ | ------------------------------------------------------------------ |
| `ui-visually-hidden` | root  |        | The hidden element: a `<div>`, or the element `elementType` names. |
| `data-focus-within`  | state | `true` | Focusable content is shown while it or a descendant has focus.     |
