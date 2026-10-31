# Load More

`LoadMore` is one control that fetches the next page of a collection, beside a list, a table or a conversation, on press or as it scrolls into view. A React Aria collection loads pages with its own sentinel instead ([COLLECTIONS.md](COLLECTIONS.md)). The caller owns cursors, requests, errors and adding the fetched items. It is a [Button](BUTTON.md) with an [Action Button](BUTTON.md)'s pending lifecycle for promise-returning requests, so it renders Button's markup and hooks plus its own root class.

## UIC-LOAD-MORE-1 - Contract

### UIC-LOAD-MORE-1.1 - Control

`LoadMore` shall render a native `<button>` of type `button` carrying both `ui-button` and `ui-load-more`, `secondary` and `sm` unless `variant` and `size` say otherwise. Pointer, Enter and Space activation calls `onLoadMore`; the control never submits an enclosing form.

Implementation: `src/components/load-more/load-more.tsx`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.2 - Label and remaining count

The visible text shall be `label` or the provider's `loadMore` string, followed by the count when `remainingCount` is given, including zero: the provider's `loadMoreWithRemaining` message joins them (`Load more (12 remaining)`), carrying the language's punctuation and number format. The count is normalized ([COUNT.md](COUNT.md)): fractions round down, and a negative value or one that is not a finite number is omitted rather than invented.

Implementation: `src/components/load-more/load-more.tsx`, `src/utils/count.ts`, `src/core/strings.ts`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.3 - Accessible name

With `itemLabel`, the accessible name shall be the complete visible text joined to the trimmed collection name by the provider's `loadMoreOf` message ("Load more (12 remaining) messages"). Without it, the visible text names the control.

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

### UIC-LOAD-MORE-1.7 - Loading on view

With `autoLoad`, the control shall also call `onLoadMore` each time it comes into view ([`useInView`](MEASUREMENT.md#uic-measurement-41---in-view)) while it is enabled and idle, so a list loads its next page as the reader scrolls to its end. Requests go through the same pending path as a press, one at a time, and never move focus. Staying in view never loads again on its own: a page that leaves the control in view, or a failed request, waits for the reader to scroll the control back into view or press it, so a request that adds nothing never repeats endlessly. The stylesheet keeps the control from anchoring scrolling (`overflow-anchor: none`), so the rows a page adds push it out of view instead of the scroll position following it. The control stays a button, so keyboard and assistive technology users load pages the same way.

Implementation: `src/components/load-more/load-more.tsx`, `src/utils/use-in-view.ts`, `labs/reference/load-more.css`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

### UIC-LOAD-MORE-1.8 - Loading ahead

With `autoLoad`, `scrollOffset` shall make the control count as in view while it is within that many heights of its scrolling container below the visible area ([UIC-MEASUREMENT-4.3](MEASUREMENT.md#uic-measurement-43---scroll-offset)), so the next page is requested before the reader reaches the end, under the same one-request and no-repeat rules. Without it the control loads only once it is actually visible.

Implementation: `src/components/load-more/load-more.tsx`, `src/utils/use-in-view.ts`
Verification: `src/components/load-more/load-more.test.tsx`, `e2e/load-more.spec.ts`

## Hooks

| Hook           | Kind | Values | Description                                                   |
| -------------- | ---- | ------ | ------------------------------------------------------------- |
| `ui-load-more` | root |        | The `<button>`, which also carries `ui-button` and its hooks. |
