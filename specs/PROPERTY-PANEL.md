# Property Panel

`PropertyPanel` lays out the labelled settings of one subject, such as the options of a selected shape in an editor's side pane. It is a family: the panel holds collapsible `PropertySection`s (categories), `PropertyGroup`s of rows under an optional heading, collapsible `PropertyCard`s for a group of related settings, and `PropertyRow`s that pair a label with the caller's value or field. `PropertyStrip` with its `PropertyStripCell`s lays out several small controls in one row, and `PropertyIconGroup` names a run of icon buttons. The parts take their content from the caller; a [Property Scope](PROPERTY-SCOPE.md) filters them by a query, and a [Property Filter](PROPERTY-FILTER.md) adds the search box. Records compared in columns belong in a table, and a framed group of content outside a panel is a [Card](CARD.md).

## UIC-PROPERTY-PANEL-1 - Panel

### UIC-PROPERTY-PANEL-1.1 - Structure

`PropertyPanel` shall render a `<section>` named by its `aria-label` or `aria-labelledby`, holding its `header` in the `ui-property-panel__header` slot when one is given and its children in the `ui-property-panel__body` slot. A header that renders nothing draws no slot.

Implementation: `src/components/property-panel/property-panel.tsx`
Verification: `src/components/property-panel/property-panel.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-1.2 - Label layout

`labelLayout` shall publish `data-label-layout` on the panel: `responsive` (the default) lets the stylesheet stack each row's label over its control in a narrow panel, and `inline` keeps labels beside their controls at every width. The reference sheet puts labels on a 112 pixel column beside the control, stacks them below a panel width of 360 pixels in the `responsive` layout and widens the column to 128 pixels from 520 pixels.

Implementation: `src/components/property-panel/property-panel.tsx`, `labs/reference/property-panel.css`
Verification: `src/components/property-panel/property-panel.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-1.3 - Hooks and caller attributes

Every member of the family shall carry its hooks below, append the caller's `className` and forward caller `data-*` attributes to its root. `PropertyPanel`, `PropertyGroup`, `PropertyRow`, `PropertyStrip`, `PropertyStripCell` and `PropertyIconGroup` also forward `id`; a hook value the component writes wins over a caller attribute of the same name.

Implementation: `src/components/property-panel/property-panel.tsx`, `src/components/property-panel/property-section.tsx`, `src/components/property-panel/property-card.tsx`, `src/components/property-panel/property-row.tsx`, `src/components/property-panel/property-strip.tsx`
Verification: `src/components/property-panel/property-panel.test.tsx`

### UIC-PROPERTY-PANEL-1.4 - Sections opened together

Given `expandedKeys`, `defaultExpandedKeys` or `allowsMultipleExpanded`, the panel shall open and close its sections as a group, with React Aria's `DisclosureGroup` as its body: a section is open while its `id` (a generated key without one) is among the expanded keys, pressing its trigger toggles it there, and `onExpandedChange` reports the new keys. With `allowsMultipleExpanded={false}` opening a section closes the one open before (an accordion); it defaults to `true`, so `expandedKeys` holding every section's `id` opens them all and an empty set closes them all. A section's own `isExpanded`, `defaultExpanded` and `persistKey` then give way to the panel's, while a query still opens matching sections ([UIC-PROPERTY-SCOPE-1.2](PROPERTY-SCOPE.md#uic-property-scope-12---containers)). Cards keep their own state. Without any of these props each section keeps its own state. Giving or removing these props keeps the sections and everything inside them mounted, with their drafts, focus and local state; the panel's uncontrolled keys then start again from `defaultExpandedKeys`.

Implementation: `src/components/property-panel/property-panel.tsx`, `src/components/property-panel/property-disclosure.tsx`, `src/components/property-panel/property-section.tsx`, `src/components/property-panel/property-card.tsx`
Verification: `src/components/property-panel/property-panel.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-1.5 - Disabled and read-only panel

`isDisabled` shall disable every library field inside the panel through the field scope, as a disabled [Fieldset](FIELD.md#uic-field-102---shared-disabled-state) does, and publish `data-disabled` on the panel; `isReadOnly` shall make every field inside read-only (its control is read-only and its state refuses changes) and publish `data-readonly`. Section and card triggers stay usable, so the reader can still browse a locked panel. A panel inside a disabled form or fieldset stays disabled.

Implementation: `src/components/property-panel/property-panel.tsx`, `src/components/field/field-scope.ts`, `src/components/field/field-state.ts`
Verification: `src/components/property-panel/property-panel.test.tsx`, `e2e/property-panel.spec.ts`

## UIC-PROPERTY-PANEL-2 - Sections and cards

### UIC-PROPERTY-PANEL-2.1 - Section disclosure

`PropertySection` shall be a React Aria `Disclosure`: a heading (level 3 unless `headingLevel` chooses 1 to 6) holding the trigger button, which reports `aria-expanded`, controls the content and shows a chevron glyph (down while open, pointing to the inline end while closed) before the `title`. The content (`ui-property-section__content`) is a group labelled by the trigger, starting with the `description` when one is given, and stays mounted while the section is closed. A section is open unless `defaultExpanded` is `false`; `isExpanded` with `onExpandedChange` controls it, and `isDisabled` disables the trigger. The root publishes React Aria's `data-expanded`.

Implementation: `src/components/property-panel/property-section.tsx`, `src/components/expand-toggle/expand-toggle.tsx`
Verification: `src/components/property-panel/property-section.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-2.2 - Section count and meta

A section shall show a count in the trigger (`ui-property-section__count`, a small count `Badge`, which the reference sheet draws as a quiet tinted pill with muted digits, secondary to the title, in panels and filters alike): its `count` when given, zero included, with `countVariant` (`subtle` by default or `solid`) passed to the shared Badge, and otherwise the number of properties inside it when there is at least one. Each row inside counts as one property and each card as one. `meta` follows the count inside the trigger.

Implementation: `src/components/property-panel/property-section.tsx`, `src/components/property-scope/scope-tally.ts`
Verification: `src/components/property-panel/property-section.test.tsx`

### UIC-PROPERTY-PANEL-2.3 - Section actions

A section's `actions` shall render in the `ui-property-section__actions` slot after the heading, outside the trigger, so pressing an action never toggles the section.

Implementation: `src/components/property-panel/property-section.tsx`
Verification: `src/components/property-panel/property-section.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-2.4 - Remembered sections

With a `persistKey`, an uncontrolled section shall keep whether it is open through the provider storage under that key and start from the stored value the next time it mounts; a stored value that is not a boolean is ignored, so it starts from `defaultExpanded`. A controlled section ignores the key.

Implementation: `src/components/property-panel/property-disclosure.tsx`, `src/components/property-panel/property-section.tsx`
Verification: `src/components/property-panel/property-section.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-2.5 - Hidden sections

A section with `hidden` shall stay mounted, keeping its rows' state, while the native `hidden` attribute removes it from layout and navigation; its rows then count as no match for a query.

Implementation: `src/components/property-panel/property-section.tsx`
Verification: `src/components/property-panel/property-section.test.tsx`

### UIC-PROPERTY-PANEL-2.6 - Cards

`PropertyCard` shall be a React Aria `Disclosure` whose trigger shows the chevron, the `name` and the `summary` of the values inside, with `actions` after the trigger that do not toggle it. Its body (`ui-property-card__body`) stays mounted while closed. A card is closed unless `defaultExpanded` or `isExpanded` opens it, and counts as one property of its section.

Implementation: `src/components/property-panel/property-card.tsx`
Verification: `src/components/property-panel/property-card.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-2.7 - Overridden values

A row with `isOverridden` (a value set here rather than inherited) shall publish `data-overridden`. A section or card holding such a row, and a card with `isOverridden`, shall publish `data-overridden` and draw an override mark in its trigger (`ui-property-section__override`, `ui-property-card__override`): an image named by the provider string `containsOverrides`.

Implementation: `src/components/property-panel/property-disclosure.tsx`, `src/components/property-panel/property-section.tsx`, `src/components/property-panel/property-card.tsx`, `src/components/property-panel/property-row.tsx`, `src/core/strings.ts`
Verification: `src/components/property-panel/property-section.test.tsx`, `src/components/property-panel/property-card.test.tsx`

### UIC-PROPERTY-PANEL-2.8 - Revealing a field

Before a [Form](FORM.md) moves focus to a field inside a property panel (a blocked submit, `validate()`, a blocker's or a problem's `focus()`), the containers that hide it shall show it, through the field scope's `reveal` ([UIC-FIELD-3.12](FIELD.md#uic-field-312---revealed-before-focus)): each collapsed section or card around it opens, outermost first, and a row the query hides lifts the query ([UIC-PROPERTY-SCOPE-1.7](PROPERTY-SCOPE.md#uic-property-scope-17---lifting-the-query)). An uncontrolled section or card opens itself and reports it through `onExpandedChange`; a controlled one asks its owner through `onExpandedChange(true)`, and one the panel opens asks the panel, which reports the new keys. A field that is already visible opens nothing. The fields keep their values and validation whether hidden or shown, and a section hidden by its own `hidden` stays hidden.

Implementation: `src/components/property-panel/property-disclosure.tsx`, `src/components/property-panel/property-section.tsx`, `src/components/property-panel/property-card.tsx`, `src/components/property-panel/property-row.tsx`, `src/components/field/field-scope.ts`, `src/components/field/field-form.ts`
Verification: `src/components/property-panel/property-section.test.tsx`, `e2e/property-panel.spec.ts`

## UIC-PROPERTY-PANEL-3 - Rows and groups

### UIC-PROPERTY-PANEL-3.1 - Row structure

`PropertyRow` shall render its `label` in the `ui-property-row__label` slot, then the control slot holding its children followed by the `unit` and the `hint`, then the `description` and the `actions`, each slot only when given. A text label is drawn through `TextMatch`. In the reference sheet, rows in the panel body, a section, a group or a card body share that container's columns: the label column is as wide as the container's longest label, up to 40% of its width (a longer label wraps), with an 8-pixel gap before the controls, so a short label sits close to its control and every control in the container starts on one line; a row elsewhere takes a fixed label column. A field placed in a row adds no label column or gap of its own.

Implementation: `src/components/property-panel/property-row.tsx`, `labs/reference/property-panel.css`
Verification: `src/components/property-panel/property-row.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-3.2 - Label association

With `htmlFor` the label shall be a `<label>` for that control, so the control is named by it and pressing the label focuses it. Without `htmlFor` the label is a `<div>` and the control slot is a group named by it. The label's id is `<id>-label` from the row's `id`, or derives from a generated id.

Implementation: `src/components/property-panel/property-row.tsx`
Verification: `src/components/property-panel/property-row.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-3.3 - Row states

`isRequired` shall draw an asterisk after the label (`ui-property-row__required`), hidden from assistive technology since the control announces the requirement, and publish `data-required`. `wide` shall publish `data-wide`, from which the reference sheet puts the label above a large control spanning the row.

Implementation: `src/components/property-panel/property-row.tsx`, `labs/reference/property-panel.css`
Verification: `src/components/property-panel/property-row.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-3.4 - Groups

`PropertyGroup` shall render its rows under its `heading` (`ui-property-group__heading`, drawn through `TextMatch`) when one is given; a group with a heading is a `group` named by it, and one without is a plain run of rows.

Implementation: `src/components/property-panel/property-panel.tsx`
Verification: `src/components/property-panel/property-panel.test.tsx`

### UIC-PROPERTY-PANEL-3.5 - Strips

`PropertyStrip` shall lay out its `PropertyStripCell`s in one inline run. A cell shows its `letter` before its control, hidden from assistive technology with its `label` as the letter's native tooltip, so each control carries its own accessible name.

Implementation: `src/components/property-panel/property-strip.tsx`
Verification: `src/components/property-panel/property-strip.test.tsx`

### UIC-PROPERTY-PANEL-3.6 - Icon groups

`PropertyIconGroup` shall be a `group` named by its `aria-label` or `aria-labelledby` holding the caller's icon buttons, publishing `variant` as `data-variant`: `separate` (the default) frames each button, and `segmented` frames the run once with dividers.

Implementation: `src/components/property-panel/property-panel.tsx`, `labs/reference/property-panel.css`
Verification: `src/components/property-panel/property-panel.test.tsx`, `e2e/property-panel.spec.ts`

### UIC-PROPERTY-PANEL-3.7 - Inherited values and reset

`PropertyRow` given `inherited` shall show, after the control slot, the `ui-property-row__inherited` slot: the localized `inheritedValue` label (`ui-property-row__inherited-label`), the inherited `value` (`ui-property-row__inherited-value`) and its `source` when one is given (`ui-property-row__inherited-source`). Whether the row overrides that value comes only from `isOverridden`, never from the control's value, so an explicit empty value is an override like any other. An overridden row given `onReset` shall show, after the description, a reset button (`ui-property-row__reset`) named by the localized `resetToInherited` and described by the row's label; pressing it calls `onReset`, and the caller clears its own value. A row that is not overridden shows no reset button.

Implementation: `src/components/property-panel/property-row.tsx`, `labs/reference/property-panel.css`
Verification: `src/components/property-panel/property-row-inheritance.test.tsx`, `e2e/property-panel.spec.ts`

## Hooks

| Hook                                | Kind      | Values                  | Description                                                                                 |
| ----------------------------------- | --------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `ui-property-panel`                 | root      |                         | The panel's `<section>`.                                                                    |
| `ui-property-panel__header`         | slot      |                         | The header content.                                                                         |
| `ui-property-panel__body`           | slot      |                         | The sections, groups and rows (a disclosure group while the panel opens its sections).      |
| `data-label-layout`                 | attribute | `responsive`, `inline`  | Where row labels sit.                                                                       |
| `ui-property-section`               | root      |                         | A section's disclosure `<div>`.                                                             |
| `ui-property-section__header`       | slot      |                         | The heading and the actions.                                                                |
| `ui-property-section__heading`      | slot      |                         | The heading around the trigger.                                                             |
| `ui-property-section__trigger`      | slot      |                         | The trigger button.                                                                         |
| `ui-property-section__chevron`      | slot      |                         | The disclosure chevron (also `ui-glyph`).                                                   |
| `ui-property-section__title`        | slot      |                         | The title.                                                                                  |
| `ui-property-section__override`     | slot      |                         | The override mark.                                                                          |
| `ui-property-section__count`        | slot      |                         | The count (also `ui-badge`).                                                                |
| `ui-property-section__meta`         | slot      |                         | Passive text after the count.                                                               |
| `ui-property-section__actions`      | slot      |                         | The section's buttons.                                                                      |
| `ui-property-section__content`      | slot      |                         | The disclosure panel.                                                                       |
| `ui-property-section__description`  | slot      |                         | Supporting text at the top of the content.                                                  |
| `ui-property-card`                  | root      |                         | A card's disclosure `<div>`.                                                                |
| `ui-property-card__header`          | slot      |                         | The trigger and the actions.                                                                |
| `ui-property-card__trigger`         | slot      |                         | The trigger button.                                                                         |
| `ui-property-card__chevron`         | slot      |                         | The disclosure chevron (also `ui-glyph`).                                                   |
| `ui-property-card__name`            | slot      |                         | The name.                                                                                   |
| `ui-property-card__summary`         | slot      |                         | The summary of the values inside.                                                           |
| `ui-property-card__override`        | slot      |                         | The override mark.                                                                          |
| `ui-property-card__actions`         | slot      |                         | The card's buttons.                                                                         |
| `ui-property-card__body`            | slot      |                         | The disclosure panel.                                                                       |
| `ui-property-group`                 | root      |                         | A group of rows.                                                                            |
| `ui-property-group__heading`        | slot      |                         | The group heading.                                                                          |
| `ui-property-row`                   | root      |                         | A row.                                                                                      |
| `ui-property-row__label`            | slot      |                         | The label (`<label>` with `htmlFor`).                                                       |
| `ui-property-row__required`         | slot      |                         | The asterisk of a required row.                                                             |
| `ui-property-row__control`          | slot      |                         | The control, unit and hint.                                                                 |
| `ui-property-row__unit`             | slot      |                         | The unit after the control.                                                                 |
| `ui-property-row__hint`             | slot      |                         | The caption under the control.                                                              |
| `ui-property-row__description`      | slot      |                         | Supporting text for the row.                                                                |
| `ui-property-row__actions`          | slot      |                         | The row's buttons.                                                                          |
| `ui-property-row__inherited`        | slot      |                         | The inherited value under the control.                                                      |
| `ui-property-row__inherited-label`  | slot      |                         | The words introducing the inherited value.                                                  |
| `ui-property-row__inherited-value`  | slot      |                         | The inherited value.                                                                        |
| `ui-property-row__inherited-source` | slot      |                         | Where the inherited value comes from.                                                       |
| `ui-property-row__reset`            | slot      |                         | The reset-to-inherited button of an overridden row (also `ui-button`).                      |
| `ui-property-strip`                 | root      |                         | An inline run of cells.                                                                     |
| `ui-property-strip-cell`            | root      |                         | One cell of a strip.                                                                        |
| `ui-property-strip-cell__letter`    | slot      |                         | The decorative letter.                                                                      |
| `ui-property-icon-group`            | root      |                         | A named group of icon buttons.                                                              |
| `data-variant`                      | attribute | `separate`, `segmented` | On an icon group: how the buttons are framed.                                               |
| `data-overridden`                   | state     | `true`                  | A row, or a section or card holding one, overrides inherited values.                        |
| `data-required`                     | state     | `true`                  | On a row: a value is required.                                                              |
| `data-wide`                         | state     | `true`                  | On a row: the label sits above a control spanning the row.                                  |
| `data-expanded`                     | state     | `true`                  | On a section or card: open (React Aria).                                                    |
| `data-disabled`                     | state     | `true`                  | On the panel: its fields are disabled. On a section and its trigger: disabled (React Aria). |
| `data-readonly`                     | state     | `true`                  | On the panel: its fields are read-only.                                                     |
| `data-focus-visible-within`         | state     | `true`                  | On a section, card or their panel: keyboard focus inside (React Aria).                      |
| `data-hovered`                      | state     | `true`                  | On a trigger: pointer over it (React Aria).                                                 |
| `data-pressed`                      | state     | `true`                  | On a trigger: being pressed (React Aria).                                                   |
| `data-focused`                      | state     | `true`                  | On a trigger: focused (React Aria).                                                         |
| `data-focus-visible`                | state     | `true`                  | On a trigger: keyboard focus (React Aria).                                                  |
