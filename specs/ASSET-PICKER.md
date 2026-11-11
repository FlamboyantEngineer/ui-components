# Asset Picker

`AssetPicker` lets a reader find an image among the host's assets and place it: it browses and searches through the caller's `search`, shows the results as a grid of thumbnails, and, once one is chosen, sets its alternative text, size and alignment before inserting it. All data comes through the callbacks: the picker stores and fetches nothing itself. It is a panel; the host shows it in a dialog, a popover or a sidebar.

## UIC-ASSET-PICKER-1 - Choosing an asset

### UIC-ASSET-PICKER-1.1 - Browsing and searching

`AssetPicker` shall render a `group` root named by the caller's `aria-label` or `aria-labelledby`, a [Search Field](SEARCH-FIELD.md) labelled by the provider string `assetSearch`, a status (`role="status"`) and a single-selection [Card Grid](CARD.md) of the results named by `assetResults`, one item per asset (`ui-asset-picker__item`, named by its `name`) holding its thumbnail ([Image](IMAGE.md), decorative) and its name. As it mounts it calls `search('', signal)`, which browses; typing calls `search(query, signal)` once typing pauses for `searchDelay` milliseconds (240 by default), aborting the previous search through its signal. A loader may return pages (`{ items, cursor }`): the grid asks for the next page as its end scrolls into view. While the first results load the grid shows the provider's `loading`; a search that fails shows `searchFailed`, and one that finds nothing shows `assetsEmpty`, which the status also reads.

Implementation: `src/components/asset-picker/asset-picker.tsx`, `src/components/asset-picker/asset-results.tsx`, `src/utils/use-remote-search.ts`
Verification: `src/components/asset-picker/asset-picker.test.tsx`, `e2e/asset-picker.spec.ts`

### UIC-ASSET-PICKER-1.2 - Placing the chosen asset

Choosing an asset shall show its placement form (`ui-asset-picker__details`): a text field for the alternative text (`assetAlt`), starting from the asset's `alt` or empty; number fields for the width and height in pixels (`assetWidth`, `assetHeight`), starting from the asset's own size or empty; a checkbox `assetConstrain`, on at first, while which a new width sets the height in the asset's proportions and a new height sets the width, rounded to whole pixels (an asset without both sizes keeps the sides apart); and a [Segmented Choice](SEGMENTED-CHOICE.md) named `assetAlign` of `start`, `center` and `end`, starting from `defaultAlign` (`start` by default). Choosing another asset starts its placement again; choosing the same asset keeps it. The Insert button (`insert`) is disabled until an asset is chosen; pressing it calls `onSelect(item, { alt, width, height, align, constrain })`, with `null` for a size the reader cleared.

Implementation: `src/components/asset-picker/asset-picker.tsx`, `src/components/asset-picker/asset-details.tsx`, `src/components/asset-picker/asset-placement.ts`
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
| `ui-asset-picker__details`   | slot |        | The chosen asset's placement form.         |
| `ui-asset-picker__alt`       | slot |        | The alternative text field.                |
| `ui-asset-picker__size`      | slot |        | The width and height fields.               |
| `ui-asset-picker__constrain` | slot |        | The keep-proportions checkbox.             |
| `ui-asset-picker__align`     | slot |        | The alignment choice.                      |
| `ui-asset-picker__actions`   | slot |        | Cancel and Insert.                         |
