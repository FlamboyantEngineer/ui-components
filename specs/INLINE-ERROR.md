# Inline Error

`InlineError` is compact feedback for a failed operation or a validation problem: a decorative error glyph, a message and an optional recovery button. It inherits the host's font size and draws no banner chrome. A message about the state of a whole surface is a [Banner](BANNER.md).

## UIC-INLINE-ERROR-1 - Contract

### UIC-INLINE-ERROR-1.1 - Alert

`InlineError` shall render a `<div>` with `role="alert"`, `aria-live="assertive"` and `aria-atomic="true"`, holding its children (text, a paragraph or a list) in the `ui-inline-error__message` slot. It renders exactly one alert; its parts add no live region of their own.

Implementation: `src/components/inline-error/inline-error.tsx`
Verification: `src/components/inline-error/inline-error.test.tsx`, `e2e/inline-error.spec.ts`

### UIC-INLINE-ERROR-1.2 - Glyph

The message shall follow the built-in `error` glyph, drawn as a decorative [Icon](ICON.md) in the `ui-inline-error__icon` slot and hidden from assistive technology.

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

## Hooks

| Hook                       | Kind | Values | Description                                  |
| -------------------------- | ---- | ------ | -------------------------------------------- |
| `ui-inline-error`          | root |        | The alert `<div>`.                           |
| `ui-inline-error__icon`    | slot |        | The decorative error glyph (also `ui-icon`). |
| `ui-inline-error__message` | slot |        | The message.                                 |
| `ui-inline-error__retry`   | slot |        | The recovery button (also `ui-button`).      |
