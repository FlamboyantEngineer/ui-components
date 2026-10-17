# Form

`Form` is a form on React Aria's `Form` that validates the [fields](FIELD.md) inside it when it is submitted. Fields register with the nearest form: on submit the form shows every field's validation and, while any field has an error or is still being checked, blocks the submit and focuses the first such field. It hands its fields a validation mode, a validation behavior and the external errors a server returned, by field name. React Aria's form props (`action`, `method`, `encType`, `target`, `onSubmit`, `onReset`, `onInvalid`, `aria-label` and the others) pass through.

## UIC-FORM-1 - Contract

### UIC-FORM-1.1 - Form element

`Form` shall render React Aria's `Form`, a `<form>` element (`ui-form`), around its children, pass React Aria's form props through, append the caller's `className` and forward caller `data-*` attributes and `id` to it.

Implementation: `src/components/form/form.tsx`, `labs/reference/form.css`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.2 - Submit validation

On submit, `Form` shall show the validation of every field inside it (`revealValidation`, UIC-FIELD-3.7). While any enabled field's value has an error or is being checked (its `realtimeValidation` is `invalid` or `pending`), it prevents the submit, does not call `onSubmit` and moves focus to the first such field's control in document order. Otherwise it calls `onSubmit` with the event. A disabled field never blocks a submit.

Implementation: `src/components/form/form.tsx`, `src/components/field/field-form.ts`, `src/components/field/field-scope.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.3 - External errors

`validationErrors` (React Aria's prop: messages by field name, as a server returns them) shall show on the field whose `name` they name, as errors with the validity `customError`, whatever the field's validation mode (UIC-FIELD-3.9). An error clears once the field's value changes; until then it blocks a submit like any error (UIC-FORM-1.2). A new `validationErrors` object shows its errors again, so a caller keeps the object until the next answer.

Implementation: `src/components/form/form.tsx`, `src/components/field/field-validation.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.4 - Validation mode

`validationMode` shall set when the fields inside show their validation (UIC-FIELD-3.7), `submit` by default: a field shows nothing until the first submit, then follows its value. A field's own `validationMode` wins.

Implementation: `src/components/form/form.tsx`, `src/components/field/field-state.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

### UIC-FORM-1.5 - Native validation

`validationBehavior` shall pass to React Aria's `Form`, `native` by default, and become the validation behavior of the fields inside that set none (UIC-FIELD-3.10). In the `native` behavior the browser's constraint validation blocks a submit while a field's control reports its error as custom validity; the first `invalid` event of the blocked submit shows every field's validation and focuses its control, and the fields show their own messages instead of the browser's. In the `aria` behavior the form does not validate natively (`noValidate`).

Implementation: `src/components/form/form.tsx`, `src/components/field/field-form.ts`
Verification: `src/components/form/form.test.tsx`, `e2e/form.spec.ts`

## Hooks

| Hook      | Kind | Values | Description           |
| --------- | ---- | ------ | --------------------- |
| `ui-form` | root |        | The `<form>` element. |
