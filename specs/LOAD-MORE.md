# Load More

`LoadMore` is one control that fetches the next page of a collection, beside a list, a table or a conversation. The caller owns cursors, requests, errors and adding the fetched items. It is a [Button](BUTTON.md) (an [Action Button](ACTION-BUTTON.md) for promise-returning requests), so it renders Button's markup and hooks plus its own root class.

## UIC-LOAD-MORE-1 - Contract

### UIC-LOAD-MORE-1.1 - Control

`LoadMore` shall render a native `<button>` of type `button` carrying both `ui-button` and `ui-load-more`, `secondary` and `sm` unless `variant` and `size` say otherwise. Pointer, Enter and Space activation calls `onLoadMore`; the control never submits an enclosing form.

Implementation: `src/components/load-more/load-more.tsx`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.2 - Label and remaining count

The visible text shall be `label` or the provider's `loadMore` string, followed by `(N remaining)` (the provider's `remainingCount` text) when `remainingCount` is given, including zero. The count is normalized ([COUNT.md](COUNT.md)): fractions round down, and a negative value or one that is not a finite number is omitted rather than invented.

Implementation: `src/components/load-more/load-more.tsx`, `src/utils/count.ts`, `src/core/strings.ts`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.3 - Accessible name

With `itemLabel`, the accessible name shall be the complete visible text followed by the trimmed collection name ("Load more (12 remaining) messages"). Without it, the visible text names the control.

Implementation: `src/components/load-more/load-more.tsx`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.4 - Pending

While `isPending` is set, or while a promise returned by `onLoadMore` is unsettled, the control shall be pending as a Button is: it keeps focus and its visible text and count, refuses presses, sets `aria-disabled="true"` and `data-pending`, and draws its busy indicator named by `pendingLabel` or the provider's `loading` string. It adds no live region of its own. A rejected request reaches `onError`, or is rethrown without it.

Implementation: `src/components/load-more/load-more.tsx`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.5 - Disabled

`isDisabled` shall disable the control natively, independently of pending: it stays disabled after a request settles and never calls `onLoadMore`.

Implementation: `src/components/load-more/load-more.tsx`
Verification: `src/components/load-more/load-more.test.tsx`

### UIC-LOAD-MORE-1.6 - Hooks and caller attributes

`LoadMore` shall carry the hook below on the button alongside Button's hooks, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to the `<button>`.

Implementation: `src/components/load-more/load-more.tsx`
Verification: `src/components/load-more/load-more.test.tsx`

## Hooks

| Hook           | Kind | Values | Description                                                   |
| -------------- | ---- | ------ | ------------------------------------------------------------- |
| `ui-load-more` | root |        | The `<button>`, which also carries `ui-button` and its hooks. |
