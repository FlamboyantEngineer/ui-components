# Confirm Dialog

`ConfirmDialog` asks the reader a yes-or-no question in a [Modal](MODAL.md): a title, a message saying what confirming does, Cancel and a confirm action, optionally a third action. It replaces the browser's native confirmation, which ignores the page's styles and focus rules. It can bring news (information, success, warning) with a glyph, acknowledge rather than ask, and open as a small popover against its trigger. `confirm(controller, options)`, `alert(controller, options)` and `prompt(controller, options)` open a confirmation, an acknowledgement and a request for text through a [Modal Controller](MODAL-CONTROLLER.md) and resolve to the answer, for code that cannot render them.

## UIC-CONFIRM-DIALOG-1 - Decision

### UIC-CONFIRM-DIALOG-1.1 - Structure

`ConfirmDialog` shall render a `Modal` with `role="alertdialog"`, named by `title`, whose body shows `message` in the `ui-confirm-dialog__message` slot, describing the dialog, followed by any children. Its footer holds Cancel, labelled by `cancelLabel` or the provider's `cancel` string, and the confirm action, labelled by `confirmLabel` or the provider's `confirm` string. The modal's overlay also carries `ui-confirm-dialog`.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.2 - Outcomes

Confirming shall run `onConfirm` and then close the dialog without calling `onCancel`. When `onConfirm` returns a promise the confirm action is pending until it settles; a rejection keeps the dialog open with the error in its footer ([UIC-MODAL-5.3](MODAL.md#uic-modal-53---failed-actions)). Cancel, Escape and, with `isDismissable`, an outside press shall close it and call `onCancel` once, also inside a `ModalTrigger` or `DialogTrigger` that holds the open state. Every close the dialog makes reports `onOpenChange(false)`.

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

### UIC-CONFIRM-DIALOG-1.6 - Third action

`secondaryActionLabel` shall add a third action between Cancel and the confirm action (the modal's secondary action, `ui-modal__secondary`), for a choice such as "Don't save" beside Cancel and Save. Pressing it shall run `onSecondaryAction` through the same lifecycle as the confirm action (pending while a returned promise runs, open with the error when it rejects) and then close the dialog without calling `onCancel` or `onConfirm`.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.7 - News tones and icon

`tone` shall also take `info`, `success` and `warning`, published in the modal's `data-tone`, for a dialog that brings news. The title shall start with a decorative icon (`ui-confirm-dialog__icon`, also `ui-icon`) inside the heading: by default the `info`, `success` or `warning` glyph for those tones and none for `neutral` and `danger`; `icon`, a built-in glyph name or any icon node, replaces it (`icon="error"` with `tone="danger"` marks an error), and `icon={null}` leaves it out. The icon does not change the dialog's name.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`, `labs/reference/confirm-dialog.css`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-1.8 - Acknowledgement

`cancelLabel={null}` shall leave Cancel out, for a dialog that only needs acknowledging; focus then starts on the confirm action. Escape and an outside press still close it and call `onCancel`.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`

### UIC-CONFIRM-DIALOG-1.9 - Anchored confirmation

With `placement`, inside a React Aria `DialogTrigger`, the confirmation shall open as a popover against its trigger ([UIC-MODAL-8.2](MODAL.md#uic-modal-82---anchored-dialog)) instead of over the page, for a quick decision next to the control that asked for it. Its dialog takes `role="dialog"`; focus starts on Cancel and returns to the trigger, and the outcomes are those of the modal confirmation.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

## UIC-CONFIRM-DIALOG-2 - Imperative confirmation

### UIC-CONFIRM-DIALOG-2.1 - Awaiting an answer

`confirm(controller, options)` shall open a `ConfirmDialog` with `options` through `controller` and return a promise that resolves `true` once the reader confirms and `onConfirm` (if any) succeeds, and `false` when the dialog closes any other way (Cancel, the third action after `onSecondaryAction`, Escape, an outside press, the controller's `closeAll`). The promise settles exactly once and the dialog leaves the controller when it closes.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-2.2 - Alert

`alert(controller, options)` shall open, through `controller`, a `ConfirmDialog` with `options` (tone `info` by default) and no Cancel, whose one action is labelled by `confirmLabel` or the provider's `ok` string and has focus, and return a promise that resolves once the dialog closes, by that action (after `onConfirm`, if any, succeeds), Escape, an outside press or `closeAll`.

Implementation: `src/components/confirm-dialog/imperative-dialogs.tsx`, `src/core/common-strings.ts`
Verification: `src/components/confirm-dialog/imperative-dialogs.test.tsx`, `e2e/confirm-dialog.spec.ts`

### UIC-CONFIRM-DIALOG-2.3 - Prompt

`prompt(controller, options)` shall open, through `controller`, a `Modal` titled `title`, described by `message`, holding a [Text Field](TEXT-FIELD.md) named by `label` that starts with `defaultValue` and has focus, with Cancel (`cancelLabel`) and a primary action labelled by `confirmLabel` or the provider's `ok` string. It returns a promise that resolves to the field's text when the reader presses the action, presses Enter in the field or Control+Enter, and to `null` when the dialog closes any other way. The promise settles once and the dialog leaves the controller.

Implementation: `src/components/confirm-dialog/imperative-dialogs.tsx`
Verification: `src/components/confirm-dialog/imperative-dialogs.test.tsx`, `e2e/confirm-dialog.spec.ts`

## UIC-CONFIRM-DIALOG-3 - Hooks

### UIC-CONFIRM-DIALOG-3.1 - Hooks and caller attributes

`ConfirmDialog` shall carry the hooks below on top of the modal's, append the caller's `className`, forward caller `data-*` attributes to the overlay and `id` to the dialog element.

Implementation: `src/components/confirm-dialog/confirm-dialog.tsx`
Verification: `src/components/confirm-dialog/confirm-dialog.test.tsx`

## Hooks

| Hook                         | Kind | Values | Description                                                    |
| ---------------------------- | ---- | ------ | -------------------------------------------------------------- |
| `ui-confirm-dialog`          | root |        | The modal overlay (or anchored popover), alongside `ui-modal`. |
| `ui-confirm-dialog__icon`    | slot |        | The decorative icon leading the title (also `ui-icon`).        |
| `ui-confirm-dialog__message` | slot |        | The message paragraph, which describes the dialog.             |
