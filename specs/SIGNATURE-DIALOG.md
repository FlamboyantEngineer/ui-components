# Signature Dialog

`SignatureDialog` is a [Modal](MODAL.md) that binds the signer's identity to an action, as an electronic signature does: it shows what is signed, states or asks the meaning of the signature, may ask for a reason and a drawn signature ([Signature Pad](SIGNATURE-PAD.md)), and asks the signer to enter their password again (or their user name and password) before Sign hands everything to an asynchronous `onSign`. A failure shows its error and keeps the dialog open. The dialog never keeps the credentials: they live in the dialog's body and leave with it.

## UIC-SIGNATURE-DIALOG-1 - Structure

### UIC-SIGNATURE-DIALOG-1.1 - Modal and summary

`SignatureDialog` shall render a `Modal` named by `title`, whose overlay also carries `ui-signature-dialog`, whose body starts with its children (what is signed: a summary of the change, a count) in `ui-signature-dialog__summary` when it has any, and whose footer holds Cancel and the Sign action, labelled by `confirmLabel` or the provider string `sign`. It takes the modal's `isOpen`, `defaultOpen`, `onOpenChange` and `size`; focus starts on the first entry and returns to where it was on close (UIC-MODAL-3).

Implementation: `src/components/signature-dialog/signature-dialog.tsx`, `src/core/common-strings.ts`, `labs/reference/signature-dialog.css`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`, `e2e/signature-dialog.spec.ts`

### UIC-SIGNATURE-DIALOG-1.2 - Meaning

A dialog with one meaning shall state it in `ui-signature-dialog__meaning` after the provider string `signatureMeaning` ("Meaning of signature: Approved"). With several, it shall show a required [Radio Group](RADIO-GROUP.md) of them named by `signatureMeaning`, each radio labelled by the meaning's `label` and described by its `description`, with none chosen at first, so the signer chooses deliberately.

Implementation: `src/components/signature-dialog/signature-form.tsx`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`, `e2e/signature-dialog.spec.ts`

### UIC-SIGNATURE-DIALOG-1.3 - Reason and drawn signature

`reason` shall ask for a reason in a multiline [Text Field](TEXT-FIELD.md) named by the provider string `signatureReason`: `optional` (the default) asks without requiring it, `required` requires it and `none` leaves it out. `drawing` shall ask the same way for a drawn or typed signature in a `SignaturePad` named by the provider string `signature` (`none` by default).

Implementation: `src/components/signature-dialog/signature-form.tsx`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`, `e2e/signature-dialog.spec.ts`

### UIC-SIGNATURE-DIALOG-1.4 - Credentials

The dialog shall show who signs, from `userName`, in `ui-signature-dialog__signer` (the provider string `signingAs`: "Signing as Ada Lovelace"), followed by a required password Text Field named by the provider string `password` (`type="password"`, `autoComplete="current-password"`). With `credentials="username-password"` a required user name Text Field (`userName`, `autoComplete="username"`) comes before the password, and the user name signed with is the one typed.

Implementation: `src/components/signature-dialog/signature-form.tsx`, `src/core/common-strings.ts`, `src/core/content-strings.ts`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`, `e2e/signature-dialog.spec.ts`

### UIC-SIGNATURE-DIALOG-1.5 - Hooks and caller attributes

`SignatureDialog` shall carry the hooks below on top of the modal's, its form's and its fields', append the caller's `className`, forward caller `data-*` attributes to the overlay and `id` to the dialog element. The entries sit in a [Form](FORM.md) (`ui-signature-dialog__form`).

Implementation: `src/components/signature-dialog/signature-dialog.tsx`, `src/components/signature-dialog/signature-form.tsx`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`

## UIC-SIGNATURE-DIALOG-2 - Signing

### UIC-SIGNATURE-DIALOG-2.1 - Validation before signing

Sign (pressed, or Control+Enter) shall submit the dialog's form through its ref: while an entry is missing (a meaning to choose, a required reason or drawing, a user name or the password) every entry shows its validation, focus moves to the first invalid one and `onSign` is not called.

Implementation: `src/components/signature-dialog/signature-form.tsx`, `src/components/form/form.tsx`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`, `e2e/signature-dialog.spec.ts`

### UIC-SIGNATURE-DIALOG-2.2 - Signing and errors

Once every entry passes, Sign shall call `onSign` with the `SignatureDetails`: the user name, the password, the chosen meaning's `id`, the reason (empty text when none) and the signature (`null` when none). While a returned promise runs, Sign is pending (UIC-MODAL-5.2); when it resolves the dialog closes, and when it rejects (or `onSign` throws) the dialog stays open, the footer announces the error's message (UIC-MODAL-5.3) and the password is cleared for the next attempt, the other entries kept. Cancel and Escape close the dialog without calling `onSign`, and each opening starts with empty entries.

Implementation: `src/components/signature-dialog/signature-dialog.tsx`, `src/components/signature-dialog/signature-form.tsx`
Verification: `src/components/signature-dialog/signature-dialog.test.tsx`, `e2e/signature-dialog.spec.ts`

## Hooks

| Hook                           | Kind | Values | Description                                      |
| ------------------------------ | ---- | ------ | ------------------------------------------------ |
| `ui-signature-dialog`          | root |        | The modal overlay, alongside `ui-modal`.         |
| `ui-signature-dialog__summary` | slot |        | What is signed, at the start of the body.        |
| `ui-signature-dialog__form`    | slot |        | The form around the entries (also `ui-form`).    |
| `ui-signature-dialog__meaning` | slot |        | The stated meaning of a dialog with one meaning. |
| `ui-signature-dialog__signer`  | slot |        | Who signs, above the credentials.                |
