---
'@flamboyantengineer/ui-components': minor
---

Add disclosures, skeletons, meters and status lights.

- `Disclosure` (new, React Aria `Disclosure`): a collapsible section whose `title` draws a heading at the automatic level (`headingLevel`) around a trigger with an indicator glyph at the `start` or `end` (`indicatorPosition`), and a panel that keeps React Aria's `hidden="until-found"` for find in page and its `--disclosure-panel-height`/`--disclosure-panel-width` for animation. Without `title`, compose `DisclosureHeader` (a title with actions beside it), `DisclosureTitle` and `DisclosurePanel`. Hooks: `ui-disclosure`, `__header`, `__heading`, `__trigger`, `__indicator`, `__title`, `__panel`, `data-indicator-position`.
- `DisclosureGroup` (new, React Aria `DisclosureGroup`): an accordion with `allowsMultipleExpanded`, `expandedKeys`/`defaultExpandedKeys`/`onExpandedChange` and `isDisabled`; ArrowUp/ArrowDown, Home and End move between its triggers. Hook: `ui-disclosure-group`.
- `Skeleton` (new): a decorative placeholder block (`shape`: `text`, `rectangle`, `circle`), or around real content a busy loading region that keeps the content's layout, inert and hidden, until `isLoading` turns false; `animated={false}` switches the animation hook off. `SkeletonText` (new) draws `lines` text placeholders. Hooks: `ui-skeleton`, `__content`, `ui-skeleton-text`, `__line`, `data-shape`, `data-loading`, `data-animated`.
- `Meter` (new, React Aria `Meter`): `label`, `showValueLabel`, `size`, `tone`, React Aria's `formatOptions` and `valueLabel`, and the HTML meter's `low`, `high` and `optimum` thresholds, which judge the tone. Shares the progress bar's hook vocabulary: `ui-meter`, `__label`, `__value`, `__track`, `__fill`, `data-size`, `data-tone`.
- `StatusLight` (new): a dot beside a label with `tone`, `size`, `isProcessing`, a presence `status` (`active`, `away`, `busy`, `idle`) labelled from the provider's strings, and an image named by `aria-label` when it shows no label. Hooks: `ui-status-light`, `__dot`, `__label`, `data-tone`, `data-size`, `data-status`, `data-processing`.
- `Card` and `UserCard`: the loading skeleton slot is a `Skeleton` block, so it also carries `ui-skeleton`, `data-shape`, `data-loading` and `data-animated`.
- Provider strings: `presenceStatus`.
