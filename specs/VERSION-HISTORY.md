# Version History

`VersionHistory` lists the saved versions of a document or record, newest first: named versions and automatic ones titled by their time, each with who saved it and when and an optional summary, the current version marked. The reader selects one version to view it and two to compare them, restores a version after a confirmation, names or renames a version, and filters the list to named versions or to one person's. It builds on [List Row](LIST-ROW.md)'s `ListView` (selection, keyboard navigation, loading more and the empty state), [Dropdown Menu](DROPDOWN-MENU.md), [Confirm Dialog](MODAL.md), [Modal](MODAL.md) and [Attribution](ATTRIBUTION.md). The caller owns the versions, shows the selected one or the comparison, and applies restores and renames.

## UIC-VERSION-HISTORY-1 - Versions

### UIC-VERSION-HISTORY-1.1 - List of versions

`VersionHistory` shall render a `<div>` root (`ui-version-history`) holding a `ListView` (`ui-version-history__list`, a React Aria grid) with one `ListViewItem` (`ui-version-history__version`, keyed by the version's `id`) per version the filters keep (UIC-VERSION-HISTORY-1.7), in the order of `versions`.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries; removing one preserves the other entry's rendered identity.

Implementation: `src/components/version-history/version-history.tsx`, `src/components/version-history/version-row.tsx`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.2 - A version's row

A version's title shall be its trimmed `label` (`ui-version-history__label`), which makes it a named version publishing `data-named`, or for an automatic version its `time` as a medium date and short time for the locale in the time zone `timeZone`, else the provider's (`useTimeZone`, so a server render and its hydration agree; a date alone, or a date and time without an offset, reads as written), or the provider's `unknownTime` string, capitalized, when the time cannot be read; a formatted time writes its spaces as plain spaces ([UIC-INTL-FORMAT-1.3](INTL-FORMAT.md)), so a server's title hydrates unchanged; the title is also the row's text value for typeahead. The version whose `id` is `currentKey` publishes `data-current` and shows the provider's `currentVersion` string after its title (`ui-version-history__current`). Below the title, an [Attribution](ATTRIBUTION.md) (`ui-version-history__attribution`) says who saved it and when, with `showAvatar`, `fallbackAfterDays`, `getNow` and `timeZone` passed on, followed by its `summary` (`ui-version-history__summary`) when it has one.

Implementation: `src/components/version-history/version-row.tsx`, `src/components/version-history/version-model.ts`, `src/core/strings/history.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`, `src/components/version-history/version-history-server.test.tsx`

### UIC-VERSION-HISTORY-1.3 - Selecting one or two versions

The list shall select with checkboxes ([UIC-LIST-ROW-3.3](LIST-ROW.md#uic-list-row-33---selection)): a press or Space toggles a version. At most two versions are selected: selecting a third drops the earliest pick, and selecting every row at once is refused. `selectedKeys` (controlled) or `defaultSelectedKeys` set the selection and `onSelectionChange` receives it as a `Set` after each change, so the caller shows the one selected version or offers to compare two. Only a key naming a version in `versions` that is not disabled counts as selected (keys match by value and type, so `1` and `'1'` differ): an uncontrolled selection drops a version that leaves `versions` or becomes disabled and reports the smaller selection, and it stays dropped if the version comes back; a controlled selection's other keys are ignored, reported by no call, and left out of the next change.

Implementation: `src/components/version-history/version-history.tsx`, `src/components/version-history/version-model.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.4 - Comparing two versions

With `onCompare`, a toolbar (`ui-version-history__toolbar`) before the list shall hold a button (`ui-version-history__compare`) reading the provider's `compareVersions` string, enabled only while two versions are selected (as counted in [UIC-VERSION-HISTORY-1.3](#uic-version-history-13---selecting-one-or-two-versions)); pressing it calls `onCompare` with their keys, the older version (the later one in `versions`) first.

Implementation: `src/components/version-history/version-history.tsx`, `src/components/version-history/version-toolbar.tsx`, `src/components/version-history/version-model.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.5 - Restoring a version

With `onRestore`, every enabled version but the current one shall end its row with a menu ([Dropdown Menu](DROPDOWN-MENU.md), an icon button named by the provider's `versionActions` string for the title, `ui-version-history__actions`) offering the provider's `restoreVersion` action. It opens a [Confirm Dialog](MODAL.md) titled by the provider's `restoreVersionTitle` for the title, explaining with `restoreVersionMessage` and confirming with `restore`; confirming calls `onRestore` with the version's key and closes the dialog once a returned promise settles, keeping it open with the failure if it rejects. Cancel closes it without a call. The dialog closes without a call when, before it is confirmed, its version leaves `versions`, becomes disabled or becomes `currentKey`, or `onRestore` goes away, and stays closed when they come back; focus returns to the history. Confirming checks the version again, so an unavailable version never reaches `onRestore`. A restore already running is not closed by the change it makes (its version becoming current).

Implementation: `src/components/version-history/version-row.tsx`, `src/components/version-history/version-dialogs.tsx`, `src/core/strings/history.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.6 - Naming a version

With `onRename`, every enabled version's menu shall offer the provider's `nameVersion` action for an automatic version and `renameVersion` for a named one. It opens a [Modal](MODAL.md) with the same title holding a text field named by `versionName` and filled with the version's name; Save, or Enter in the field, runs the dialog's Save action ([UIC-MODAL-6.3](MODAL.md#uic-modal-63---primary-action-from-the-content)), which calls `onRename` with the key and the trimmed name when it changed (an empty name makes the version automatic again) and closes the dialog once a returned promise settles, keeping Save pending meanwhile and the dialog open with the failure if it rejects; an unchanged name only closes it. A repeated Enter or Control+Enter while it is pending calls `onRename` no second time. An Enter during a text composition, or the one that confirms an input method candidate (key code 229), belongs to the input method and runs no action. Like the restore dialog, the dialog closes without a call when, before it is saved, its version leaves `versions` or becomes disabled or `onRename` goes away, dropping the typed name, and stays closed when they come back. Closing applies only to the opening that asked: a promise that settles after its dialog was dismissed never closes a dialog opened since, nor drops its typed name.

Implementation: `src/components/version-history/version-row.tsx`, `src/components/version-history/version-dialogs.tsx`, `src/core/strings/history.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.7 - Filters

While `showFilters` is set (the default), the toolbar shall start with a [Switch](SWITCH.md) (`ui-version-history__named-only`) reading the provider's `namedVersionsOnly` string, which keeps only named versions, and a single-selection [Dropdown Menu](DROPDOWN-MENU.md) (`ui-version-history__person`) labelled by the provider's `versionsBy` string for the chosen person, offering `anyone` and then the names of the people who saved the versions, trimmed, once each, in order of first appearance; choosing a person keeps only their versions, whatever spaces surround their name. `filter` (controlled, `{ namedOnly, person }`) or `defaultFilter` (every version by default) set the filter, and `onFilterChange` receives it after each change. When the filters keep no version, the list shows a small [Empty State](EMPTY-STATE.md) reading the provider's `noMatchingVersions` string. Filtering leaves the selection as it is: a selected version the filters hide stays selected and can be compared.

Implementation: `src/components/version-history/version-toolbar.tsx`, `src/components/version-history/version-model.ts`, `src/core/strings/history.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.8 - Disabled versions

A version with `isDisabled` shall be a disabled row of the list: it cannot be selected or focused and has no menu.

Implementation: `src/components/version-history/version-history.tsx`, `src/components/version-history/version-row.tsx`
Verification: `src/components/version-history/version-history.test.tsx`

### UIC-VERSION-HISTORY-1.9 - Loading, errors and no versions

`onLoadMore` and `isLoading` shall load older versions inside the list ([UIC-COLLECTIONS-1.2](COLLECTIONS.md#uic-collections-12---loading-more-inside-a-collection)); while `isLoading` the root publishes `data-loading`, and a list without rows shows a small loading [Empty State](EMPTY-STATE.md). With `error`, a small error Empty State (`ui-version-history__error`) describing it, with a Retry button calling `onRetry` when given, replaces the list. With no versions at all and not loading, the list shows what `renderEmptyState` returns, else an Empty State reading the provider's `noVersions` string.

Implementation: `src/components/version-history/version-history.tsx`, `src/core/strings/history.ts`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

### UIC-VERSION-HISTORY-1.10 - Hooks and caller attributes

`VersionHistory` shall carry the hooks below, append the caller's `className`, and forward `id`, `ref` and caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/version-history/version-history.tsx`
Verification: `src/components/version-history/version-history.test.tsx`

### UIC-VERSION-HISTORY-1.11 - Folded versions

A version's `children` shall be older versions folded under it, newest first, such as the automatic versions saved before a named one (one level deep). While the filters keep any of them, its row's trailing controls start with an [Expand Toggle](EXPAND-TOGGLE.md) (`ui-version-history__fold`), before the menu, named, and tooltipped, by the provider's `foldedVersions` string for their number and the version's title, and the row publishes `data-expanded` while expanded; expanding shows the kept folded versions right after it, each row publishing `data-nested`, and collapsing hides them. `expandedKeys` (controlled) or `defaultExpandedKeys` set the expanded versions and `onExpandedChange` receives them as a `Set` after each toggle. Folded versions are versions like any other for selection, comparison (the order of `versions` with each version followed by its folded ones), restoring, naming, the person filter's people and disabling, and the filters apply to them: a folded version the filters keep under a version they drop stands on its own row, so a filter never hides a match.

Implementation: `src/components/version-history/version-history.tsx`, `src/components/version-history/version-row.tsx`, `src/components/version-history/version-model.ts`, `src/core/strings/history.ts`
Verification: `src/components/version-history/version-history-folding.test.tsx`, `e2e/version-history.spec.ts`

## UIC-VERSION-HISTORY-2 - Accessibility

### UIC-VERSION-HISTORY-2.1 - Named list and keyboard

The list shall be named by `aria-label` or `aria-labelledby`, else by the provider's `versionHistory` string, and carry `aria-describedby` and `aria-details` when given. It is one tab stop: ArrowUp and ArrowDown move between versions, Space toggles the focused version's selection, and ArrowRight moves on through the row's controls: its checkbox, its time's tooltip trigger when the time reads relative, then its menu (React Aria). Dialogs take focus when they open and return it when they close.

Implementation: `src/components/version-history/version-history.tsx`
Verification: `src/components/version-history/version-history.test.tsx`, `e2e/version-history.spec.ts`

## Hooks

| Hook                              | Kind  | Values          | Description                                                                  |
| --------------------------------- | ----- | --------------- | ---------------------------------------------------------------------------- |
| `ui-version-history`              | root  |                 | The history (`<div>`).                                                       |
| `ui-version-history__toolbar`     | slot  |                 | The filters and the compare action above the list.                           |
| `ui-version-history__named-only`  | slot  |                 | The named-versions switch (also `ui-switch`).                                |
| `ui-version-history__person`      | slot  |                 | The person filter's menu button (also `ui-dropdown-menu`).                   |
| `ui-version-history__compare`     | slot  |                 | The compare button (also `ui-button`).                                       |
| `ui-version-history__list`        | slot  |                 | The list of versions (also `ui-list-view`).                                  |
| `ui-version-history__version`     | slot  |                 | One version's row (also `ui-list-view-item`).                                |
| `ui-version-history__label`       | slot  |                 | The version's name or time.                                                  |
| `ui-version-history__current`     | slot  |                 | The current version's mark.                                                  |
| `ui-version-history__attribution` | slot  |                 | Who saved the version and when (also `ui-attribution`).                      |
| `ui-version-history__summary`     | slot  |                 | What changed in the version.                                                 |
| `ui-version-history__actions`     | slot  |                 | The version's menu button (also `ui-dropdown-menu`).                         |
| `ui-version-history__fold`        | slot  |                 | The toggle that shows a version's folded versions (also `ui-expand-toggle`). |
| `ui-version-history__error`       | slot  |                 | Why the versions could not be loaded (also `ui-empty-state`).                |
| `data-named`                      | state | `true`          | On a version: it has a name.                                                 |
| `data-current`                    | state | `true`          | On a version: it is the current one.                                         |
| `data-nested`                     | state | `true`          | On a version folded under another, while shown.                              |
| `data-expanded`                   | state | `true`, `false` | On a version that folds others: whether they are shown.                      |
| `data-loading`                    | state | `true`          | While versions load.                                                         |
