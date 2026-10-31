# Save Status

`SaveStatus` tells the reader where an editor's changes stand: unsaved, saving, saved, failed with a way to retry, or offline. The caller owns the saving and passes the phase; the component words it, announces each change politely and can let the `saved` label fade away.

## UIC-SAVE-STATUS-1 - Contract

### UIC-SAVE-STATUS-1.1 - Phases

`SaveStatus` shall render a `ui-save-status` `<span>` publishing `phase` (`idle`, `dirty`, `saving`, `saved`, `error`, `offline`) in `data-phase`. Every phase but `idle` shows its label in the `ui-save-status__label` slot: the provider's `saveStatus` string for the phase (`Unsaved changes`, `Saving…`, `Saved`, `Not saved`, `Offline`), or the phase's entry in `labels`, such as the reason a save failed. `saved`, `error` and `offline` draw a decorative glyph before it in the `ui-save-status__icon` slot (`check`, `error`, `offline`). `idle` shows nothing.

Implementation: `src/components/save-status/save-status.tsx`, `src/core/content-strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/save-status/save-status.test.tsx`, `e2e/save-status.spec.ts`

### UIC-SAVE-STATUS-1.2 - Polite announcements

The glyph and label shall sit in a `ui-save-status__message` element with `role="status"`, rendered in every phase, so assistive technology announces each new label politely without moving focus.

Implementation: `src/components/save-status/save-status.tsx`
Verification: `src/components/save-status/save-status.test.tsx`, `e2e/save-status.spec.ts`

### UIC-SAVE-STATUS-1.3 - Retry

In the `error` phase with `onRetry`, a link-styled extra-small [Button](BUTTON.md) labelled by the provider's `retry` string shall follow the message in the `ui-save-status__retry` slot, outside the live region, and call `onRetry` when pressed. No other phase draws it.

Implementation: `src/components/save-status/save-status.tsx`
Verification: `src/components/save-status/save-status.test.tsx`, `e2e/save-status.spec.ts`

### UIC-SAVE-STATUS-1.4 - Hiding the saved label

With `hideSavedAfter`, the `saved` label shall leave `hideSavedAfter` milliseconds after the phase becomes `saved`; the root publishes `data-exiting` while the stylesheet's animations on it run, then the glyph and label are removed and `data-phase` stays `saved`. A label that appears publishes `data-entering` the same way. The reference sheet fades the label in and out unless the reader prefers reduced motion; without animations the states end at once and the label still leaves on schedule. Any other phase restarts the count, and without `hideSavedAfter` the label stays.

Implementation: `src/components/save-status/save-status.tsx`, `src/utils/use-delayed-flag.ts`, `src/utils/use-enter-exit.ts`, `labs/reference/save-status.css`
Verification: `src/components/save-status/save-status.test.tsx`, `src/utils/use-delayed-flag.test.ts`, `e2e/save-status.spec.ts`

### UIC-SAVE-STATUS-1.5 - Truncation

The label shall be a [Truncation Tooltip](TRUNCATION-TOOLTIP.md): when the stylesheet cuts it in a narrow band, the full text shows in a tooltip on hover.

Implementation: `src/components/save-status/save-status.tsx`, `labs/reference/save-status.css`
Verification: `src/components/save-status/save-status.test.tsx`, `e2e/save-status.spec.ts`

### UIC-SAVE-STATUS-1.6 - Hooks and caller attributes

`SaveStatus` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/save-status/save-status.tsx`
Verification: `src/components/save-status/save-status.test.tsx`

## Hooks

| Hook                      | Kind  | Values                                                 | Description                                              |
| ------------------------- | ----- | ------------------------------------------------------ | -------------------------------------------------------- |
| `ui-save-status`          | root  |                                                        | The status (`<span>`).                                   |
| `ui-save-status__message` | slot  |                                                        | The polite live region holding the glyph and the label.  |
| `ui-save-status__icon`    | slot  |                                                        | The phase's glyph (also `ui-icon`).                      |
| `ui-save-status__label`   | slot  |                                                        | The phase's label (also `ui-truncation-tooltip`).        |
| `ui-save-status__retry`   | slot  |                                                        | The Retry button after a failed save (also `ui-button`). |
| `data-phase`              | state | `idle`, `dirty`, `saving`, `saved`, `error`, `offline` | Where the changes stand.                                 |
| `data-entering`           | state | `true`                                                 | While a label's enter animations run.                    |
| `data-exiting`            | state | `true`                                                 | While the label's exit animations run.                   |
