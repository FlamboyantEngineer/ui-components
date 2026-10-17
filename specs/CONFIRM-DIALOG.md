# Confirm Dialog

`ConfirmDialog` asks the reader a yes-or-no question in a [Modal](MODAL.md): a title, a message saying what confirming does, Cancel and a confirm action. It replaces the browser's native confirmation, which ignores the page's styles and focus rules. `confirm(controller, options)` opens one through a [Modal Controller](MODAL-CONTROLLER.md) and resolves to the answer, for code that cannot render it.

## UIC-CONFIRM-DIALOG-1 - Decision

### UIC-CONFIRM-DIALOG-1.1 - Structure

`ConfirmDialog` shall render a `Modal` with `role="alertdialog"`, named by `title`, whose body shows `message` in the `ui-confirm-dialog__message` slot, describing the dialog, followed by any children. Its footer holds Cancel, labelled by `cancelLabel` or the provider's `cancel` string, and the confirm action, labelled by `confirmLabel` or the provider's `confirm` string. The modal's overlay also carries `ui-confirm-dialog`.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.2 - Outcomes

Confirming shall run `onConfirm` and then close the dialog without calling `onCancel`. When `onConfirm` returns a promise the confirm action is pending until it settles; a rejection keeps the dialog open with the error in its footer ([UIC-MODAL-5.3](MODAL.md#uic-modal-53---failed-actions)). Cancel, Escape and, with `isDismissable`, an outside press shall close it and call `onCancel` once. Every close reports `onOpenChange(false)`.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.3 - Safe focus

When the dialog opens, focus shall land on Cancel, the safe choice, or on the confirm action with `autoFocusConfirm`. When it closes, focus returns to the element focused when it opened.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.4 - Destructive tone

`tone="danger"` shall mark a destructive or irreversible decision: the modal publishes `data-tone="danger"` and the confirm action uses the `danger` button variant. The default is `neutral`.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.5 - Text messages

A message given as a string shall render as text: markup in it is shown, never interpreted.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`

## UIC-CONFIRM-DIALOG-2 - Imperative confirmation

### UIC-CONFIRM-DIALOG-2.1 - Awaiting an answer

`confirm(controller, options)` shall open a `ConfirmDialog` with `options` through `controller` and return a promise that resolves `true` once the reader confirms and `onConfirm` (if any) succeeds, and `false` when the dialog closes any other way (Cancel, Escape, an outside press, the controller's `closeAll`). The promise settles exactly once and the dialog leaves the controller when it closes.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

## UIC-CONFIRM-DIALOG-3 - Hooks

### UIC-CONFIRM-DIALOG-3.1 - Hooks and caller attributes

`ConfirmDialog` shall carry the hooks below on top of the modal's, append the caller's `className`, forward caller `data-*` attributes to the overlay and `id` to the dialog element.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`

## Hooks

| Hook                         | Kind | Values | Description                                        |
| ---------------------------- | ---- | ------ | -------------------------------------------------- |
| `ui-confirm-dialog`          | root |        | The modal overlay, alongside `ui-modal`.           |
| `ui-confirm-dialog__message` | slot |        | The message paragraph, which describes the dialog. |
