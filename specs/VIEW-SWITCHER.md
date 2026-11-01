# View Switcher

`ViewSwitcher` names and switches the saved views of a collection: named settings (filters, sort, grouping, visible properties, layout) the caller stores and applies. The views show as [Tabs](TABS.md), or in a [Dropdown Menu](DROPDOWN-MENU.md) for many views or little room. The selected view carries a modified mark while its current settings differ from its saved ones, and a menu of its actions saves them, saves them as a new view, resets them, renames the view, makes it the default view (marked with a star) or deletes it after a confirmation; each tab offers the same actions for its own view. Naming opens a [Modal](MODAL.md) and deleting a [Confirm Dialog](MODAL.md). The values are plain data and the caller persists the views.

## UIC-VIEW-SWITCHER-1 - Views

### UIC-VIEW-SWITCHER-1.1 - Views as tabs

`ViewSwitcher` shall render a `<div>` root (`ui-view-switcher`) publishing `variant` (`tabs` by default) in `data-variant`. As tabs it holds [Tabs](TABS.md) with a bar (`ui-view-switcher__bar`) holding a `TabList` (`ui-view-switcher__tabs`) that collapses the tabs that do not fit into its "more" menu, with one `Tab` (`ui-view-switcher__tab`) per view in order, showing the view's `icon` and `label` (`ui-view-switcher__label`), followed by the actions menu (UIC-VIEW-SWITCHER-1.4); then the panel (`ui-view-switcher__panel`) holding `children`, a `tabpanel` labelled by the selected tab, carrying the id the tab controls, and a tab stop while it holds nothing tabbable. As a menu the same panel follows the bar without the tab panel role. The panel keeps its place whichever the variant and whichever view is selected, so `children` keep their state, drafts and focus when the variant changes; a host that wants fresh content per view keys its content by the selected view.

Implementation: `src/components/view-switcher/view-switcher.tsx`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.2 - Selecting a view

`selectedKey` (controlled) or `defaultSelectedKey` shall choose the selected view, which starts at `defaultSelectedKey`, else `defaultViewKey`, else the first view; selecting another view calls `onSelectionChange` with its `id`. When the chosen view is not among `views`, such as after it was deleted, the default view, else the first view, shows as selected; an uncontrolled selection moves to it and reports it through `onSelectionChange` once.

Implementation: `src/components/view-switcher/view-switcher.tsx`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.3 - Default and modified marks

The view whose `id` is `defaultViewKey` shall show a mark after its label (`ui-view-switcher__default`) holding the `star` glyph and the provider's `defaultView` string for assistive technology. While `isDirty`, the root publishes `data-dirty` and the selected view shows a modified mark (`ui-view-switcher__modified`) holding the provider's `viewModified` string for assistive technology; the stylesheet draws it.

The name (`ui-view-switcher__label`, which publishes the name in `data-label`) and the marks follow one another inside the tab's label, which [Tabs](TABS.md) lays out in one row when it holds more than plain text, so the view's icon, name, star and modified mark share a row. The reference stylesheet caps a tab's width and truncates the name first, keeps the marks' room, reserves the name's selected weight from `data-label` and keeps the modified mark's room on every tab, so neither selecting a view nor the mark coming and going resizes a tab; the same holds right to left.

Implementation: `src/components/view-switcher/view-switcher.tsx`, `src/core/strings/view.ts`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.4 - Actions menu, save and reset

When the selected view has actions, a small icon [Dropdown Menu](DROPDOWN-MENU.md) (`ui-view-switcher__actions`, the `more` glyph named by the provider's `viewActions` string for the view's label) shall offer them in groups split by separators: the settings actions, then naming and default, then deletion. While `isDirty`, `onSave` offers the provider's `save` action, which calls it with the view's `id`, and `onReset` offers `resetView`, which calls it with the `id`. Settings actions act on the current settings, so only the selected view offers them.

Implementation: `src/components/view-switcher/view-switcher.tsx`, `src/components/view-switcher/view-actions.ts`, `src/core/strings/view.ts`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.5 - Saving as a new view

`onSaveAs` shall offer the provider's `saveViewAs` action, which opens a [Modal](MODAL.md) titled `newView` holding a required text field named by `viewName`, which takes focus. Save, or Enter in the field, runs the dialog's Save action ([UIC-MODAL-6.3](MODAL.md#uic-modal-63---primary-action-from-the-content)), which calls `onSaveAs` with the trimmed name, refused while it is blank, and closes the dialog once a returned promise settles, keeping Save pending meanwhile and the dialog open with the failure if it rejects. A repeated Enter or Control+Enter while it is pending calls `onSaveAs` no second time. An Enter during a text composition, or the one that confirms an input method candidate (key code 229), belongs to the input method and runs no action, in this dialog and the rename dialog (UIC-VIEW-SWITCHER-1.6). Closing applies only to the opening that asked: a promise that settles after its dialog was dismissed never closes a dialog opened since, nor drops its typed name.

Implementation: `src/components/view-switcher/view-actions.ts`, `src/components/view-switcher/view-dialogs.tsx`, `src/core/strings/view.ts`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.6 - Renaming a view

`onRename` shall offer the provider's `rename` action for every view, which opens the same dialog titled `renameView` with the field filled with the view's label; saving calls `onRename` with the view's `id` and the trimmed name.

Implementation: `src/components/view-switcher/view-actions.ts`, `src/components/view-switcher/view-dialogs.tsx`, `src/core/strings/view.ts`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.7 - Default view and deleting

`onDefaultViewChange` shall offer the provider's `setDefaultView` action for every view but the default one, which calls it with the view's `id`. `onDelete` offers the provider's `delete` action (tone `danger`), disabled while only one view is left, which opens a [Confirm Dialog](MODAL.md) of tone `danger` titled by `deleteViewTitle` for the label, explaining with `deleteViewMessage`; confirming calls `onDelete` with the `id` and closes it once a returned promise settles.

Implementation: `src/components/view-switcher/view-actions.ts`, `src/components/view-switcher/view-dialogs.tsx`, `src/core/strings/view.ts`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.8 - Views in a menu

With `variant="menu"`, the bar shall hold a [Dropdown Menu](DROPDOWN-MENU.md) (`ui-view-switcher__menu`) whose button shows the selected view's icon, label and marks, opening a single-selection menu of the views (each with its icon, the default view described by the provider's `defaultView` string), then the actions menu; choosing a view selects it. `children` follow the bar.

Implementation: `src/components/view-switcher/view-switcher.tsx`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

### UIC-VIEW-SWITCHER-1.9 - Hooks and caller attributes

`ViewSwitcher` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to its root.

Implementation: `src/components/view-switcher/view-switcher.tsx`
Verification: `src/components/view-switcher/view-switcher.test.tsx`

### UIC-VIEW-SWITCHER-1.10 - Open dialogs follow the views

A dialog opened by an action shall keep the action and the view it acts on, not a callback: on every render it runs the current handler with the view's current label. When the handler is removed, the view leaves `views`, saving as a new view loses its selected view, or a deletion would remove the last view, the dialog closes and does not reopen if the handler or view comes back. A save, rename or deletion already started keeps its own outcome, and closing applies only to its own opening (UIC-VIEW-SWITCHER-1.5).

Implementation: `src/components/view-switcher/view-switcher.tsx`, `src/components/view-switcher/view-actions.ts`, `src/components/view-switcher/view-dialogs.tsx`
Verification: `src/components/view-switcher/view-switcher.test.tsx`

## UIC-VIEW-SWITCHER-2 - Accessibility

### UIC-VIEW-SWITCHER-2.1 - Names and keyboard

The tab list, or the menu of views, shall be named by `aria-label` or `aria-labelledby`, else by the provider's `views` string. Arrow keys move between tabs and select them, and Shift+F10, the Context Menu key or a secondary click opens a tab's own menu of its view's actions ([Tabs](TABS.md)); dialogs take focus when they open and return it when they close.

Implementation: `src/components/view-switcher/view-switcher.tsx`, `src/core/strings/view.ts`
Verification: `src/components/view-switcher/view-switcher.test.tsx`, `e2e/view-switcher.spec.ts`

## Hooks

| Hook                         | Kind      | Values         | Description                                                 |
| ---------------------------- | --------- | -------------- | ----------------------------------------------------------- |
| `ui-view-switcher`           | root      |                | The view switcher (`<div>`).                                |
| `ui-view-switcher__bar`      | slot      |                | The views and the actions menu.                             |
| `ui-view-switcher__tabs`     | slot      |                | The tab list of views (also `ui-tabs__list`).               |
| `ui-view-switcher__tab`      | slot      |                | One view's tab (also `ui-tabs__tab`).                       |
| `ui-view-switcher__menu`     | slot      |                | The menu of views, as its button (also `ui-dropdown-menu`). |
| `ui-view-switcher__label`    | slot      |                | A view's name.                                              |
| `ui-view-switcher__default`  | slot      |                | The default view's mark.                                    |
| `ui-view-switcher__modified` | slot      |                | The selected view's modified mark.                          |
| `ui-view-switcher__actions`  | slot      |                | The actions menu's button (also `ui-dropdown-menu`).        |
| `ui-view-switcher__panel`    | slot      |                | The selected view's content.                                |
| `data-variant`               | attribute | `tabs`, `menu` | How the views show.                                         |
| `data-label`                 | attribute |                | A view's name, on the label slot.                           |
| `data-dirty`                 | state     | `true`         | The selected view's settings differ from its saved ones.    |
