# Modal Controller

`createModalController` creates an imperative store of open modals, for code that opens a modal from outside a render tree or without owning its open state: an event handler deep in a tool, a keyboard command, a non-React module. The host creates a controller, renders `ModalHost` with it once, and hands the controller to whatever opens modals. Each opening returns a handle to close or update it and a promise of its result. The library keeps no controller of its own; every controller is an instance its host creates. Each modal is a [Modal](MODAL.md), or any modal the caller draws. [Confirm Dialog](MODAL.md#uic-modal-22---imperative-confirmation) builds awaitable helpers on it: `confirm` for a yes-or-no answer, `alert` for an acknowledgement and `prompt` for a line of text.

## UIC-MODAL-CONTROLLER-1 - Controller

### UIC-MODAL-CONTROLLER-1.1 - Instances

`createModalController` shall return a new, independent controller each time. Controllers share no state, and the library creates none at module load.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`

### UIC-MODAL-CONTROLLER-1.2 - Opening

`open(options)` shall add a modal above every open one and return its handle, with an `id` unique within the controller and `isOpen` true. With modal options, the entry renders a `Modal` with those props and `content` as its body; `content` given as a function receives the handle. With `render`, the entry calls it with `isOpen`, `onOpenChange`, `close` and the handle, and renders what it returns, so a caller can open a modal of its own (for example a [Confirm Dialog](MODAL.md)).

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`, `e2e/modal-controller.spec.ts`

### UIC-MODAL-CONTROLLER-1.3 - Closing and results

`handle.close(value)` shall close the modal and settle `handle.result` with `value`. Dismissing the modal (Escape, an outside press, Cancel, the close button) shall close it and settle the result with `undefined`. The result settles exactly once: later calls to `close` do nothing. `closeAll()` dismisses every open modal, topmost first.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`, `e2e/modal-controller.spec.ts`

### UIC-MODAL-CONTROLLER-1.4 - Updates

`handle.update(options)` shall merge the options into the open modal, which re-renders with them (a new title, footer state, content or `render`). It does nothing after the modal closes.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`, `e2e/modal-controller.spec.ts`

### UIC-MODAL-CONTROLLER-1.5 - Subscription

`getSnapshot()` shall return the open modals oldest first, as a new array after every change and the same array otherwise, and `subscribe(listener)` shall call the listener after every change until the returned function unsubscribes it, so a host can render the list with `useSyncExternalStore`.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`

## UIC-MODAL-CONTROLLER-2 - Host

### UIC-MODAL-CONTROLLER-2.1 - Rendering

`ModalHost` shall render every open modal of its controller, oldest first. Modals opened before it mounts shall appear when it mounts, in opening order, and closed modals shall leave.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`, `e2e/modal-controller.spec.ts`

### UIC-MODAL-CONTROLLER-2.2 - Stacking and focus

The most recently opened modal shall stack on top and alone respond to Escape and outside presses, while the modals beneath stay mounted with their state. Each blocking modal publishes its place among the open blocking modals of its document in `data-stack-index` on its overlay (0 for the lowest, in opening order, kept while it leaves), as drawers do ([DRAWER.md](DRAWER.md)), so the stylesheet dims the page once: a modal over another takes the weaker scrim (`--ref-scrim-weak`). Closing the topmost shall return focus into the modal beneath it, and closing the last shall return focus to the element focused when it opened.

Implementation: `src/components/modal-controller/modal-controller.tsx`, `src/components/modal/modal.tsx`, `src/components/modal/modal-stack.ts`, `labs/reference/modal.css`
Verification: `src/components/modal-controller/modal-controller.test.tsx`, `e2e/modal-controller.spec.ts`

### UIC-MODAL-CONTROLLER-2.3 - Another controller

Given another controller, `ModalHost` shall drop the modals it showed and show the new controller's afresh, including the one-at-a-time mounting of UIC-MODAL-CONTROLLER-2.1: modal IDs are unique within a controller only, so a modal of the new controller never takes the draft, pending action, error or focus of the old controller's modal with the same ID, and the old controller's later actions and updates change nothing shown. Updates from the same controller keep each modal's state.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-host-replace.test.tsx`, `e2e/modal-controller.spec.ts`

### UIC-MODAL-CONTROLLER-2.4 - Closing with an exit

A modal the controller closes (by its handle, Cancel, Escape, an outside press, an action's `close` or `closeAll`) shall leave the controller's list and settle its `result` at once, while `ModalHost` keeps it on the page, closed, until its exit ends: the `Modal` runs its exit and calls the entry's `onExitComplete` once, and focus returns as when a `Modal` closes. A host unmounted while the modal is open tears it down without an exit or `onExitComplete`. A modal drawn by `render` leaves the page as soon as it closes.

Implementation: `src/components/modal-controller/modal-controller.tsx`
Verification: `src/components/modal-controller/modal-host-exit.test.tsx`, `e2e/modal-controller.spec.ts`

## Markup

`ModalHost` renders no element of its own: each open modal carries the hooks of [Modal](MODAL.md), or of the modal its `render` draws.
