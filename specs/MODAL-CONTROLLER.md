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

The most recently opened modal shall stack on top and alone respond to Escape and outside presses, while the modals beneath stay mounted with their state. Closing the topmost shall return focus into the modal beneath it, and closing the last shall return focus to the element focused when it opened.

Implementation: `src/components/modal-controller/modal-controller.tsx`, `src/components/modal/modal.tsx`
Verification: `src/components/modal-controller/modal-controller.test.tsx`, `e2e/modal-controller.spec.ts`

## Markup

`ModalHost` renders no element of its own: each open modal carries the hooks of [Modal](MODAL.md), or of the modal its `render` draws.
