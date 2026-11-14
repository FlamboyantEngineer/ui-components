# Inline Error

`InlineError` is compact feedback for a failed operation or a validation problem: a decorative error glyph, a message and optional suggested actions drawn as links right after it. Its `tone` also covers a warning that does not block, a passed check and, with `isPending`, a check still running. It inherits the host's font size and draws no banner chrome. A message about the state of a whole surface is a [Banner](BANNER.md).

## UIC-INLINE-ERROR-1 - Contract

### UIC-INLINE-ERROR-1.1 - Alert

`InlineError` shall render a `<div>` holding its children (text, a paragraph or a list) in the `ui-inline-error__message` slot, which carries `role="alert"`, `aria-live="assertive"` and `aria-atomic="true"` (a polite status instead for the tones and pending state of [UIC-INLINE-ERROR-2](#uic-inline-error-2---tones-and-pending-checks)). The message is the only live region: the glyph and the action links sit beside it, so an action's progress or a change to a link is never announced with the message. Its parts add no live region of their own.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-1.2 - Glyph

The message shall follow the built-in glyph of its tone (`error` for the default `danger`), drawn as a decorative [Icon](ICON.md) in the `ui-inline-error__icon` slot and hidden from assistive technology.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`

### UIC-INLINE-ERROR-1.3 - Recovery

With `onRetry`, the error shall draw a `link` variant [Button](BUTTON.md) of size `xs`, underlined on hover and keyboard focus, in the `ui-inline-error__retry` slot after the message, labelled `retryLabel` or the provider's `retry` string, like the [Save Status](SAVE-STATUS.md) retry. `retryIcon` draws a glyph before its label; there is none by default. It is a native `type="button"` that never submits an enclosing form and calls `onRetry` on pointer, Enter and Space activation. Without `onRetry` no link renders. The reference sheet flows the links with the message text, so a link sits right after the last word, takes the message's font size and wraps to the next line as a whole when it cannot fit.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-1.4 - Disabled and pending recovery

`isRetryDisabled` shall disable the Retry link so activation does nothing. When `onRetry` returns a promise, the link shall be pending ([Action Button](BUTTON.md)), drawing the library spinner, and refuse repeat activation until the promise settles; a rejection reaches `onRetryError`, or is rethrown without it. The caller owns the request and clears the error.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`

### UIC-INLINE-ERROR-1.5 - Hidden, hooks and caller attributes

`hidden` shall hide the error with the native `hidden` attribute while keeping the same element mounted. `InlineError` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its `<div>` root.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`

### UIC-INLINE-ERROR-1.6 - Suggested actions

`actions` shall draw one more link per entry after the Retry link, in order, each in the `ui-inline-error__action` slot and drawn like the Retry link: its `label`, its `icon` before the label when given (none by default), disabled by `isDisabled`, calling `onAction` on activation, pending while a returned promise runs and handing a rejection to its `onError`, or rethrowing it without one. Each entry's `id` keeps its link when the list changes, such as "Reload the current version" beside Retry.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

## UIC-INLINE-ERROR-2 - Tones and pending checks

### UIC-INLINE-ERROR-2.1 - Tones

`tone` shall publish `data-tone`: `danger` (the default, a failure), `warning` (a problem that does not block) or `success` (a check that passed), and draw the tone's built-in glyph (`error`, `warning` or `success`). A `danger` message is an assertive alert; a `warning` or `success` message is a polite status (`role="status"`, `aria-live="polite"`), still atomic. Changing the tone of a mounted message updates the same message element, so its next announcement follows the new urgency.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-2.2 - Pending check

`isPending` shall replace the glyph with the decorative library [Spinner](PROGRESS-BAR.md#uic-progress-bar-2---spinner) in the `ui-inline-error__spinner` slot, publish `data-pending` and make the message a polite status whatever its tone, so a check still running ("Checking the name…") is announced without interrupting. It is never marked busy, which would defer the announcement. Without it neither the slot nor the attribute renders.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

## Hooks

| Hook                       | Kind      | Values                         | Description                                               |
| -------------------------- | --------- | ------------------------------ | --------------------------------------------------------- |
| `ui-inline-error`          | root      |                                | The alert or status `<div>`.                              |
| `ui-inline-error__icon`    | slot      |                                | The decorative tone glyph (also `ui-icon`).               |
| `ui-inline-error__spinner` | slot      |                                | The decorative spinner while pending (also `ui-spinner`). |
| `ui-inline-error__message` | slot      |                                | The message.                                              |
| `ui-inline-error__retry`   | slot      |                                | The Retry link (also `ui-button`).                        |
| `ui-inline-error__action`  | slot      |                                | A suggested action link (also `ui-button`).               |
| `data-tone`                | attribute | `danger`, `warning`, `success` | The outcome and its urgency.                              |
| `data-pending`             | state     | `true`                         | The check is still running.                               |
