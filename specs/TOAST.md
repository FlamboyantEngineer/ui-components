# Toast

A toast is a transient, non-blocking message about something that just happened, built on React Aria's toast region and queue. The host creates one queue with `createToastQueue`, renders it once in a `ToastRegion` and adds toasts whenever its own logic decides to. A toast shows a tone glyph (or a busy indicator while pending), a title, an optional description, an optional action and a dismiss button, changes in place as work progresses, and never asks a question it waits on; a decision belongs in a modal dialog and a field's problem stays beside the field. `ToastList` draws a queue in place, for previews.

Pointer ownership and drag lifecycle cleanup follow the shared [drag interaction contract](DRAG-INTERACTIONS.md).

## UIC-TOAST-1 - Queue

### UIC-TOAST-1.1 - Adding toasts

`createToastQueue(options)` shall return a plain queue object declared by the library, which a `ToastRegion` or `ToastList` renders; the building block's queue behind it is not part of it, and a region or list given a queue that `createToastQueue` did not make throws. Its `add(content, options)` shall add a toast and return its key. Visible toasts are ordered newest first. `maxVisibleToasts` limits how many show at once; the others wait and appear as visible toasts close.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-1.2 - Lifetime

A toast shall close itself after `timeout` milliseconds, defaulting to the queue's `defaultTimeout` (5000 unless set), or to 0 for a pending toast ([UIC-TOAST-3.6](#uic-toast-36---pending)); a `timeout` of 0 keeps it until it is dismissed. A toast's timer runs only while it is shown, and its lifetime starts once, the first time it is shown: a toast that is displaced by newer ones beyond `maxVisibleToasts`, or whose region or list remounts, keeps the time that remained and runs on with it when it is shown again. Only a new toast, or an update that gives a new lifetime ([UIC-TOAST-1.5](#uic-toast-15---in-place-update)), starts a lifetime over. Hovering the region or moving focus into it (onto the region itself or into a toast) shall pause every visible toast's timer, also a timer that starts or restarts meanwhile (a toast added, updated with a new lifetime or settled from a promise while the reader points at the region), and leaving resumes each with the time that remained. Closing a toast calls its `onClose`.

Implementation: `src/components/toast/toast.tsx`, `src/components/toast/use-toast-lifecycle.ts`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-1.3 - Replacement

Adding a toast with the `id` of one still queued shall replace it: the old toast leaves (playing its exit) without calling its `onClose`, and the new one takes the newest position with a fresh lifetime. A toast that should change without moving is updated instead ([UIC-TOAST-1.5](#uic-toast-15---in-place-update)).

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

### UIC-TOAST-1.4 - Closing early

`close(key)` shall close one toast, which plays its exit ([UIC-TOAST-4.1](#uic-toast-41---entering-and-exiting)) and is then removed, calling its `onClose`; a toast that is not shown is removed at once. `clear()` removes every toast at once without calling `onClose`. The queue removes a toast and settles its records before it calls `onClose`, so a callback sees a coherent queue and may add, replace, close or clear toasts, its own included, without removing an unrelated toast or bringing its own back. Each `onClose` runs once; one that throws has its error reported as an uncaught error, and the queue and the other callbacks carry on.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

### UIC-TOAST-1.5 - In-place update

`update(key, content, options)` shall change a queued toast's content where it is: it keeps its position in the stack, its element and its live region, which announces the new text, and its timer keeps running with the time that remained. `options.timeout` gives it a new lifetime counted from the update (`0` keeps it until dismissed). A toast that becomes pending stops its timer, and one that stops pending gets the queue's `defaultTimeout` unless the update sets one. Updating a key that is closing or gone does nothing.

Implementation: `src/components/toast/toast-queue.ts`, `src/components/toast/use-toast-lifecycle.ts`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-1.6 - Promise toasts

`promise(promise, { pending, success, error }, options)` shall add the `pending` content as a pending toast with no timeout and return its key. When the promise resolves, the same toast updates in place to `success` (content, or a function of the resolved value; tone `success` unless it sets one); when it rejects, to `error` (content, or a function of the reason; tone `danger` unless it sets one). The settled toast then lives for `options.timeout`, or the queue's `defaultTimeout`. A toast closed before the promise settles stays closed.

Implementation: `src/components/toast/toast-queue.ts`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

## UIC-TOAST-2 - Region

### UIC-TOAST-2.1 - Landmark

`ToastRegion` shall render nothing while its queue is empty and, while it has toasts, portal a `ui-toast-region` landmark (`role="region"`, named by `aria-label` or by React Aria's localised count of notifications) into the overlay container ([UIC-TOAST-2.4](#uic-toast-24---overlay-layer)), holding the toasts in an ordered list (`ui-toast-list`). The landmark is reachable with React Aria's landmark navigation (F6). Showing a toast never moves focus.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-2.2 - Toast semantics

Each toast shall be a non-modal `alertdialog` in the tab order, labelled by its title and described by its description. Its `ui-toast__content` is an atomic live region: `role="status"` (polite) for `info` and `success`, `role="alert"` (assertive) for `warning` and `danger`. When a focused toast closes, focus moves to the next toast, or back to where it was before the region.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-2.3 - In-place list

`ToastList` shall draw a queue's visible toasts in place as a `ui-toast-list`, with the same toast markup, but without the portal, the landmark and the pausing of a region.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-2.4 - Overlay layer

`ToastRegion` shall sit on the shared `toast` overlay layer ([Portal](PORTAL.md)): it portals into the container that a `Portal` below the same `PortalContainerProvider` or `PortalHost` would use (the document body unless one chooses another, any element of the page or of a same-origin frame such as the frame's body, and nothing while the chosen one is not ready or on the server, so server rendering and hydration under a `PortalHost` or a pending container render nothing and never read browser globals), and carries the `toast` layer's z-index in effect there (160 unless `layerZIndex` replaces it) as a functional inline style. Toasts therefore stack above drawers, dialogs, menus and tooltips whatever order they mount in, and their actions and dismiss buttons take pointer presses where they overlap one. The region is a React Aria top layer, so while a modal or drawer is open its toasts stay exposed to assistive technology, focus can move into them (F6, then Tab), and pressing them does not dismiss the open overlay.

Implementation: `src/components/toast/toast.tsx`, `src/components/portal/portal.tsx`, `labs/reference/toast.css`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

## UIC-TOAST-3 - Toast

### UIC-TOAST-3.1 - Tones

`tone` shall publish `data-tone` on the toast: `info` (the default; neutral news), `success` (the requested work finished), `warning` (it finished with a caveat, or something needs attention soon) or `danger` (it failed). The toast draws the tone's built-in glyph (`info`, `success`, `warning`, and `error` for `danger`), or the caller's `icon` (a icon component or rendered element), as a decorative [Icon](ICON.md) in the `ui-toast__icon` slot.

Implementation: `src/components/toast/toast.tsx`, `src/components/banner/banner.tsx`, `labs/reference/toast.css`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-3.2 - Title and description

The toast shall show its `title` in the `ui-toast__title` slot and, when set, its `description` in the `ui-toast__description` slot.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

### UIC-TOAST-3.3 - Action

An `action` shall render a [Button](BUTTON.md) in the `ui-toast__action` slot named by its `label`; pressing it runs `onAction` and then closes the toast.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-3.4 - Dismiss

Every toast shall have an [Icon Button](BUTTON.md) in the `ui-toast__close` slot, named by the provider's `dismiss` string, that closes it.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-3.5 - Hooks and caller attributes

Toasts, regions and lists shall carry the hooks below. `ToastRegion` and `ToastList` append the caller's `className` and forward caller `data-*` attributes and `id` to their root; toasts are drawn only by them. The interaction states below are published on the region and on each toast.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

### UIC-TOAST-3.6 - Pending

`isPending` in a toast's content shall replace its glyph with a decorative `ui-toast__spinner` slot hidden from assistive technology and publish `data-pending`; added without a `timeout`, a pending toast stays until it is updated, closed or dismissed. Its live region still announces its title, so the work in progress is heard.

Implementation: `src/components/toast/toast.tsx`, `src/components/toast/toast-queue.ts`, `labs/reference/toast.css`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

## UIC-TOAST-4 - Motion

### UIC-TOAST-4.1 - Entering and exiting

Each toast shall publish `data-entering` while it appears and `data-exiting` while it leaves, timed by [`useEnterExit`](ENTER-EXIT.md) from the toast's own element. Every close (its timer, its dismiss button, its action, a swipe or the queue's `close`) keeps a shown toast in the stack, exiting, until its exit animations end, then removes it; focus moves on as React Aria moves it when the toast is removed. Without a running animation a toast leaves at once. A closing toast whose last renderer unmounts before its exit ends (its region or list leaves the page, also in the same event as the close) is removed then, calling its `onClose` once; an open toast whose renderer unmounts stays queued for the next one.

Implementation: `src/components/toast/toast.tsx`, `src/components/toast/toast-queue.ts`, `src/utils/use-enter-exit.ts`, `labs/reference/toast.css`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-4.2 - Swipe to dismiss

A pointer that starts on a toast outside its buttons (whose presses stay theirs) and drags it more than 8 pixels toward the region's `swipeDirection` shall make it swiping: it publishes `data-swiping` and its travel as `--ui-toast-swipe-x` (left and right, negative to the left) or `--ui-toast-swipe-y` (up and down, negative upwards). Releasing it after at least `swipeThreshold` pixels (50 by default) closes it and keeps the travel for its exit; a shorter release or a cancelled pointer returns it to rest. The click that ends a swipe is swallowed, so a swipe that ends on a link does not follow it. Keyboard users dismiss with the dismiss button. `swipeDirection` is `end` by default; `start` and `end` follow the provider locale's reading direction, and `left`, `right`, `up` and `down` are physical. Each toast publishes the resolved screen direction as `data-swipe-direction`, so `end` reads `right` left to right and `left` right to left.

Implementation: `src/components/toast/use-toast-swipe.ts`, `src/components/toast/toast.tsx`, `labs/reference/toast.css`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-4.3 - Stack position and expansion

Each toast shall publish its place in the stack as `--ui-toast-index` (0 for the newest visible toast, unitless) and `--ui-toast-offset` (the summed measured height of the newer visible toasts, in pixels), so the stylesheet can pile toasts and spread them out. A `ToastRegion` publishes `data-expanded` while the pointer is over it or focus is inside it (the region element included), the same moments its timers pause, so the stylesheet can spread a pile while the reader works with it. Once hovered, the pointer counts as over the region anywhere in the box around the region and its toasts as they are drawn, so crossing the gaps of a spread stack toward an older toast keeps it expanded and paused, whatever the toasts' heights, direction or viewport width. That box covers nothing: presses in a gap reach the page under it. Moving out of the box, or out of the page, ends the hover. When the toast under the pointer or holding focus leaves, the region stops being hovered or focused as the pointer or focus moves elsewhere, and a region whose last toast has left is neither, so the next toast starts collapsed and running.

Implementation: `src/components/toast/toast-stack.ts`, `src/components/toast/toast.tsx`, `labs/reference/toast.css`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

## Hooks

| Hook                    | Kind      | Values                                 | Description                                       |
| ----------------------- | --------- | -------------------------------------- | ------------------------------------------------- |
| `ui-toast-region`       | root      |                                        | The landmark (`role="region"`), portalled.        |
| `ui-toast-list`         | root      |                                        | The ordered list of toasts.                       |
| `ui-toast`              | root      |                                        | One toast (`role="alertdialog"`).                 |
| `ui-toast__icon`        | slot      |                                        | The tone glyph or custom icon (also `ui-icon`).   |
| `ui-toast__spinner`     | slot      |                                        | The decorative busy indicator while pending.      |
| `ui-toast__content`     | slot      |                                        | The live region holding title and description.    |
| `ui-toast__title`       | slot      |                                        | The title.                                        |
| `ui-toast__description` | slot      |                                        | The description, when set.                        |
| `ui-toast__action`      | slot      |                                        | The action button (also `ui-button`).             |
| `ui-toast__close`       | slot      |                                        | The dismiss button (also `ui-button`).            |
| `data-tone`             | attribute | `info`, `success`, `warning`, `danger` | The toast's tone.                                 |
| `data-swipe-direction`  | attribute | `up`, `down`, `left`, `right`          | The screen direction that dismisses the toast.    |
| `data-pending`          | state     | `true`                                 | Work in progress.                                 |
| `data-entering`         | state     | `true`                                 | The toast is playing its enter animation.         |
| `data-exiting`          | state     | `true`                                 | The toast is playing its exit before removal.     |
| `data-swiping`          | state     | `true`                                 | A pointer is dragging the toast.                  |
| `data-expanded`         | state     | `true`                                 | Pointer over the region or focus in it.           |
| `--ui-toast-index`      | property  |                                        | Place in the stack, 0 for the newest (unitless).  |
| `--ui-toast-offset`     | property  |                                        | Summed height of the newer toasts, in pixels.     |
| `--ui-toast-swipe-x`    | property  |                                        | Horizontal swipe travel, in pixels.               |
| `--ui-toast-swipe-y`    | property  |                                        | Vertical swipe travel, in pixels.                 |
| `data-hovered`          | state     | `true`                                 | Pointer over the region (React Aria).             |
| `data-focused`          | state     | `true`                                 | Focus in the region or on the toast (React Aria). |
| `data-focus-visible`    | state     | `true`                                 | Keyboard focus (React Aria).                      |
