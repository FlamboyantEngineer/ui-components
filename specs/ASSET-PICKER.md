# Asset Picker

`AssetPicker` browses and searches host assets and returns the selected asset. The host owns alternative text, size and alignment; see `AssetPlacementComposition` in `labs/src/composition-editors.tsx`.

## UIC-ASSET-PICKER-1 - Choosing an asset

### UIC-ASSET-PICKER-1.1 - Browsing and searching

`AssetPicker` shall render a `group` root named by the caller's `aria-label` or `aria-labelledby`, a [Search Field](SEARCH-FIELD.md) labelled by the provider string `assetSearch`, a status (`role="status"`) and a single-selection [Card Grid](CARD.md) of the results named by `assetResults`, one item per asset (`ui-asset-picker__item`, named by its `name`) holding its thumbnail ([Image](IMAGE.md), decorative) and its name. As it mounts it calls `search('', signal)`, which browses; typing calls `search(query, signal)` once typing pauses for `searchDelay` milliseconds (240 by default), aborting the previous search through its signal. A loader may return pages (`{ items, cursor }`): the grid asks for the next page as its end scrolls into view. While the first results load the grid shows the provider's `loading`; a search that fails shows `searchFailed`, and one that finds nothing shows `assetsEmpty`, which the status also reads. The reference sheet keeps results the same size when selection changes.

Implementation: `src/components/asset-picker/asset-picker.tsx`, `src/components/asset-picker/asset-results.tsx`, `src/utils/use-remote-search.ts`
Verification: `src/components/asset-picker/asset-picker.test.tsx`, `e2e/asset-picker.spec.ts`

### UIC-ASSET-PICKER-1.2 - Placing the chosen asset

Choosing an asset shall select its result. Insert remains disabled until a result is chosen; pressing it calls `onSelect(item)` with that asset alone. The picker shall render no placement form. Choosing a different result replaces the selection.
Implementation: `src/components/asset-picker/asset-picker.tsx`, `src/components/asset-picker/asset-picker-types.ts`
Verification: `src/components/asset-picker/asset-picker.test.tsx`, `e2e/asset-picker.spec.ts`

### UIC-ASSET-PICKER-1.3 - Actions and caller attributes

With `onCancel` the actions (`ui-asset-picker__actions`) shall start with a Cancel button (`cancel`) that calls it; without it there is none. The root appends the caller's `className` and forwards `id`, `ref` and `data-*` attributes.

Implementation: `src/components/asset-picker/asset-picker.tsx`
Verification: `src/components/asset-picker/asset-picker.test.tsx`

## Hooks

| Hook                         | Kind | Values | Description                                |
| ---------------------------- | ---- | ------ | ------------------------------------------ |
| `ui-asset-picker`            | root |        | The picker.                                |
| `ui-asset-picker__search`    | slot |        | The search field (also `ui-search-field`). |
| `ui-asset-picker__results`   | slot |        | The grid of results (also `ui-card-grid`). |
| `ui-asset-picker__item`      | slot |        | One result (also `ui-card-grid-item`).     |
| `ui-asset-picker__thumbnail` | slot |        | A result's thumbnail (also `ui-image`).    |
| `ui-asset-picker__name`      | slot |        | A result's name.                           |
| `ui-asset-picker__actions`   | slot |        | Cancel and Insert.                         |
