# Wizard

`Wizard` frames a task done in steps, such as a file import or a new project: the list of [Steps](STEPS.md), the current step's panel, and Back, Skip, Next and Finish. The panel and its buttons are a [Form](FORM.md), so Next checks the step's fields exactly as a submit does, then the step's own check, which may be asynchronous, before moving on. Focus moves to each new step's heading. It renders inline or as the body of a [Modal](MODAL.md).

## UIC-WIZARD-1 - Structure

### UIC-WIZARD-1.1 - Parts

`Wizard` shall render a `ui-wizard` group holding a [Steps](STEPS.md) list (`ui-wizard__steps`) of every entry of `steps` with its `label`, `description` and `isOptional`, then a [Form](FORM.md) (`ui-wizard__form`) holding the current step's panel (`ui-wizard__panel`, a group named by its heading), its heading (`ui-wizard__heading`, the step's `label`), the step's `content`, and the `ui-wizard__footer` of buttons. Only the current step's panel renders; callers keep the values of earlier steps in their own state.

Implementation: `src/components/wizard/wizard.tsx`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-1.2 - Heading level

The heading's level shall be `headingLevel`, else one below the enclosing section's ([Section Header](SECTION-HEADER.md)), else 3.

Implementation: `src/components/wizard/wizard.tsx`
Verification: `src/components/wizard/wizard.test.tsx`

### UIC-WIZARD-1.3 - Buttons

The footer shall hold [Buttons](BUTTON.md) in the `ui-wizard__action` slot, each publishing `data-action`: `cancel` (the provider's `cancel` string) when `onCancel` is set, which it calls; `back` (`back`) on every step but the first; `skip` (`skip`) on an optional step that is not the last; and the primary submit button, `next` (`next`) or on the last step `finish` (`finishLabel`, else `finish`).

Implementation: `src/components/wizard/wizard.tsx`, `src/core/common-strings.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-1.4 - Orientation

`orientation` (`horizontal` by default, or `vertical`) shall publish `data-orientation` on the root and set the list of steps' orientation, so a stylesheet lays the steps above the panel or beside it.

Implementation: `src/components/wizard/wizard.tsx`, `labs/reference/wizard.css`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-1.5 - Hooks and caller attributes

`Wizard` shall carry the hooks below, append the caller's `className`, and forward `id`, `aria-label`, `aria-labelledby` and caller `data-*` attributes to its root.

Implementation: `src/components/wizard/wizard.tsx`
Verification: `src/components/wizard/wizard.test.tsx`

## UIC-WIZARD-2 - Navigation

### UIC-WIZARD-2.1 - Current step

The shown step shall be `currentId` when set (controlled), else starts at `defaultCurrentId` or the first step. Every move calls `onCurrentIdChange` with the step moved to. The list of steps marks steps before the shown one `complete` (or `skipped`), the shown one `current` and the ones after it `upcoming`.

Implementation: `src/components/wizard/wizard.tsx`, `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-2.2 - Next and Finish

Pressing Next or Finish, or Enter in a field, shall submit the form: the [Form](FORM.md) shows each field's validation and, while a field is invalid, keeps the step and focuses that field. Once the fields pass, the step's `validate` runs; returning `false` keeps the step, and returning a message keeps it and shows the message in an [Inline Error](INLINE-ERROR.md) (`ui-wizard__error`). Otherwise Next moves to the following step and Finish calls `onFinish`. While the check runs, or `onFinish`'s promise does, the primary button is pending, the other buttons and the list of steps are disabled, the root publishes `data-pending`, and a second submit is refused. A rejected check or finish shows the error's message, or the provider's `actionFailed` string.

Implementation: `src/components/wizard/wizard.tsx`, `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-2.3 - Failed step

While the shown step's check has failed, its entry in the list of steps shall have the `error` status, until the next attempt or move.

Implementation: `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-2.4 - Back and returning to a step

Back shall move to the previous step without checking the shown one, and pressing a `complete` or `skipped` step in the list of steps moves to it the same way.

Implementation: `src/components/wizard/wizard.tsx`, `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-2.5 - Skipping

Skip shall move to the next step without checking the shown one and mark it `skipped` in the list of steps, until it later passes through Next.

Implementation: `src/components/wizard/wizard.tsx`, `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-2.6 - Leaving a pending step

A Next or Finish shall belong to the step it was pressed on and the workflow it ran in (the steps' IDs, in order). `validate` receives an `AbortSignal` that aborts once the wizard shows another step (a controlled `currentId` that changes, or the reader's move), its steps are replaced by others, or it unmounts. From then the attempt is over: the wizard stops being pending and accepts a new submit at once, and the check's late answer, success or failure, neither moves, nor shows a failure, nor calls `onFinish`. An `onFinish` that has already started is the host's own operation: leaving it ends the pending state and ignores its outcome, but does not stop it. A second submit in the same turn is still refused while an attempt runs. An attempt keeps the steps, `validate` and `onFinish` it started with, so a check's answer only ever moves or finishes the workflow it checked: a parent that renders new but equivalent steps or callbacks while a check runs neither aborts it nor lends it its own `onFinish`. A wizard's workflow is its steps' IDs; a host that shows another record through the same step IDs renders a wizard per record (a `key` with the record's identity), so switching records unmounts the old wizard, which aborts its attempt and starts the new record afresh.

Implementation: `src/components/wizard/wizard.tsx`, `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

## UIC-WIZARD-3 - Accessibility

### UIC-WIZARD-3.1 - Focus follows the step

After every move made from the wizard (Next, Back, Skip or a step in the list), focus shall move to the new panel's heading, which is focusable only by script (`tabIndex={-1}`). The first render moves no focus.

Implementation: `src/components/wizard/wizard-navigation.ts`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

### UIC-WIZARD-3.2 - Inside a modal

A wizard shall work as the body of a [Modal](MODAL.md) that has no built-in actions: its buttons are the dialog's only footer, `onCancel` can close the dialog, and focus stays inside the dialog as the steps change.

Implementation: `src/components/wizard/wizard.tsx`
Verification: `src/components/wizard/wizard.test.tsx`, `e2e/wizard.spec.ts`

## Hooks

| Hook                 | Kind      | Values                                     | Description                                             |
| -------------------- | --------- | ------------------------------------------ | ------------------------------------------------------- |
| `ui-wizard`          | root      |                                            | The group around the steps and the form.                |
| `ui-wizard__steps`   | slot      |                                            | The list of steps (also `ui-steps`).                    |
| `ui-wizard__form`    | slot      |                                            | The form around the panel and buttons (also `ui-form`). |
| `ui-wizard__panel`   | slot      |                                            | The current step's panel.                               |
| `ui-wizard__heading` | slot      |                                            | The panel's heading.                                    |
| `ui-wizard__error`   | slot      |                                            | The failed check's message (also `ui-inline-error`).    |
| `ui-wizard__footer`  | slot      |                                            | The row of buttons.                                     |
| `ui-wizard__action`  | slot      |                                            | One footer button (also `ui-button`).                   |
| `data-orientation`   | attribute | `horizontal`, `vertical`                   | Steps above or beside the panel.                        |
| `data-action`        | attribute | `cancel`, `back`, `skip`, `next`, `finish` | Which footer button (on the action).                    |
| `data-pending`       | state     | `true`                                     | While a check or the finish runs.                       |
