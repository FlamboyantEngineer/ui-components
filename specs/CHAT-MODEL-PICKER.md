# Chat Model Picker

`ChatModelPicker` is a compact composer tool that shows the model the reader's messages go to and, when that model takes one, its reasoning effort, and opens a menu to choose them. The menu lists the models, each with its description, an optional badge and, for an unavailable model, the reason; then the efforts the chosen model takes. It builds on [Button](BUTTON.md), [Meta Line](META-LINE.md), [Badge](BADGE.md) and the [Menu](MENU.md) family (`MenuTrigger`, `MenuPopover`, `Menu`, `MenuSection`, `MenuItem`). The caller lists the models and efforts and reads the choice, controlled or not; [Chat](CHAT.md) places it among its composer's tools with `modelPicker`.

## UIC-CHAT-MODEL-PICKER-1 - Trigger

### UIC-CHAT-MODEL-PICKER-1.1 - Entry point

`ChatModelPicker` and its types (`ChatModelPickerProps`, `ChatModelOption`, `ChatEffortOption`) shall be exported from the package root and from `@flamboyantengineer/ui-components/chat-model-picker`. It loads no ProseMirror module, so the root stays free of the optional editor peers.

Implementation: `src/components/chat-model-picker/index.ts`, `src/index.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`

### UIC-CHAT-MODEL-PICKER-1.2 - Trigger

`ChatModelPicker` shall render one small `ghost` [Button](BUTTON.md) carrying the `ui-chat-model-picker` root, ending with a `chevron-down` glyph. Its label is a [Meta Line](META-LINE.md) of the current model's `label` (`ui-chat-model-picker__model`) and, while the model takes an effort, the current effort's `label` (`ui-chat-model-picker__effort`), as in "Balanced · High". The root publishes `data-has-effort` while the model takes an effort. The button is named by the provider string `chatModelTrigger` from the model's and the effort's labels ("Model: Balanced, High effort", or "Model: Classic" without an effort), which holds the labels in the order the trigger shows them so that its name contains its visible text, and reports the menu in `aria-haspopup` and `aria-expanded`. Without models it renders nothing.

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`, `src/core/chat-model-picker-strings.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

### UIC-CHAT-MODEL-PICKER-1.3 - Disabled

With `isDisabled`, the trigger shall be disabled (`data-disabled`) and the menu shall not open.

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`

### UIC-CHAT-MODEL-PICKER-1.4 - Hooks, strings and caller attributes

`ChatModelPicker` shall carry the hooks below, append the caller's `className` and forward `id` and caller `data-*` attributes to its root. Its strings come from the provider (`chat-model-picker-strings.ts`).

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`, `src/core/chat-model-picker-strings.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`

## UIC-CHAT-MODEL-PICKER-2 - Menu

### UIC-CHAT-MODEL-PICKER-2.1 - Sections

Pressing the trigger shall open a menu (`ui-chat-model-picker__menu`, also `ui-menu`) in a [Menu Popover](MENU.md#uic-menu-43---popover) above the trigger's start, flipping below when there is no room, and labelled by the trigger. It holds a section titled by the provider string `chatModel` with one item per model of `models`, in order, then, only while the current model takes an effort, a section titled `chatEffort` with one item per effort it takes. Each section is a single selection whose current choice is checked.

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

### UIC-CHAT-MODEL-PICKER-2.2 - Models

Each model's item shall show its `label` followed, with a `badge`, by a small `info` [Badge](BADGE.md) holding it, and its `description` after them; the label is its type-to-select text. A model with `isDisabled` is unavailable: its item shows its `disabledReason` in place of its description (its description without a reason), stays reachable by keyboard with `aria-disabled="true"` and `data-disabled` so the reason can be read ([UIC-MENU-2.6](MENU.md#uic-menu-26---focusable-disabled-items)), and cannot be chosen: a press, Enter or Space changes nothing, reports nothing and leaves the menu open.

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

### UIC-CHAT-MODEL-PICKER-2.3 - Efforts

The efforts a model takes shall be those of `efforts` its own `efforts` ids name, in the order of `efforts`: every one when the model leaves `efforts` undefined, none when its list is empty, and none for any model when the picker has no `efforts`. Each effort's item shows its `label` and its `description`; the label is its type-to-select text.

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`, `src/components/chat-model-picker/use-chat-model-choice.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

### UIC-CHAT-MODEL-PICKER-2.4 - Choosing and keyboard

Choosing an available model or an effort, by pointer, Enter or Space, shall report it ([UIC-CHAT-MODEL-PICKER-3](#uic-chat-model-picker-3---state)) and close the menu, returning focus to the trigger. Enter, Space or Arrow Down on the trigger open the menu with focus on its first item and Arrow Up on its last; Arrow keys, Home and End move between items across both sections, typing moves to the item whose label starts with the typed characters, and Escape closes the menu and returns focus to the trigger (React Aria).

Implementation: `src/components/chat-model-picker/chat-model-picker.tsx`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

## UIC-CHAT-MODEL-PICKER-3 - State

### UIC-CHAT-MODEL-PICKER-3.1 - Model

The model shall follow the controlled pair convention ([UIC-COMPOSITION-5](COMPOSITION.md#uic-composition-5---controlled-state)): `model` with `onModelChange`, or uncontrolled from `defaultModel`. The current model is the controlled `model` while `models` lists it; otherwise the first available (not disabled) model among the held choice and `defaultModel`, else the first available model, else the first model. Choosing a model other than the current one calls `onModelChange` with its id.

Implementation: `src/components/chat-model-picker/use-chat-model-choice.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`

### UIC-CHAT-MODEL-PICKER-3.2 - Effort

The effort shall follow the same convention with `effort`, `defaultEffort` and `onEffortChange`. The current effort is the first of the controlled `effort`, the held choice, `defaultEffort` and the model's `defaultEffort` that the current model takes, else the first effort it takes; a model that takes none has no current effort. Choosing another effort calls `onEffortChange` with its id. When the reader chooses a model that does not take the current effort, the effort moves to that model's `defaultEffort` when it takes it, else to its first effort, and `onEffortChange` reports the move; a model that takes the current effort keeps it without a report, and a model that takes none leaves the held effort as it is for the next model that does.

Implementation: `src/components/chat-model-picker/use-chat-model-choice.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

### UIC-CHAT-MODEL-PICKER-3.3 - Persisted choice

With `persistKey`, the picker shall keep its uncontrolled model and effort in the provider's storage ([UIC-PROVIDER-6.1](PROVIDER.md#uic-provider-61---storage-adapter)) under that key, as a JSON object with `model` and `effort` ids, written as they change and read when it mounts or the key changes, so a picker mounted again, as after a reload, resumes the choice. A controlled value is never stored. A stored value that cannot be read counts as none, and a stored model or effort that is no longer listed, available or taken falls back as in [UIC-CHAT-MODEL-PICKER-3.1](#uic-chat-model-picker-31---model) and [UIC-CHAT-MODEL-PICKER-3.2](#uic-chat-model-picker-32---effort).

Implementation: `src/components/chat-model-picker/use-chat-model-choice.ts`
Verification: `src/components/chat-model-picker/chat-model-picker.test.tsx`, `e2e/chat-model-picker.spec.ts`

## Hooks

| Hook                           | Kind  | Values | Description                                                          |
| ------------------------------ | ----- | ------ | -------------------------------------------------------------------- |
| `ui-chat-model-picker`         | root  |        | The trigger (also `ui-button`).                                      |
| `ui-chat-model-picker__model`  | slot  |        | The current model's name on the trigger.                             |
| `ui-chat-model-picker__effort` | slot  |        | The current effort's name on the trigger, while the model takes one. |
| `ui-chat-model-picker__menu`   | slot  |        | The menu of models and efforts (also `ui-menu`).                     |
| `data-has-effort`              | state | `true` | The current model takes an effort, which the trigger shows.          |
