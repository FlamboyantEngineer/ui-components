# Focus Scope

`FocusScope` manages focus for a region of content: it can keep Tab and Shift+Tab inside the region (a focus trap), move focus into it when it mounts and return focus when it unmounts. It is built on React Aria's `FocusScope` (from `react-aria`), the same scope React Aria's dialogs, popovers and menus use, so scopes nest with them. Unlike React Aria's, which renders no element, it wraps its content in one element with a hook so a host can target the region. `useFocusManager` returns a library `FocusManager` that moves focus within the nearest scope, for arrow-key navigation the caller builds. [Modal](MODAL.md) manages its own focus; use a focus scope for regions that are not dialogs, such as an inline editor or a panel that takes over the keyboard while open.

## UIC-FOCUS-SCOPE-1 - Contract

### UIC-FOCUS-SCOPE-1.1 - Root element

`FocusScope` shall render one `<div>` that holds its children inside the building block's scope, so the scope's region is that element. The `ref` reaches the `<div>`.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-1.2 - Hooks and caller attributes

`FocusScope` shall carry the hooks below, append the caller's `className`, forward `id`, caller `data-*` attributes and the `<div>`'s native props (a `role`, ARIA attributes, handlers), and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`

## UIC-FOCUS-SCOPE-2 - Accessibility and keyboard

### UIC-FOCUS-SCOPE-2.1 - No role of its own

The root shall add no role or name, so wrapping content in a scope changes nothing assistive technology reports; a caller that wants a named group passes `role` and `aria-label`.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-2.2 - Containment

With `contain`, Tab from the last tabbable element inside shall move focus to the first and Shift+Tab from the first to the last, and focus that leaves the scope another way (a pointer press outside) shall return to the element inside that last had it. The root publishes `data-contain` while it contains focus. Containment is page-wide, as in a modal dialog: while a scope contains focus, focus moving anywhere outside it returns, so a page contains focus in one scope at a time.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-2.3 - Switching containment

`contain` may change while the scope is mounted: switching it off shall release the trap at once, so Tab leaves the scope in document order and `data-contain` goes, and switching it on contains focus again. This is the scope's off switch, in place of a separate active or disabled flag.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-2.4 - Auto focus

With `autoFocus`, the scope shall focus its first tabbable element (else its first focusable one) when it mounts, unless focus is already inside, for example on a child rendered with `autoFocus`.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-2.5 - Initial focus

`initialFocus`, a ref or a function returning an element inside the scope (the vocabulary of [Modal](MODAL.md#uic-modal-34---chosen-focus-targets)), shall receive focus when the scope mounts, ahead of `autoFocus`'s first tabbable element. When it names no element in the document, the scope falls back to `autoFocus`.

Implementation: `src/components/focus-scope/focus-scope.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-2.6 - Restoring focus

With `restoreFocus`, when the scope unmounts while focus is inside it (or was lost to the body), focus shall return to the element that had it when the scope mounted, such as the button that opened the region.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

### UIC-FOCUS-SCOPE-2.7 - Final focus

`finalFocus`, a ref or a function asked at that moment, shall receive focus when the scope unmounts instead of the element focused when it mounted, provided focus was still inside the scope or on the body; a reader who moved focus elsewhere keeps their place. Focus is read from the scope's own document, so a scope that a page's React renders into a same-origin frame restores focus inside the frame, and does not pull focus back into the frame once the page around it holds focus. Targets from a frame's window count as elements as well as the page's own.

Implementation: `src/components/focus-scope/focus-scope.tsx`, `src/utils/focus-target.ts`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `src/utils/focus-target.test.ts`, `e2e/focus-scope.spec.ts`

## UIC-FOCUS-SCOPE-3 - Focus manager

### UIC-FOCUS-SCOPE-3.1 - Moving focus within a scope

`useFocusManager()`, called by a component inside a scope, shall return the library's `FocusManager` for the nearest scope: `focusNext`, `focusPrevious`, `focusFirst` and `focusLast` move focus among the scope's focusable (or, with `tabbable`, tabbable) elements, from the focused element or `from`, wrapping at the ends with `wrap`, and filtered by `accept` (`FocusManagerOptions`), each returning the element it focused. Outside any scope it returns `undefined`.

Implementation: `src/components/focus-scope/focus-scope.tsx`
Verification: `src/components/focus-scope/focus-scope.test.tsx`, `e2e/focus-scope.spec.ts`

## Hooks

| Hook             | Kind  | Values | Description                                 |
| ---------------- | ----- | ------ | ------------------------------------------- |
| `ui-focus-scope` | root  |        | The `<div>` that holds the scope's content. |
| `data-contain`   | state | `true` | The scope keeps focus inside (`contain`).   |
