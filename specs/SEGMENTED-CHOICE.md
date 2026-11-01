# Segmented Choice

`SegmentedChoice` picks one of a few mutually exclusive values of a setting, drawn as a run of segments, or with `selectionMode="multiple"` presses any number of them like a group of toggles. It is built on React Aria's `ToggleButtonGroup`, `ToggleButton` and `SelectionIndicator`. It changes a value and shows no panel; switching which section of a surface is shown is [Tabs](TABS.md).

## UIC-SEGMENTED-CHOICE-1 - Contract

### UIC-SEGMENTED-CHOICE-1.1 - Options and value

`SegmentedChoice` shall render one segment per entry of `options`, each a `ui-segmented-choice__segment` button named by its `label` (in the `ui-segmented-choice__label` slot) and publishing its value in `data-value`. The segment whose value equals `value` (or `defaultValue` when uncontrolled) is selected; `null` selects none. Picking another segment shall report its value through `onChange` and, when uncontrolled, select it.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`, `e2e/boolean-field.spec.ts`

### UIC-SEGMENTED-CHOICE-1.2 - Icons

An option's `icon` (an imported icon component or rendered element) shall render as a decorative [Icon](ICON.md) in the `ui-segmented-choice__icon` slot before the label, sized with the segment. The segment's name stays its label alone.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-1.3 - Sizes and sizing

`size` (`xs`, `sm`, `md` by default, `lg`) shall publish `data-size`; the reference sheet draws the whole frame at the control height of that size (UIC-LABS-3.7). `sizing` shall publish `data-sizing`: `equal` (the default) divides the available width evenly between segments (in the reference sheet, a group sized to its content, such as one in a row of controls, gives every segment the widest label's width, so no label is cut), `content` sizes each segment to its label. The label slot publishes its text in `data-label`, so a stylesheet can reserve the width of a heavier selected weight and selecting a segment never resizes it. The reference label reserves room for glyph overhang, so the final glyph remains visible at fractional text widths, and it clips only sideways, to end a label too long for an equal segment in an ellipsis: block padding taken back by a negative margin keeps descenders (`g j p q y`) and accents (`É Å`), which reach past the line box, whole at every size without changing the segment's height, and count badges draw their digits whole within their fixed height.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.4 - Orientation

`orientation` (`horizontal` by default, or `vertical`) shall lay the segments out in a row or a column and publish `data-orientation` on the root.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.5 - Hooks and caller attributes

`SegmentedChoice` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `ref`, `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-details` to its root.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-1.6 - Selection indicator

Each segment shall hold a selection indicator in the `ui-segmented-choice__indicator` slot, rendered while the segment is selected. When the selection moves, the indicator animates from the previous segment's position through any `translate` or size transition the stylesheet declares, so one thumb appears to slide between segments, and publishes `data-entering` and `data-exiting` on it.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.7 - Icon-only segments

With `iconOnly` every segment with an `icon` shall show only that icon, take its `label` as its accessible name (`aria-label`) and show the label in a [Tooltip](TOOLTIP.md) on hover and keyboard focus. The tooltip repeats the name, so it adds no description ([Tooltip](TOOLTIP.md) `relationship="label"`, which keeps the segment's own name with its count). The root publishes `data-icon-only`; a segment without an icon (`undefined`, `null` or `false`) keeps its label. Turning `iconOnly` on or off, and an icon arriving or leaving, keeps each segment element, with its focus, selection, roving tab stop and disabled or pending state; a segment that shows its label has no tooltip.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-1.8 - Swapping the root

`render(props, state)`, typed `ElementRender<'div', SegmentedChoiceRenderState>`, shall replace the group's `<div>` ([COMPOSITION.md](COMPOSITION.md)): the caller's element receives the hook classes, data attributes, the `aria-readonly`, `aria-invalid` and `aria-busy` the component adds, and the ref, and `state` holds the group's `orientation` and `isDisabled`.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-1.9 - Counts

An option's `count` shall show a positive whole number after the label in the `ui-segmented-choice__count` slot, capped at `countMax` (99 by default) as `<max>+`, in the provider locale's digits ([COUNT.md](COUNT.md)); zero, negative and non-finite counts show nothing. The count is hidden from assistive technology and read in the segment's accessible name instead, joined to the label by the provider's `labelWithCount` string (`Open, 3`), also for an icon-only segment. The reference sheet draws one digit as a circle as wide as it is tall and widens more digits, or a capped `99+`, into a pill of the same height with the same inline padding, at every size and whether selected or not, without changing the segment's height.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `src/core/strings/common.ts`, `labs/reference/segmented-choice.css`
Verification: `src/components/segmented-choice/pending-change.test.tsx`, `e2e/segmented-choice.spec.ts`

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

### UIC-SEGMENTED-CHOICE-2.6 - Asynchronous change

When `onChange` returns a promise, the group shall show the new value at once and hold it pending until the promise settles: the root publishes `data-pending` and `aria-busy="true"`, and picks wait (they are ignored) meanwhile. Once the promise fulfils, an uncontrolled group keeps the new value and a controlled one shows the caller's `value`; once it rejects, the value in effect shows again. The caller reports a failure itself, for example in an [Inline Error](INLINE-ERROR.md) beside the group. A handler that returns no promise changes the value at once.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`, `src/components/segmented-choice/choice-selection.ts`, `src/components/segmented-choice/pending-change.ts`
Verification: `src/components/segmented-choice/pending-change.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-2.7 - Native reset

A native reset of the form the group is in (a reset button or `form.reset()`), in the document or inside a shadow root, shall put back the value the group had when it mounted, as the browser does for its own controls and as fields do: an uncontrolled group shows its `defaultValue` again (no value or no pressed values when it had none), so its segments, their ARIA state and the values it submits agree, and `onChange` reports that value when the value in effect differs, which is how a controlled group puts it back. The reset applies once every listener has seen it, and a reset a listener cancels with `preventDefault` changes nothing. A change still pending ([UIC-SEGMENTED-CHOICE-2.6](#uic-segmented-choice-26---asynchronous-change)) is dropped: its promise settles without effect.

Implementation: `src/components/segmented-choice/pending-change.ts`, `src/components/segmented-choice/segmented-choice.tsx`, `src/utils/use-native-reset.ts`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

## UIC-SEGMENTED-CHOICE-3 - States

### UIC-SEGMENTED-CHOICE-3.1 - Disabled

`isDisabled` shall disable every segment natively and publish `data-disabled` on the root and the segments. An option's `isDisabled` disables only its segment, which arrow keys then skip.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`, `e2e/segmented-choice.spec.ts`

### UIC-SEGMENTED-CHOICE-3.2 - Read-only

`isReadOnly` shall keep the segments focusable and the selected ones marked, ignore picking and publish `data-readonly`. A single-selection group (`radiogroup`) also sets `aria-readonly="true"`; WAI-ARIA allows no `aria-readonly` on the `toolbar` or `group` of multiple selection, so there the pressed states stay and the presses are ignored.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-3.3 - Invalid

`isInvalid` shall set `aria-invalid="true"` on the group and publish `data-invalid`.

Implementation: `src/components/segmented-choice/segmented-choice.tsx`
Verification: `src/components/segmented-choice/segmented-choice.test.tsx`

### UIC-SEGMENTED-CHOICE-3.4 - Interaction states

Segments shall publish their states: `data-selected`, `data-hovered`, `data-pressed`, `data-focused` and `data-focus-visible` (keyboard focus only).

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
| `ui-segmented-choice__count`     | slot      |                          | A segment's count after its label.                  |
| `data-size`                      | attribute | `xs`, `sm`, `md`, `lg`   | Segment block size.                                 |
| `data-sizing`                    | attribute | `equal`, `content`       | How segments share the width.                       |
| `data-orientation`               | attribute | `horizontal`, `vertical` | Layout and arrow-key axis (React Aria).             |
| `data-selection-mode`            | attribute | `single`, `multiple`     | One value, or independent toggles.                  |
| `data-value`                     | attribute |                          | A segment's option value.                           |
| `data-label`                     | attribute |                          | A label's text, for reserving its selected width.   |
| `data-icon-only`                 | state     | `true`                   | Segments show only their icons.                     |
| `data-inherited`                 | state     | `true`                   | The value in effect is inherited.                   |
| `data-readonly`                  | state     | `true`                   | Read-only.                                          |
| `data-invalid`                   | state     | `true`                   | Invalid.                                            |
| `data-pending`                   | state     | `true`                   | A change waits for the promise `onChange` returned. |
| `data-disabled`                  | state     | `true`                   | The group or a segment is disabled (React Aria).    |
| `data-selected`                  | state     | `true`                   | The selected segment (React Aria).                  |
| `data-hovered`                   | state     | `true`                   | Pointer over a segment.                             |
| `data-pressed`                   | state     | `true`                   | A segment is being pressed.                         |
| `data-focused`                   | state     | `true`                   | A segment is focused.                               |
| `data-focus-visible`             | state     | `true`                   | A segment has keyboard focus.                       |
| `data-entering`                  | state     | `true`                   | The indicator is entering (React Aria).             |
| `data-exiting`                   | state     | `true`                   | The indicator is exiting (React Aria).              |
