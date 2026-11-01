# People Picker

`PeoplePicker` is a field for choosing one person or group, or several. It is a configured [Combobox](COMBOBOX.md): it searches through the caller's `loadItems` as the reader types (UIC-COMBOBOX-5.1 to 5.3), lists the current user, the people the caller already knows and the people chosen recently before a search, draws each person with a [User Identity](USER-IDENTITY.md) row and shows the chosen people of a multiple picker as chips with their [Avatar](AVATAR.md). People are plain data (`id`, `name`, the avatar identity fields, `description`, `isDisabled`, `disabledReason`); the value is the chosen `id`, or the list of chosen ids.

## UIC-PEOPLE-PICKER-1 - Field

### UIC-PEOPLE-PICKER-1.1 - Combobox field

`PeoplePicker` shall render a `Combobox` whose root also carries `ui-people-picker`, handing it `label`, `description`, `errorMessage`, `placeholder`, `isDisabled`, `isReadOnly`, `isInvalid`, `isRequired`, `size` (`sm`, `md` by default, `lg`) and `searchDelay` unchanged, so the field follows the combobox's structure, states and keyboard behaviour (UIC-COMBOBOX-1 and UIC-COMBOBOX-2), and closes an open list for good when it locks (UIC-COMBOBOX-5.6).

Implementation: `src/components/people-picker/people-picker.tsx`, `labs/reference/people-picker.css`
Verification: `src/components/people-picker/people-picker.test.tsx`, `src/components/people-picker/people-picker-locking.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-1.2 - Single and multiple selection

With `selectionMode="single"` (the default) picking a person shall write their name to the input and call `onChange` with their `id`; with `multiple`, `value`, `defaultValue` and `onChange` hold the list of ids and each chosen person shows as a chip (UIC-COMBOBOX-3.1) that leads with their decorative avatar (`ui-people-picker__avatar`, also `ui-avatar`) in the chip's icon slot (UIC-COMBOBOX-3.5).

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

## UIC-PEOPLE-PICKER-2 - People

### UIC-PEOPLE-PICKER-2.1 - Person rows

Each option shall draw a `UserIdentity` (also `ui-people-picker__person`) with the person's avatar identity fields, name and `description`, sized `xs`, `sm` or `md` for a `sm`, `md` or `lg` picker. The option keeps the combobox's `option` role and the person's name as the text the input shows once picked.

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-2.2 - Groups

A person with `kind="group"` shall be told apart from people: their row publishes `data-kind="group"` (`person` otherwise) on `ui-people-picker__person`, and their avatar draws the group glyph (UIC-AVATAR rules), on the row and on the chip.

Implementation: `src/components/people-picker/people-picker.tsx`, `labs/reference/people-picker.css`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-2.3 - People who cannot be picked

A person with `isDisabled` shall be listed as a disabled option, which the arrow keys pass over and a press does not pick; their `disabledReason`, when given, replaces their description on the row, so the reader learns why.

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

## UIC-PEOPLE-PICKER-3 - Search and shortcuts

### UIC-PEOPLE-PICKER-3.1 - Searching people

`loadItems(query, signal)` shall search people and groups once the reader types, as the combobox's remote search does: after `searchDelay`, aborting a replaced search, with the search status in the empty list and further pages from `{ items, cursor }` results. Every person a search returns, on any page, stays known while the picker is mounted and is handed to the combobox as a known option (UIC-COMBOBOX-3.7), so their chip keeps their avatar and name, and a single input their name, after later results leave them out, including when the caller sets a value that holds them afterwards. Known people are not listed before a search; an id no source gives shows itself on a chip and empties a single input.

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-3.2 - The current user

Before a search (while the input is empty), the list shall start with `currentUser`, so the reader can pick themselves in one step. Wherever the current user is listed, their name is followed by the provider string `currentPerson` ("(you)") in `ui-people-picker__you`, which their option's accessible name includes.

Implementation: `src/components/people-picker/people-picker.tsx`, `src/core/strings/field.ts`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-3.3 - Recent people

Before a search, `recent` people other than the current user shall be listed, in the given order, in a section headed by the provider string `recentPeople`. Without recent people there is no section.

Implementation: `src/components/people-picker/people-picker.tsx`, `src/core/strings/field.ts`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-3.4 - Hooks and caller attributes

`PeoplePicker` shall carry the hooks below beside the combobox's, append the caller's `className` after `ui-people-picker`, forward caller `data-*` attributes to the combobox root, and hand `id` to the combobox, which gives it to its input.

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`

### UIC-PEOPLE-PICKER-3.5 - Known people

Before a search, `knownPeople` other than the current user shall be listed after the current user and before the recent people, in the given order and without a heading; a recent person among them is listed here only. They are known like people a search returned (UIC-PEOPLE-PICKER-3.1), so a value that holds them, such as a saved one, shows their names in the input or the chips before any search.

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

### UIC-PEOPLE-PICKER-3.6 - One copy of each person

The picker shall keep one copy of each person by id and draw every place from it: the row's identity, description and disabled reason, the option's label (the text the input shows once picked) and disabled state, and the chip's name and avatar. The copy the latest search returned wins, as the newest data; otherwise the caller's, the current user over a known person over a recent one. The current user's mark (UIC-PEOPLE-PICKER-3.2) goes by id, so it never picks which copy is drawn.

Implementation: `src/components/people-picker/people-picker.tsx`
Verification: `src/components/people-picker/people-picker.test.tsx`, `e2e/people-picker.spec.ts`

## Hooks

| Hook                       | Kind      | Values            | Description                                                  |
| -------------------------- | --------- | ----------------- | ------------------------------------------------------------ |
| `ui-people-picker`         | root      |                   | The combobox root (also `ui-combobox`).                      |
| `ui-people-picker__person` | slot      |                   | A person's row in the list (also `ui-user-identity`).        |
| `ui-people-picker__you`    | slot      |                   | The mark after the current user's name.                      |
| `ui-people-picker__avatar` | slot      |                   | A chip's avatar (also `ui-avatar`).                          |
| `data-kind`                | attribute | `person`, `group` | On a person's row: whether the entry is a person or a group. |
