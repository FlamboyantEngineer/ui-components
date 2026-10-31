# Choice Group

`ChoiceGroup` is a field for `Choice` children. With `selectionMode="single"` (the default), its value is a string or null and choices act as radios. With `selectionMode="multiple"`, its value is a string array and choices act as checkboxes, with an optional select-all parent. Both modes support rich labels, descriptions, swapped root elements, sizes, orientation, validation, dirty state, restore, undo, forms and the field menu. Standalone true/false input uses BooleanField.

## UIC-CHOICE-GROUP-1 - Contract

### UIC-CHOICE-GROUP-1.1 - Field control

`ChoiceGroup` shall render a `Field` around a radio group (`ui-choice-group__box`, role `radiogroup`, named by the field label), built with `useFieldControl`, holding its `children`, the `Choice` elements. Its root element is the field's root, which carries `ui-choice-group` beside `ui-field`. The value is the selected radio's `value`, or `null` while none is: a field given no value, committed value or default starts with none selected, and Clear selects none. Selecting a radio sets its value and commits it.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `labs/reference/choice-group.css`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-1.2 - Choice

`Choice` shall render a `<div>` (`ui-choice`) holding a `<label>` (`ui-choice__button`) around a visually hidden native radio input, a drawn indicator (`ui-choice__indicator`, hidden from assistive technology) and its children in `ui-choice__label`, which may be rich content (an icon, a badge, a price). Pressing the indicator or the label selects the radio. It takes `value` (the group's value while it is selected), `isDisabled`, `inputRef` (the native input), the labelling props (`aria-label` for a radio without text) and `render`, which replaces the root `<div>` with the caller's element (`ElementRender<'div', ChoiceRenderState>`, [COMPOSITION.md](COMPOSITION.md)) and receives its states: `isSelected`, `isDisabled`, `isReadOnly`, `isInvalid` and `isRequired`. A caller `id` goes on the input. A `Choice` renders inside a `ChoiceGroup`. Content that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no label slot; any other content, `0` included, draws it.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `labs/reference/choice-group.css`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-1.3 - Description

A radio's `description` shall render in `ui-choice__description` after its `<label>` and describe its input (`aria-describedby`). Content that renders nothing (`null`, `undefined`, a boolean or an empty string) draws no description; any other content, `0` included, draws it.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-1.4 - Orientation and size

`orientation` (`vertical` by default, or `horizontal`) shall lay the radios out in a column or a row, publish `data-orientation` on the box and set `aria-orientation` on the group. `size` (`xs`, `sm`, `md` by default, `lg`) is the field's size (UIC-FIELD-1.10), which also sizes the radios.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `labs/reference/choice-group.css`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-1.5 - Form value

With `name`, a form shall submit the selected radio's `value` under that name, and nothing while none is selected. Without one, the radios get a generated name so they still form one group. The group takes the field's props, `orientation`, `size` and its radios, and no other.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`

### UIC-CHOICE-GROUP-1.6 - Hooks and caller attributes

`ChoiceGroup` and `Choice` shall carry the hooks below, append the caller's `className` to their root and forward caller `data-*` attributes to it. A caller `id` on `ChoiceGroup` goes on the root, and the group's id derives from it (`<id>-control`).

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`

## UIC-CHOICE-GROUP-2 - Accessibility and keyboard

### UIC-CHOICE-GROUP-2.1 - Names and states

The group shall be named by the field label and described by the field's description, decoration and message; while invalid it carries `aria-invalid="true"` and `aria-errormessage` naming the message, and while required `aria-required="true"`. Each radio input is named by its label content, or by `aria-label`. The group and its radios publish `data-invalid`, `data-required`, `data-readonly` and `data-disabled`; each radio and its button publish `data-selected` while selected, and the button `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-2.2 - Keyboard

Tab shall enter the group as one stop, on the selected radio, or on the first enabled radio while none is selected, and leave it with the next Tab. The arrow keys move focus to the next or previous enabled radio, wrapping at the ends (Right and Left mirrored in right-to-left locales), and select it; Space selects the focused radio. Disabled radios are skipped.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-2.3 - Disabled and read-only

A radio's `isDisabled` shall disable its input natively and take it out of the arrow keys' path. A disabled group (`isDisabled`, or a disabled `Fieldset` around it) disables every radio. A read-only group keeps its radios focusable and its selection shown but refuses every pick, and its group carries `aria-readonly="true"`.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `src/components/field/field-state.ts`
Verification: `src/components/choice-group/choice-group.test.tsx`

## UIC-CHOICE-GROUP-3 - Field behaviour

### UIC-CHOICE-GROUP-3.1 - Validation, dirty state and undo

A required group with no listed radio selected shall be invalid (UIC-FIELD-3.1, UIC-CHOICE-GROUP-3.3). `ChoiceGroup` shows each validation status, shows dirty state with a restore button, undoes and redoes with the field's chords from its radios, and offers the field menu, whose Clear selects none.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `src/components/field/field.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-3.2 - Control reference

The field's control reference shall be the selected radio's input, or the first enabled radio's input while none is selected, the radio Tab reaches: a restore and a form's submit validation focus it, and the native behavior's custom validity (UIC-FIELD-3.10) blocks a native submit through it. A value set from outside the radios (restore, undo, redo, a menu action) while focus is in the group moves focus to the newly selected radio, as the arrow keys do.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`, `e2e/choice-group.spec.ts`

### UIC-CHOICE-GROUP-3.3 - Choices on screen

In both modes only the choices on screen shall count. A stored key whose `Choice` is removed, or that no `Choice` ever listed, stays in the value, so it returns with its choice and select-all keeps it (UIC-CHOICE-GROUP-4.4), but it is shown as nothing, submitted as nothing and does not fill a required group, which is invalid while no listed choice is selected. A selected disabled choice still counts: it fills a required group and, with `name`, is submitted through a hidden input, as a disabled input leaves its form. A disabled group submits nothing. `""` is a real choice value, which fills a required group. Before the choices are read (on the server) every stored key counts.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`
Verification: `src/components/choice-group/choice-group.test.tsx`, `src/components/choice-group/choice-group-multiple.test.tsx`

## UIC-CHOICE-GROUP-4 - Multiple selection

### UIC-CHOICE-GROUP-4.1 - Field control

`ChoiceGroup` shall render a `Field` around a checkbox group (`ui-choice-group__box`, role `group`, named by the field label), built with `useFieldControl`, holding one checkbox per `Choice` child, in order, named by its content and taking the field's `size`. Its root element is the field's root, which carries `ui-choice-group` beside `ui-field`. The value is the list of ticked values: a field given no value, committed value or default starts with none ticked, and Clear empties it. Toggling a box sets the new list and commits it. An option with `isDisabled` cannot be toggled.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `labs/reference/choice-group.css`
Verification: `src/components/choice-group/choice-group-multiple.test.tsx`, `e2e/choice-group-multiple.spec.ts`

### UIC-CHOICE-GROUP-4.2 - Form value

With `name`, a form shall submit each ticked option's `value` under that name. Multiple mode takes the field's props, `Choice` children, orientation, size and `selectAllLabel`.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group-multiple.test.tsx`

### UIC-CHOICE-GROUP-4.3 - Validation and accessibility

A required group with no listed option ticked shall be invalid (UIC-FIELD-3.1, UIC-CHOICE-GROUP-3.3). The group is described by the field's description, decoration and message; while invalid it and its boxes publish `data-invalid` and the boxes report `aria-invalid`. The group carries no `aria-errormessage`, which its role does not take. The field's control reference is the first enabled option's input, so a restore, a form's submit validation and the native behavior's custom validity (UIC-FIELD-3.10) use it.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group-multiple.test.tsx`, `e2e/choice-group-multiple.spec.ts`

### UIC-CHOICE-GROUP-4.4 - Select all

With `selectAllLabel`, the group shall draw a parent `Checkbox` first (`ui-choice-group__select-all`), named by that label and outside the group's value: ticked while every enabled option is ticked, mixed while only some are, empty otherwise. Pressing it ticks every enabled option, or clears them all when all are ticked, keeping disabled options as they are, and commits. It follows the field's read-only and disabled states and is disabled when no option is enabled.

Select-all membership checks shall use sets while preserving the order of values and keeping disabled and unlisted values unchanged.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group-multiple.test.tsx`, `e2e/choice-group-multiple.spec.ts`

### UIC-CHOICE-GROUP-4.5 - Field behaviour

`ChoiceGroup` shall show each validation status, refuse toggles while read-only or disabled, show dirty state with a restore button, undo and redo with the field's chords from its boxes, and offer the field menu, whose Clear empties the list.

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`, `src/components/field/field.tsx`
Verification: `src/components/choice-group/choice-group-multiple.test.tsx`, `e2e/choice-group-multiple.spec.ts`

### UIC-CHOICE-GROUP-4.6 - Hooks and caller attributes

`ChoiceGroup` shall carry the hooks below on top of the field's and the checkboxes', append the caller's `className` to its root and forward caller `data-*` attributes to it. A caller `id` goes on the root, and the group's id derives from it (`<id>-control`).

Implementation: `src/components/choice-group/choice-group.tsx`, `src/components/choice-group/choice-box.tsx`, `src/components/choice-group/choice.tsx`
Verification: `src/components/choice-group/choice-group-multiple.test.tsx`

## Hooks

| Hook                          | Kind      | Values                   | Description                                                            |
| ----------------------------- | --------- | ------------------------ | ---------------------------------------------------------------------- |
| `ui-choice-group`             | root      |                          | The field's root (also `ui-field`).                                    |
| `ui-choice-group__box`        | slot      |                          | The React Aria radio or checkbox group (role `radiogroup` or `group`). |
| `ui-choice`                   | root      |                          | A choice's `<div>`, around its button and description.                 |
| `ui-choice__button`           | slot      |                          | The `<label>` around the hidden input, the indicator and the label.    |
| `ui-choice__indicator`        | slot      |                          | The drawn indicator.                                                   |
| `ui-choice__label`            | slot      |                          | The label content.                                                     |
| `ui-choice__description`      | slot      |                          | The radio's description.                                               |
| `ui-choice-group__select-all` | slot      |                          | Parent checkbox for multiple choice.                                   |
| `data-selection-mode`         | attribute | `single`, `multiple`     | Selection behavior on root.                                            |
| `data-size`                   | attribute | `xs`, `sm`, `md`, `lg`   | On the group's root: radio size.                                       |
| `data-orientation`            | attribute | `horizontal`, `vertical` | On the box: layout and arrow-key axis (React Aria).                    |
| `data-selected`               | state     | `true`                   | On a radio and its button: selected (React Aria).                      |
| `data-hovered`                | state     | `true`                   | On a button: under the pointer (React Aria).                           |
| `data-pressed`                | state     | `true`                   | On a button: being pressed (React Aria).                               |
| `data-focused`                | state     | `true`                   | On a button: its input has focus (React Aria).                         |
| `data-focus-visible`          | state     | `true`                   | On a button: its input has keyboard focus (React Aria).                |
| `data-invalid`                | state     | `true`                   | On the box, a radio and its button: invalid (React Aria).              |
| `data-required`               | state     | `true`                   | On the box, a radio and its button: a value is required (React Aria).  |
| `data-readonly`               | state     | `true`                   | On the box, a radio and its button: read-only (React Aria).            |
| `data-disabled`               | state     | `true`                   | On the box, a radio and its button: disabled (React Aria).             |
