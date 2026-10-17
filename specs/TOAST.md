# Toast

A toast is a transient, non-blocking message about something that just happened, built on React Aria's toast region and queue. The host creates one queue with `createToastQueue`, renders it once in a `ToastRegion` and adds toasts whenever its own logic decides to. A toast shows a tone glyph, a title, an optional description, an optional action and a dismiss button, and never asks a question it waits on; a decision belongs in a modal dialog and a field's problem stays beside the field. `ToastList` draws a queue in place, for previews.

## UIC-TOAST-1 - Queue

### UIC-TOAST-1.1 - Adding toasts

`createToastQueue(options)` shall return a plain queue object that wraps React Aria's toast queue (exposed as `ariaQueue`, which regions and lists render). Its `add(content, options)` shall add a toast and return its key. Visible toasts are ordered newest first. `maxVisibleToasts` limits how many show at once; the others wait and appear as visible toasts close.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-1.2 - Lifetime

A toast shall close itself after `timeout` milliseconds, defaulting to the queue's `defaultTimeout` (5000 unless set); a `timeout` of 0 keeps it until it is dismissed. A toast's timer runs only while it is shown. Hovering the region or moving focus into it shall pause every visible toast's timer, and leaving resumes each with the time that remained. Closing a toast calls its `onClose`.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-1.3 - Replacement

Adding a toast with the `id` of one still queued shall replace it: the old toast leaves without calling its `onClose`, and the new one takes the newest position with a fresh lifetime.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

### UIC-TOAST-1.4 - Closing early

`close(key)` shall remove one toast and `clear()` every toast; `clear` does not call `onClose`.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

## UIC-TOAST-2 - Region

### UIC-TOAST-2.1 - Landmark

`ToastRegion` shall render nothing while its queue is empty and, while it has toasts, portal a `ui-toast-region` landmark (`role="region"`, named by `aria-label` or by React Aria's localised count of notifications) into the document body, holding the toasts in an ordered list (`ui-toast-list`). The landmark is reachable with React Aria's landmark navigation (F6). Showing a toast never moves focus.

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

## UIC-TOAST-3 - Toast

### UIC-TOAST-3.1 - Tones

`tone` shall publish `data-tone` on the toast: `info` (the default; neutral news), `success` (the requested work finished), `warning` (it finished with a caveat, or something needs attention soon) or `danger` (it failed). The toast draws the tone's built-in glyph (`info`, `success`, `warning`, and `error` for `danger`), or the caller's `icon` (a glyph name or any icon node), as a decorative [Icon](ICON.md) in the `ui-toast__icon` slot.

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

Every toast shall have an [Icon Button](ICON-BUTTON.md) in the `ui-toast__close` slot, named by the provider's `dismiss` string, that closes it.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`, `e2e/toast.spec.ts`

### UIC-TOAST-3.5 - Hooks and caller attributes

Toasts, regions and lists shall carry the hooks below. `Toast`, `ToastRegion` and `ToastList` append the caller's `className` and forward caller `data-*` attributes and `id` to their root, so a host may also draw a queue's toasts with `Toast` in its own React Aria region. React Aria's interaction states are published on the region and on each toast.

Implementation: `src/components/toast/toast.tsx`
Verification: `src/components/toast/toast.test.tsx`

## Hooks

| Hook                    | Kind      | Values                                 | Description                                       |
| ----------------------- | --------- | -------------------------------------- | ------------------------------------------------- |
| `ui-toast-region`       | root      |                                        | The landmark (`role="region"`), portalled.        |
| `ui-toast-list`         | root      |                                        | The ordered list of toasts.                       |
| `ui-toast`              | root      |                                        | One toast (`role="alertdialog"`).                 |
| `ui-toast__icon`        | slot      |                                        | The tone glyph or custom icon (also `ui-icon`).   |
| `ui-toast__content`     | slot      |                                        | The live region holding title and description.    |
| `ui-toast__title`       | slot      |                                        | The title.                                        |
| `ui-toast__description` | slot      |                                        | The description, when set.                        |
| `ui-toast__action`      | slot      |                                        | The action button (also `ui-button`).             |
| `ui-toast__close`       | slot      |                                        | The dismiss button (also `ui-icon-button`).       |
| `data-tone`             | attribute | `info`, `success`, `warning`, `danger` | The toast's tone.                                 |
| `data-hovered`          | state     | `true`                                 | Pointer over the region (React Aria).             |
| `data-focused`          | state     | `true`                                 | Focus in the region or on the toast (React Aria). |
| `data-focus-visible`    | state     | `true`                                 | Keyboard focus (React Aria).                      |
