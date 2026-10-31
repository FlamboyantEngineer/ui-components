# Decision Control

`DecisionControl` takes the reader's own decision: a choice of decisions on a [Segmented Choice](SEGMENTED-CHOICE.md) (Approve and Reject by default, or the scores of a vote), a comment that is optional, required, or required by the decision picked, and Submit. When the decision must be signed, Submit confirms through a [Signature Dialog](SIGNATURE-DIALOG.md) first. It sits in the action area of an [Approval Panel](APPROVAL-PANEL.md) or on its own.

## UIC-DECISION-CONTROL-1 - Contract

### UIC-DECISION-CONTROL-1.1 - Choice of decisions

`DecisionControl` shall render a `ui-decision-control` `<div>` holding a `Form` (`ui-decision-control__form`) named by its `ui-decision-control__label`, which reads `label`, else the provider's `yourDecision` string. The label also names a `SegmentedChoice` (`ui-decision-control__choice`, sized to content) with one segment per option of `options` (its `value`, `label` and `icon`), by default Approve (`check`) and Reject (`close`, which asks for a comment) from the provider's `approve` and `reject` strings.

Implementation: `src/components/decision-control/decision-control.tsx`, `src/core/strings/content.ts`
Verification: `src/components/decision-control/decision-control.test.tsx`, `e2e/decision-control.spec.ts`

### UIC-DECISION-CONTROL-1.2 - Picked decision

`value` (controlled) or `defaultValue` (none by default) shall pick the decision, and `onChange` receives the reader's pick. The root publishes the picked option's value as `data-decision`.

Implementation: `src/components/decision-control/decision-control.tsx`
Verification: `src/components/decision-control/decision-control.test.tsx`, `e2e/decision-control.spec.ts`

### UIC-DECISION-CONTROL-1.3 - Comment

A multi-line `TextField` (`ui-decision-control__comment`) labelled by the provider's `comment` string shall follow the choice unless `comment` is `none` and no option has `requiresComment`. It is required when `comment` is `required`, or when the picked option has `requiresComment`, so a scored vote can ask for a reason with its negative scores only.

Implementation: `src/components/decision-control/decision-parts.tsx`
Verification: `src/components/decision-control/decision-control.test.tsx`, `e2e/decision-control.spec.ts`

### UIC-DECISION-CONTROL-1.4 - Submit

A primary submit `Button` (`ui-decision-control__submit`) reading `submitLabel`, else the provider's `submitDecision` string, shall be disabled until a decision is picked. Submitting validates the form, showing a missing required comment on the field, then calls `onSubmit({ decision, comment, signature: null })`. While a returned promise is unsettled the button is pending and the root publishes `data-pending`; repeated submissions are refused immediately, including before that state renders. A synchronous throw or rejected promise shows its error's message, else the provider's `decisionFailed` string, in an `InlineError` (`ui-decision-control__error`) and keeps the comment; success clears the error, and clears the comment only while the decision and the comment are still the ones submitted, so a comment typed or a decision picked while the submission was pending stays. A submission that settles after the control unmounts changes nothing.

Implementation: `src/components/decision-control/decision-control.tsx`, `src/components/decision-control/decision-parts.tsx`, `src/core/strings/content.ts`, `src/utils/use-lifetime-signal.ts`
Verification: `src/components/decision-control/decision-control.test.tsx`, `src/components/decision-control/decision-control-submission.test.tsx`, `e2e/decision-control.spec.ts`

### UIC-DECISION-CONTROL-1.5 - Signed decisions

With `signature`, submitting a valid form shall open a `SignatureDialog` (`ui-decision-control__signature`) titled by the provider's `signDecision` string, with the picked decision's label as its only meaning, no reason, the comment as its summary, and the `userName`, `credentials` and `drawing` of `signature`. Signing calls `onSubmit({ decision, comment, signature })` with what the signer gave; the dialog shows a rejection's error and stays open, and closes and clears the comment on success.

Implementation: `src/components/decision-control/decision-parts.tsx`, `src/components/decision-control/decision-control.tsx`
Verification: `src/components/decision-control/decision-control.test.tsx`, `e2e/decision-control.spec.ts`

### UIC-DECISION-CONTROL-1.6 - Disabled

`isDisabled` shall disable the choice, the comment and Submit, and refuse form submissions. Disabling an open signature dialog shall abandon it and discard its credentials; re-enabling shall require a new Submit, retaining the decision and comment. A submission already handed to the caller may still finish.

Implementation: `src/components/decision-control/decision-control.tsx`
Verification: `src/components/decision-control/decision-control.test.tsx`

### UIC-DECISION-CONTROL-1.7 - Hooks and caller attributes

`DecisionControl` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/decision-control/decision-control.tsx`
Verification: `src/components/decision-control/decision-control.test.tsx`

## UIC-DECISION-CONTROL-2 - Accessibility

### UIC-DECISION-CONTROL-2.1 - Named form and choice

The form and the choice shall be named by the visible label, each segment by its option's label, and the comment by its own label; the segments are radios and the picked one is checked, and validation reaches the comment through its field's error message.

Implementation: `src/components/decision-control/decision-control.tsx`
Verification: `src/components/decision-control/decision-control.test.tsx`, `e2e/decision-control.spec.ts`

## Hooks

| Hook                             | Kind  | Values | Description                                              |
| -------------------------------- | ----- | ------ | -------------------------------------------------------- |
| `ui-decision-control`            | root  |        | The control (`<div>`).                                   |
| `ui-decision-control__form`      | slot  |        | The form (also `ui-form`).                               |
| `ui-decision-control__label`     | slot  |        | The visible label that names the form and the choice.    |
| `ui-decision-control__choice`    | slot  |        | The decisions (also `ui-segmented-choice`).              |
| `ui-decision-control__comment`   | slot  |        | The comment (also `ui-text-field`).                      |
| `ui-decision-control__error`     | slot  |        | Why submitting failed (also `ui-inline-error`).          |
| `ui-decision-control__submit`    | slot  |        | Submit (also `ui-button`).                               |
| `ui-decision-control__signature` | slot  |        | The signature dialog (also `ui-modal`).                  |
| `data-decision`                  | state |        | The picked decision's value (on the root).               |
| `data-pending`                   | state | `true` | While an unsigned submission is unsettled (on the root). |
