# Action Button

`ActionButton` is a [Button](BUTTON.md) with a pending lifecycle for actions that start asynchronous work (save, create, apply, upload). It renders Button's markup and hooks, so it adds none of its own.

## UIC-ACTION-BUTTON-1 - Pending lifecycle

### UIC-ACTION-BUTTON-1.1 - Pending while the action runs

When `onPress` returns a promise, `ActionButton` shall be pending (Button's `isPending`: spinner, `data-pending`, `aria-disabled="true"`, visible label kept) from the press until the promise settles. Its variant defaults to `primary`.

Implementation: `src/components/action-button/action-button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`, `e2e/action-button.spec.ts`

### UIC-ACTION-BUTTON-1.2 - No repeat activation

While pending, the button shall refuse further activation by pointer, keyboard or programmatic click, so the action runs once per press until it settles.

Implementation: `src/components/action-button/action-button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`, `e2e/action-button.spec.ts`

### UIC-ACTION-BUTTON-1.3 - Settling

After the action resolves or rejects, the button shall return to its idle state. A rejection shall reach `onError`; without `onError` it is rethrown rather than swallowed.

Implementation: `src/components/action-button/action-button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`, `e2e/action-button.spec.ts`

### UIC-ACTION-BUTTON-1.4 - Disabled

A disabled action button shall never start its action and shall stay disabled after an action settles.

Implementation: `src/components/action-button/action-button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`

### UIC-ACTION-BUTTON-1.5 - Controlled pending and pending name

A caller's `isPending` shall override the internal pending state. While pending the button keeps its accessible name, and its busy indicator is named by `pendingLabel`, or the provider's `loading` string. `runPendingAction` exposes the same lifecycle for hosts that run an action from elsewhere (for example a keyboard shortcut).

Implementation: `src/components/action-button/action-button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`

### UIC-ACTION-BUTTON-1.6 - Hint and shortcut

`ActionButton` shall pass Button's `tooltip` and `shortcut` through ([BUTTON.md](BUTTON.md)): the tooltip shows the hint and the chord, the button publishes `aria-keyshortcuts`, and both stay while the action is pending. A host that binds the chord runs the action through `runPendingAction`.

Implementation: `src/components/action-button/action-button.tsx`, `src/components/button/button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`, `e2e/action-button.spec.ts`

### UIC-ACTION-BUTTON-1.7 - Pending delay

`pendingDelay` (milliseconds, 0 by default) shall hold back the pending state, internal or controlled, until the action has run that long, so an action that settles sooner never flashes the spinner. The button refuses repeat presses from the first press either way. An action button is never a link, so it takes no `href`.

Implementation: `src/components/action-button/action-button.tsx`
Verification: `src/components/action-button/action-button.test.tsx`, `e2e/action-button.spec.ts`
