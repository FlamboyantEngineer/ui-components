# Form

`Form` is a form, built on React Aria's `Form`, that validates the [fields](FIELD.md) inside it when it is submitted. Fields register with the nearest form: on submit the form shows every field's validation and, while any field has an error or is still being checked, blocks the submit and focuses the first such field. It hands its fields a validation mode, a validation behavior and the external errors a server returned, by field name. It declares its own props: those three, `action`, `method`, `onSubmit`, the labelling props, `ref` and `children`.

## UIC-FORM-1 - Contract

### UIC-FORM-1.1 - Form element

`Form` shall render a `<form>` element (`ui-form`) around its children, with `action` (where a native submit sends the data), `method` (`FormMethod`: `get`, `post` or `dialog`) and the labelling props (`aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`), append the caller's `className` and forward caller `data-*` attributes and `id` to it.

Implementation: `src/components/form/form.tsx`, `labs/reference/form.css`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.2 - Submit validation

On submit, `Form` shall show the validation of every field inside it (`revealValidation`, UIC-FIELD-3.7). While any enabled field's value has an error or is being checked (its `realtimeValidation` is `invalid` or `pending`), it prevents the submit, does not call `onSubmit` and moves focus to the first such field's control in document order. Otherwise it calls `onSubmit` with the event. A disabled field never blocks a submit.

Implementation: `src/components/form/form.tsx`, `src/components/field/field-form.ts`, `src/components/field/field-scope.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.3 - External errors

`validationErrors` (`FieldValidationErrors`: messages by field name, as a server returns them) shall show on the field whose `name` they name, as errors with the validity `customError`, whatever the field's validation mode (UIC-FIELD-3.9). An error clears once the field's value changes; until then it blocks a submit like any error (UIC-FORM-1.2). A new `validationErrors` object shows its errors again, so a caller keeps the object until the next answer.

Implementation: `src/components/form/form.tsx`, `src/components/field/field-validation.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.4 - Validation mode

`validationMode` shall set when the fields inside show their validation (UIC-FIELD-3.7), `submit` by default: a field shows nothing until the first submit, then follows its value. A field's own `validationMode` wins.

Implementation: `src/components/form/form.tsx`, `src/components/field/field-state.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.5 - Native validation

`validationBehavior` (`FieldValidationBehavior`) shall set how the form validates, `native` by default, and become the validation behavior of the fields inside that set none (UIC-FIELD-3.10). In the `native` behavior the browser's constraint validation blocks a submit while a field's control reports its error as custom validity; the first `invalid` event of the blocked submit shows every field's validation and focuses its control, and the fields show their own messages instead of the browser's. In the `aria` behavior the form does not validate natively (`noValidate`).

Implementation: `src/components/form/form.tsx`, `src/components/field/field-form.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.6 - Form element ref

`ref` shall receive the `<form>` element, so code outside the form, such as a dialog's footer action, can submit it with `requestSubmit()` and get the same submit validation (UIC-FORM-1.2) as a submit button inside it.

Implementation: `src/components/form/form.tsx`
Verification: `src/components/form/form.test.tsx`

### UIC-FORM-1.7 - Problems of the fields

`Form` shall keep the issues each field inside it shows (its label and its issues, errors first, as its validation mode lets it show them, UIC-FIELD-3.7) in document order, updated whenever a field's shown issues or label change and when a field mounts or unmounts, so a [Problem List](PROBLEM-LIST.md) inside the form lists them and moves focus to a field's control. Each field gives the form its label and shown issues with its registration (`getLabel`, `getIssues`) and reports their changes through the scope's `onIssuesChange`. The form notifies once for all the fields that mount, unmount or change their issues in one commit, and sorts and reads the fields only when a problem list asks, so mounting or submitting a large form stays proportional to its size.

Implementation: `src/components/form/form.tsx`, `src/components/form/form-problems.ts`, `src/components/field/field-form.ts`, `src/components/field/field-scope.ts`
Verification: `src/components/form/form-problems.test.tsx`, `src/components/form/form.test.tsx`, `src/components/problem-list/problem-list.test.tsx`

## UIC-FORM-2 - Validity

### UIC-FORM-2.1 - Drafts block

The form's verdict shall count what its fields show, not only their values: a field whose control shows a draft that has not become a value (a date typed in part, a range with one end empty, typed text that is no colour, UIC-FIELD-3.11) blocks the form until the draft is corrected or put back, even while the field's value is the last one it accepted.

Implementation: `src/components/form/form-validity.ts`, `src/components/field/field-form.ts`
Verification: `src/components/form/form-validity.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-2.2 - Reading the verdict

`useFormValidity()` shall return the enclosing form's `FormValidity` (`null` outside a form): `isBlocked()` and `getBlockers()` read, at the moment they are called, the fields that a submit would block on, in document order, each a `FormBlocker` with its label, `invalid` or `pending` status, error message and `focus()`; `subscribe(listener)` calls the listener after that list changes, once for changes made in one commit; and `onValidityChange` receives the list as it changes. A field blocks as it blocks a submit (UIC-FORM-1.2): an error, including a required value, or a check in progress; a warning never blocks and a disabled field never counts. Fields that mount, unmount, reset, become disabled or enabled, or finish a check update the verdict. Reading or subscribing reveals no validation, moves no focus, touches no field and submits nothing, in every validation mode.

Implementation: `src/components/form/form-validity.ts`, `src/components/form/form.tsx`, `src/components/field/field-form.ts`
Verification: `src/components/form/form-validity.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-2.3 - Deliberate check

`validate()` shall do what a submit does before it goes through: show every field's validation and focus the first blocking field (its control, or when the control is a group its chosen option, else its first focusable element, such as date segments). It returns whether the form passes and submits nothing.

Implementation: `src/components/form/form-validity.ts`
Verification: `src/components/form/form-validity.test.tsx`

## Hooks

| Hook      | Kind | Values | Description           |
| --------- | ---- | ------ | --------------------- |
| `ui-form` | root |        | The `<form>` element. |
