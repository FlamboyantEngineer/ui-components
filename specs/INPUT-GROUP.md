# Input Group

`InputGroup` places text and actions around a single-line or multiline input. Give the input itself an accessible name.

## UIC-INPUT-GROUP-1 - Composition

### UIC-INPUT-GROUP-1.1 - Input and adjoining parts

`InputGroup` shall render a group and report focus within it. Its direct control is `InputGroupInput` or `InputGroupTextarea`, which carries the respective `Input` or `Textarea` props and hooks. An `InputGroupAddon` positions any children at `inline-start` (the default), `inline-end`, `block-start` or `block-end`. Its static labels or adornments may use `InputGroupText`. Render the parts in their intended reading and tab order.

Implementation: `src/components/input-group/input-group.tsx`
Verification: `src/components/input-group/input-group.test.tsx`, `e2e/input-group.spec.ts`

### UIC-INPUT-GROUP-1.2 - Addon focus and button actions

Clicking plain addon content shall focus the directly grouped, enabled input or textarea. The caller may prevent that click's default. Interactive elements in an addon retain their own focus and actions. `InputGroupButton` uses the library's Button with `type="button"`, `variant="ghost"` and `size="xs"` by default. The other sizes are `sm`, `icon-xs` and `icon-sm`.

Implementation: `src/components/input-group/input-group.tsx`
Verification: `src/components/input-group/input-group.test.tsx`, `e2e/input-group.spec.ts`

## UIC-INPUT-GROUP-2 - Prompt submission

### UIC-INPUT-GROUP-2.1 - Keyboard and native form submission

With `usePromptSubmission`, wire `onSubmit` to the form and `onChange` and `onKeyDown` to the controlled textarea. Enter and Ctrl+Enter from the textarea shall request submission through its associated form, including native constraint validation. Shift+Enter inserts a newline, as does bare Enter with a coarse primary pointer. Input method composition keys shall be left to the input method.

Implementation: `src/components/message-composer/use-prompt-submission.ts`, `src/components/message-composer/composer-keys.ts`
Verification: `src/components/message-composer/use-prompt-submission.test.tsx`, `e2e/input-group.spec.ts`

### UIC-INPUT-GROUP-2.2 - Pending and rejected submission

The prompt hook shall expose `canSubmit` and `isSubmitting`. The form stays on the page and sends one nonblank prompt at a time. It declines sending while disabled, pending a reply, or awaiting the submission callback's promise. Once accepted, the hook clears the prompt unless the reader has changed it since sending. If sending fails, the prompt stays and the error is reported to `onSubmitError`, or rethrown if none is provided.

Implementation: `src/components/message-composer/use-prompt-submission.ts`, `src/utils/use-draft-submission.ts`
Verification: `src/components/message-composer/use-prompt-submission.test.tsx`

## Hooks

| Hook                      | Kind      | Values                                                   | Description                             |
| ------------------------- | --------- | -------------------------------------------------------- | --------------------------------------- |
| `ui-input-group`          | root      |                                                          | The group containing all parts.         |
| `ui-input-group__addon`   | slot      |                                                          | Text or actions next to the control.    |
| `ui-input-group__control` | slot      |                                                          | The input or textarea.                  |
| `ui-input-group__button`  | slot      |                                                          | A Button in an addon.                   |
| `ui-input-group__text`    | slot      |                                                          | Text in an addon.                       |
| `data-focus-within`       | state     | `true`                                                   | Focus is inside the group.              |
| `data-focus-visible`      | state     | `true`                                                   | Keyboard focus is inside the group.     |
| `data-hovered`            | state     | `true`                                                   | The pointer is over the group.          |
| `data-disabled`           | state     | `true`                                                   | The group is marked disabled with ARIA. |
| `data-invalid`            | state     | `true`                                                   | The group is marked invalid with ARIA.  |
| `data-align`              | attribute | `inline-start`, `inline-end`, `block-start`, `block-end` | The addon's edge.                       |
| `data-group-size`         | attribute | `xs`, `sm`, `icon-xs`, `icon-sm`                         | The group button's size.                |
