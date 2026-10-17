# Inline Error

`InlineError` is compact feedback for a failed operation or a validation problem: a decorative error glyph, a message and an optional recovery button. Its `tone` also covers a warning that does not block, a passed check and, with `isPending`, a check still running. It inherits the host's font size and draws no banner chrome. A message about the state of a whole surface is a [Banner](BANNER.md).

## UIC-INLINE-ERROR-1 - Contract

### UIC-INLINE-ERROR-1.1 - Alert

`InlineError` shall render a `<div>` with `role="alert"`, `aria-live="assertive"` and `aria-atomic="true"` (a polite status instead for the tones and pending state of [UIC-INLINE-ERROR-2](#uic-inline-error-2---tones-and-pending-checks)), holding its children (text, a paragraph or a list) in the `ui-inline-error__message` slot. It renders exactly one live region; its parts add none of their own.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-1.2 - Glyph

The message shall follow the built-in glyph of its tone (`error` for the default `danger`), drawn as a decorative [Icon](ICON.md) in the `ui-inline-error__icon` slot and hidden from assistive technology.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`

### UIC-INLINE-ERROR-1.3 - Recovery

With `onRetry`, the error shall draw a small secondary [Button](BUTTON.md) in the `ui-inline-error__retry` slot, labelled `retryLabel` or the provider's `retry` string. It is a native `type="button"` that never submits an enclosing form and calls `onRetry` on pointer, Enter and Space activation. Without `onRetry` no button renders. The reference sheet moves the button below the message when a narrow container cannot fit both.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-1.4 - Disabled and pending recovery

`isRetryDisabled` shall disable the recovery button so activation does nothing. When `onRetry` returns a promise, the button shall be pending ([Action Button](ACTION-BUTTON.md)) and refuse repeat activation until the promise settles; a rejection reaches `onRetryError`, or is rethrown without it. The caller owns the request and clears the error.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`

### UIC-INLINE-ERROR-1.5 - Hidden, hooks and caller attributes

`hidden` shall hide the error with the native `hidden` attribute while keeping the same element mounted. `InlineError` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`

## UIC-INLINE-ERROR-2 - Tones and pending checks

### UIC-INLINE-ERROR-2.1 - Tones

`tone` shall publish `data-tone`: `danger` (the default, a failure), `warning` (a problem that does not block) or `success` (a check that passed), and draw the tone's built-in glyph (`error`, `warning` or `success`). A `danger` message is an assertive alert; a `warning` or `success` message is a polite status (`role="status"`, `aria-live="polite"`), still atomic. Changing the tone of a mounted message updates the same element, so its next announcement follows the new urgency.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-2.2 - Pending check

`isPending` shall replace the glyph with a decorative `ui-inline-error__spinner` slot, publish `data-pending` and make the message a polite status whatever its tone, so a check still running ("Checking the name…") is announced without interrupting. It is never marked busy, which would defer the announcement. Without it neither the slot nor the attribute renders.

Implementation: `src/components/inline-error/inline-error.tsx`, `labs/reference/inline-error.css`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

## Hooks

| Hook                       | Kind      | Values                         | Description                                  |
| -------------------------- | --------- | ------------------------------ | -------------------------------------------- |
| `ui-inline-error`          | root      |                                | The alert or status `<div>`.                 |
| `ui-inline-error__icon`    | slot      |                                | The decorative tone glyph (also `ui-icon`).  |
| `ui-inline-error__spinner` | slot      |                                | The decorative busy indicator while pending. |
| `ui-inline-error__message` | slot      |                                | The message.                                 |
| `ui-inline-error__retry`   | slot      |                                | The recovery button (also `ui-button`).      |
| `data-tone`                | attribute | `danger`, `warning`, `success` | The outcome and its urgency.                 |
| `data-pending`             | state     | `true`                         | The check is still running.                  |
