# List Filter

`ListFilter` composes [Segmented Choice](SEGMENTED-CHOICE.md) and [Action Row](ACTION-ROW.md) for a compact list header or secondary panel row. Unlike [Filter Bar](FILTER-BAR.md), it selects one supplied value rather than editing a structured query. The host owns data, error text and commands.

## UIC-LIST-FILTER-1 - Contract

### UIC-LIST-FILTER-1.1 - Typed controlled selection

`ListFilter<V extends string>` shall take a controlled `value: V` and ordered `options` with typed `value`, text `label`, optional `count`, optional `countMax` and `isDisabled`. Picking an enabled option reports its value through `onChange`; picking the selected option never clears it. `isDisabled` refuses all filters. `size` defaults to `sm` and supports the shared control sizes. The root forwards `ref`, `id`, caller classes and data attributes; ARIA labelling and description props name and describe the radiogroup.

Implementation: `src/components/list-filter/list-filter.tsx`
Verification: `src/components/list-filter/list-filter.test.tsx`, `e2e/list-filter.spec.ts`

### UIC-LIST-FILTER-1.2 - Shared quiet counts

Counts shall use a small [Badge](BADGE.md) with `variant="subtle"`, independent of parent selection and typography. `showZero` defaults to true; false hides zero. `countMax` defaults to 99; an option's cap overrides it. The option's accessible name includes its uncapped localized count. Negative and non-finite counts show nothing.

Implementation: `src/components/list-filter/list-filter.tsx`, `src/components/segmented-choice/segment.tsx`
Verification: `src/components/list-filter/list-filter.test.tsx`, `e2e/list-filter.spec.ts`

### UIC-LIST-FILTER-1.3 - Keyboard and actions

The filters shall use SegmentedChoice's native single-selection keyboard behavior, roving tab stop and disabled handling. `actions` shall use ActionRow's typed icon buttons and menus with their pending, disabled and focus behavior. Tab leaves the filters for the actions; an action never selects a filter. A disabled filter group leaves the actions available.

Implementation: `src/components/list-filter/list-filter.tsx`
Verification: `src/components/list-filter/list-filter.test.tsx`, `e2e/list-filter.spec.ts`

### UIC-LIST-FILTER-1.4 - Asynchronous changes

A promise returned by `onChange(value, signal)` shall preview the new value pending and refuse further filter picks until it settles. Rejection restores the latest controlled value and calls `onError(error)` for host feedback. A different controlled value supersedes the pending preview immediately; superseded work and unmounted work receive an aborted signal, and later errors produce no feedback or state updates. The host must observe the signal before committing asynchronous state of its own. Synchronous exceptions follow the same rejection behavior. Actions have independent pending state.

Implementation: `src/components/list-filter/use-filter-change.ts`, `src/components/segmented-choice/pending-change.ts`
Verification: `src/components/list-filter/list-filter.test.tsx`, `e2e/list-filter.spec.ts`

### UIC-LIST-FILTER-1.5 - Layout and indicator

The reference sheet shall keep filters and trailing actions on one row. Filters scroll horizontally within the remaining width of a narrow panel; their buttons remain native focus targets and focus reveals clipped options. Actions retain their room within 40% of the row, collapsing those that do not fit into the shared overflow menu. The SegmentedChoice indicator follows the selected button after content, count, size, font and selection changes without host measurements. Reduced motion disables its transition. The layout follows the reading direction and both reference themes.

Implementation: `src/components/list-filter/list-filter.tsx`, `labs/reference/list-filter.css`
Verification: `e2e/list-filter.spec.ts`

## Hooks

| Hook                      | Kind      | Values                 | Description                              |
| ------------------------- | --------- | ---------------------- | ---------------------------------------- |
| `ui-list-filter`          | root      |                        | The row's div.                           |
| `ui-list-filter__row`     | slot      |                        | The composed ActionRow.                  |
| `ui-list-filter__filters` | slot      |                        | The composed SegmentedChoice radiogroup. |
| `data-size`               | attribute | `xs`, `sm`, `md`, `lg` | Control size.                            |

The composed children retain their documented ActionRow, SegmentedChoice, Badge, Button and Menu hooks.
