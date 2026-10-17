# Segmented Choice

`SegmentedChoice` picks one of a few mutually exclusive values of a setting, drawn as a run of segments, or with `selectionMode="multiple"` presses any number of them like a group of toggles. It is built on React Aria's `ToggleButtonGroup`, `ToggleButton` and `SelectionIndicator`. It changes a value and shows no panel; switching which section of a surface is shown is [Tabs](TABS.md).

## UIC-SEGMENTED-CHOICE-1 - Contract

### UIC-SEGMENTED-CHOICE-1.1 - Options and value

`SegmentedChoice` shall render one segment per entry of `options`, each a `ui-segmented-choice__segment` button named by its `label` (in the `ui-segmented-choice__label` slot) and publishing its value in `data-value`. The segment whose value equals `value` (or `defaultValue` when uncontrolled) is selected; `null` selects none. Picking another segment shall report its value through `onChange` and, when uncontrolled, select it.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.2 - Icons

An option's `icon` (a built-in glyph name or any icon node) shall render as a decorative [Icon](ICON.md) in the `ui-segmented-choice__icon` slot before the label, sized with the segment. The segment's name stays its label alone.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-1.3 - Sizes and sizing

`size` (`sm`, `md` by default, `lg`) shall publish `data-size`; the reference sheet draws 24, 28 and 32 pixel segments. `sizing` shall publish `data-sizing`: `equal` (the default) divides the available width evenly between segments, `content` sizes each segment to its label. The label slot publishes its text in `data-label`, so a stylesheet can reserve the width of a heavier selected weight and selecting a segment never resizes it.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.4 - Orientation

`orientation` (`horizontal` by default, or `vertical`) shall lay the segments out in a row or a column and publish React Aria's `data-orientation` on the root.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.5 - Hooks and caller attributes

`SegmentedChoice` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `ref`, `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-details` to its root.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-1.6 - Selection indicator

Each segment shall hold React Aria's selection indicator in the `ui-segmented-choice__indicator` slot, rendered while the segment is selected. When the selection moves, React Aria animates the indicator from the previous segment's position through any `translate` or size transition the stylesheet declares, so one thumb appears to slide between segments, and publishes `data-entering` and `data-exiting` on it.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.7 - Icon-only segments

With `iconOnly` every segment with an `icon` shall show only that icon, take its `label` as its accessible name (`aria-label`) and show the label in a [Tooltip](TOOLTIP.md) on hover and keyboard focus. The tooltip repeats the name, so it adds no description. The root publishes `data-icon-only`; a segment without an icon keeps its label.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.8 - Swapping the root

`render(props, state)` shall replace the group's `<div>` as React Aria's `render` does ([COMPOSITION.md](COMPOSITION.md)), with the hook classes, data attributes, the `aria-readonly` and `aria-invalid` the component adds, and the ref.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

## UIC-SEGMENTED-CHOICE-2 - Behaviour

### UIC-SEGMENTED-CHOICE-2.1 - Keyboard and accessibility

The root shall be a `radiogroup` named by `aria-label` or `aria-labelledby`, and each segment a native button with role `radio` and `aria-checked`. Tab shall enter and leave the group as one stop; the arrow keys of its orientation (mirrored in right-to-left locales) shall move focus between enabled segments, and Space or Enter shall pick the focused segment.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-2.2 - Picking the selected segment again

Picking the selected segment again shall leave the value unchanged by default. With `isClearable` it shall report `null`. While `isInherited` is set (the value in effect comes from a default or a parent rather than being set here), it shall instead report that value, so the caller can store it as an explicit choice.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-2.3 - Inherited value

`isInherited` shall publish `data-inherited` on the root while the selected segment stays marked with `data-selected`, so a stylesheet can mute an inherited value. A caller explains where the value comes from with `aria-describedby`.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-2.4 - Multiple selection

With `selectionMode="multiple"` the root shall be a `toolbar` (a `group` inside another toolbar) whose segments are buttons with `aria-pressed`, each pressed or released on its own. `value` and `defaultValue` are lists of values, and `onChange` receives the pressed values in option order. The root publishes `data-selection-mode` (`single` by default, or `multiple`). `isInherited` and `isClearable` apply to single selection only.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `src/components/segmented-choice/choice-selection.ts`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-2.5 - Form submission

With `name`, the group shall render one hidden input with that name per selected value, so a form submits the value (nothing for an empty choice, every pressed value for a multiple one). A disabled group's inputs are disabled and submit nothing.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

## UIC-SEGMENTED-CHOICE-3 - States

### UIC-SEGMENTED-CHOICE-3.1 - Disabled

`isDisabled` shall disable every segment natively and publish React Aria's `data-disabled` on the root and the segments. An option's `isDisabled` disables only its segment, which arrow keys then skip.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-3.2 - Read-only

`isReadOnly` shall keep the segments focusable and the selected one marked, ignore picking, set `aria-readonly="true"` on the group and publish `data-readonly`.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-3.3 - Invalid

`isInvalid` shall set `aria-invalid="true"` on the group and publish `data-invalid`.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-3.4 - Interaction states

Segments shall publish React Aria's states: `data-selected`, `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

## Hooks

| Hook                             | Kind      | Values                   | Description                                         |
| -------------------------------- | --------- | ------------------------ | --------------------------------------------------- |
| `ui-segmented-choice`            | root      |                          | The group (`<div>`, a `radiogroup` or `toolbar`).   |
| `ui-segmented-choice__segment`   | slot      |                          | One segment (`<button>`, role `radio` when single). |
| `ui-segmented-choice__indicator` | slot      |                          | The selection indicator inside a selected segment.  |
| `ui-segmented-choice__icon`      | slot      |                          | A segment's leading icon (also `ui-icon`).          |
| `ui-segmented-choice__label`     | slot      |                          | A segment's label text.                             |
| `data-size`                      | attribute | `sm`, `md`, `lg`         | Segment block size.                                 |
| `data-sizing`                    | attribute | `equal`, `content`       | How segments share the width.                       |
| `data-orientation`               | attribute | `horizontal`, `vertical` | Layout and arrow-key axis (React Aria).             |
| `data-selection-mode`            | attribute | `single`, `multiple`     | One value, or independent toggles.                  |
| `data-value`                     | attribute |                          | A segment's option value.                           |
| `data-label`                     | attribute |                          | A label's text, for reserving its selected width.   |
| `data-icon-only`                 | state     | `true`                   | Segments show only their icons.                     |
| `data-inherited`                 | state     | `true`                   | The value in effect is inherited.                   |
| `data-readonly`                  | state     | `true`                   | Read-only.                                          |
| `data-invalid`                   | state     | `true`                   | Invalid.                                            |
| `data-disabled`                  | state     | `true`                   | The group or a segment is disabled (React Aria).    |
| `data-selected`                  | state     | `true`                   | The selected segment (React Aria).                  |
| `data-hovered`                   | state     | `true`                   | Pointer over a segment.                             |
| `data-pressed`                   | state     | `true`                   | A segment is being pressed.                         |
| `data-focused`                   | state     | `true`                   | A segment is focused.                               |
| `data-focus-visible`             | state     | `true`                   | A segment has keyboard focus.                       |
| `data-entering`                  | state     | `true`                   | The indicator is entering (React Aria).             |
| `data-exiting`                   | state     | `true`                   | The indicator is exiting (React Aria).              |
