# Folder Manager

`FolderManager` manages a tree of folders on the library [Tree](TREE.md): the reader selects a folder (or several), creates one under it, renames it in place, deletes the selected folders, and reorders or nests folders by drag and drop or Alt+Arrow keys ([Tree Reorder](TREE-REORDER.md)) or moves a selection with Move to. Subfolders can load when a folder is expanded, a search box can filter the folders, and a large tree can render only the rows in view. The folders are data and the manager never changes them: each change goes to a callback, which may return a promise, and the owner renders the result. An action is offered only when its callback is set, so a manager without callbacks is a read-only folder picker. A host that stages a choice behind Apply and Cancel composes the manager in a [Modal](MODAL.md) and reads its selection.

## UIC-FOLDER-MANAGER-1 - Tree

### UIC-FOLDER-MANAGER-1.1 - Folders as a tree

`FolderManager` shall render its nested `folders` (`id`, `name`, `children`) as a `Tree` (inside `ui-folder-manager__tree`) named by its `aria-label` or `aria-labelledby`, one row per folder with the `folder` glyph. Any key unique among the folders is valid: the root and draft rows take row keys that no folder key can produce, and every callback receives the caller's own key. Every row with children starts expanded and stays so unless the reader collapses it, so a folder created deep in the tree is in view as soon as it appears.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/use-folder-tree.ts`, `src/core/glyphs.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-1.2 - Root row

`rootLabel` shall add a root row with that label above the folders, standing for no folder: selecting it reports `null`, and it can be neither renamed, deleted nor moved. Folders moved to the top level stay inside it.

Implementation: `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/use-folder-manager.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`

### UIC-FOLDER-MANAGER-1.3 - Selection

The tree shall select one folder at a time (React Aria single selection that follows focus), controlled with `selectedKey` and `onSelectionChange`, which receives the folder's key, or held from `defaultSelectedKey`, where `null` is no folder, unless `selectionMode` is `multiple` (UIC-FOLDER-MANAGER-6.1).

Implementation: `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-1.4 - Loading and busy

`isPending` shall show the tree's loading row while there are no folders and make the actions wait. A name submitted from an open name field while `isPending` is set (Enter or leaving the field) waits too: the field stays open with its text and marked `aria-busy`, no callback runs, and once loading ends the next submit goes ahead. While loading, deleting or naming a folder, the manager is busy: it publishes `data-pending` on its root and refuses other actions and moves.

Implementation: `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/folder-manager-parts.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-2 - Actions

### UIC-FOLDER-MANAGER-2.1 - Offered actions

A toolbar (`ui-folder-manager__toolbar`) shall hold New folder (`plus` glyph, provider string `newFolder`), Rename (`edit`, `rename`) and Delete (`delete`, `delete`) icon buttons, each drawn only when `onCreate`, `onRename` or `onDelete` is set. Rename acts on the selected folder and is disabled unless exactly one folder is selected; Delete acts on the selected folders and is disabled without one; New folder is disabled while several folders are selected; all are disabled while the manager is busy. Without any of the three callbacks there is no toolbar.

Implementation: `src/components/folder-manager/folder-manager-parts.tsx`, `src/components/folder-manager/folder-manager.tsx`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.2 - Creating a folder

New folder shall add a draft row as the last child of the selected folder (at the top, or under the root row, without one), expanding its ancestors, whose label is an empty name field (`ui-folder-manager__name-input`, named by the provider string `newFolderName`) holding focus. Enter, or leaving the field, calls `onCreate` with the trimmed name and the parent's key (`null` at the top); when it returns or resolves to a key, that folder becomes the selection. A blank name or Escape abandons the draft without calling `onCreate`. When the edit ends, focus goes to the new folder's row, or back to the parent's. The typed text belongs to the edit, not to the field: when the draft row remounts, because its parent moved or a virtualized tree rendered it again, the field comes back with that text, focused, with the caret after it.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager-parts.tsx`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.3 - Renaming a folder

Rename, F2 on a folder row or the context menu's Rename shall turn the selected folder's label into the name field, seeded with its name and selected, named by the provider string `renameItem` with the name. Enter, or leaving the field, calls `onRename` with the folder's key and the trimmed name; an unchanged or blank name abandons the edit. Focus then returns to the folder's row. The typed text stays with the edit when the folder's row remounts, such as when the owner moves it under another parent: the field comes back with that text, focused, with the caret after it (an untouched name is selected again). An Enter or Escape that an input method composition owns (pressed while it composes, or the Enter reported with key code 229 as it ends) is left to the input method and neither renames nor abandons.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager-parts.tsx`, `src/utils/is-composing-key.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.4 - Keys in the name field

Every key pressed in the name field shall edit the name and reach neither the tree's navigation, typeahead and selection nor its owner keys; Enter submits and Escape abandons.

Implementation: `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.5 - Pending and refused edits

While the promise of `onCreate` or `onRename` is pending, the name field shall be read-only and `aria-busy`, and further submits do nothing, so a held Enter creates one folder. A rejection keeps the field open with the typed name and shows the error's message, or the provider string `actionFailed`, in an `InlineError` alert (`ui-folder-manager__message`) that describes the field, which is then invalid; Enter retries the same name.

When an edit or delete ends, focus moves to its row (UIC-FOLDER-MANAGER-2.2, 2.3, 2.6) only while the manager still owns it: focus inside the manager, or fallen to the page with the name field or row that left. Focus the reader moved elsewhere while the promise was pending, or while the row was still to arrive in `folders`, stays where it is, and a new edit drops a row still awaited.

A create, rename or delete whose promise settles after the manager has unmounted shall settle nothing in the interface: it calls no `onSelectionChange`, moves no focus and shows no message, and a manager mounted in its place does not take it up. The host's work goes on as it started.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-manager-parts.tsx`, `src/components/folder-manager/folder-manager.tsx`, `src/utils/use-lifetime-signal.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-manager-lifetime.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.6 - Deleting a folder

Delete, the Delete key on a folder row or the context menu's Delete shall call `onDelete` with the selected folder's key, without a confirmation step. A folder for which `getDeleteBlockedReason` returns a reason cannot be deleted: the Delete button is disabled but stays focusable with the reason as its tooltip, the menu entry is disabled with the reason as its description, and the Delete key shows the reason as the message. After a delete the selection falls back to the folder's parent (or no folder) and its row takes focus; a rejection shows its message.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.7 - Depth limit

With `maxDepth`, New folder shall be disabled on a folder at that depth (the top level being 1), focusable with the provider string `folderDepthLimit` as its tooltip, and a move that would place a folder or its deepest subfolder below that depth is refused. The limit is checked again when a new folder's name is submitted, against the current `maxDepth` and where its parent sits now: a draft that no longer fits calls no `onCreate`, keeps its field and text open, and shows `folderDepthLimit` as the message until the name is submitted where it fits or the draft is abandoned.

The limit shall hold for a folder with any number of subfolders, such as hundreds of thousands.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/use-folder-actions.ts`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.8 - Context menu

A secondary click on a folder or root row shall select it (keeping a multiple selection it belongs to) and open a context menu holding the offered Rename and Delete entries, and Move to in multiple selection (UIC-FOLDER-MANAGER-6.3); Shift+F10 or the Context Menu key opens it for the selected row. Entries that do not apply (the root row, a busy manager) are disabled. Without Rename and Delete the browser's own menu is left alone.

Implementation: `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.9 - Revoked edits

An edit that is not pending shall end without calling back once its folder (a rename) or its parent (a new folder) leaves `folders`, or its `onRename` or `onCreate` goes. The manager is no longer busy, and focus that fell to the page with the name field moves to a selected folder still present, else the root row. The folder coming back does not reopen the field.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/use-folder-manager.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`

## UIC-FOLDER-MANAGER-3 - Reordering

### UIC-FOLDER-MANAGER-3.1 - Moves

`onMove` shall make the tree reorderable: folders move among their siblings and into other folders by drag and drop, Alt+ArrowUp and Alt+ArrowDown, and Alt+ArrowRight and Alt+ArrowLeft. Each move is reported as a `TreeMove` of folder keys for the owner to apply (for example with `applyTreeMove`); a drop inside the root row is reported as a move to the end of the top level. The root and draft rows never move, and nothing moves while the manager is busy.

Implementation: `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-4 - Attributes

### UIC-FOLDER-MANAGER-4.1 - Hooks and caller attributes

`FolderManager` shall carry the hooks below and put the caller's `className`, `id`, `ref` and `data-*` attributes on its root.

Implementation: `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`

## UIC-FOLDER-MANAGER-5 - Subfolders on demand

### UIC-FOLDER-MANAGER-5.1 - Loading subfolders

A folder with `hasChildren` and no `children` shall start collapsed with an expand button (UIC-TREE-2.2). Expanding it calls `onLoadChildren` with its key, which may return a promise, and the tree shows its loading row below the folder while the promise is pending; the owner adds the subfolders to `folders`, and the folder stays expanded. A rejection shows its message, or the provider string `actionFailed`, in an `InlineError` alert (`ui-folder-manager__load-error`) in the folder's row, whose Retry button loads again.

Opening many folders at once shall take time in proportion to the size of the tree, not to that size times the number of folders opened.

Implementation: `src/components/tree/use-tree-loads.ts`, `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `src/components/folder-manager/use-folder-tree.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-6 - Several folders

### UIC-FOLDER-MANAGER-6.1 - Multiple selection

With `selectionMode="multiple"`, the tree shall select several folders (React Aria multiple selection that replaces on press: Ctrl, Cmd or Shift with a press, and Shift with the arrow keys, extend it), controlled with `selectedKeys` or held from `defaultSelectedKeys`, and reports each change to `onSelectionChange` as a `Set` of keys, as React Aria's collections do. The root row stands for an empty selection.

Implementation: `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-6.2 - Deleting several folders

Delete shall delete every selected folder except those inside another selected one, calling `onDelete` for each in tree order and waiting for each. Every selected folder is checked before the folders inside another selected one are set aside: one for which `getDeleteBlockedReason` returns a reason, nested or not, blocks the whole delete with that reason (UIC-FOLDER-MANAGER-2.6) in the toolbar, the context menu and the Delete key, and nothing is deleted, and a rejection stops the deletes and shows its message. Afterwards the selection falls back to the first deleted folder's parent.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`

### UIC-FOLDER-MANAGER-6.3 - Move to

With `onMove` in multiple selection, the context menu shall hold Move to (provider string `moveTo`) with a submenu of the places the selected folders may go: the top level (named by `rootLabel`, or the provider string `topLevel`), then every folder in tree order, named by its path (`Fruit / Citrus`), except the selected folders, the folders inside them and the places where a selected folder would sit below `maxDepth`. Choosing one reports a `TreeMove` for each selected folder outside another selected one, in tree order: inside the folder as its last child, or after the last top-level folder and then after the folder moved before it. A folder already there is left alone, and the destination expands.

The places shall be listed when the menu opens, not while folders are selected, and listing them or planning the moves shall take time in proportion to the size of the tree, however many folders are selected. An empty selection plans no move.

Implementation: `src/components/folder-manager/folder-moves.ts`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/use-folder-manager.ts`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-7 - Finding a folder

### UIC-FOLDER-MANAGER-7.1 - Filter

`filterable` shall draw a [SearchField](SEARCH-FIELD.md) (`ui-folder-manager__filter`) above the tree, named by the provider string `filterLabel` with the tree's `aria-label` (or `search`). Its query keeps the loaded folders whose name holds every term, matched as [TextMatch](TEXT-MATCH.md) matches them, with their ancestors, expands the branches that hold matches, the root row included, and marks the matched text with `TextMatch`; without a match the tree shows the provider string `noResults` in place of every row, the root row included. Starting to create or rename a folder clears the query. Without `filterable` a query typed before is set aside, so it never narrows the tree unseen; it applies again when the search box comes back.

Revealing the matching branches shall take time in proportion to the size of the tree, however many branches match.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `src/components/folder-manager/use-folder-tree.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-8 - Large trees

### UIC-FOLDER-MANAGER-8.1 - Virtualization

`virtualized` and `rowHeight` shall pass to the tree, which then renders only the rows in view (UIC-TREE-4.5).

Filtering, selecting, measuring depths and listing the places of Move to shall work on a tree of any depth, such as thousands of nested levels, keeping the folders in reading order. A draft row stays last under its parent, and a folder whose subfolders are loaded never shows as not loaded because the filter hides them.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`, `src/utils/map-tree.ts`, `src/utils/walk-tree.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `e2e/folder-manager.spec.ts`

## Hooks

| Hook                            | Kind  | Values | Description                                               |
| ------------------------------- | ----- | ------ | --------------------------------------------------------- |
| `ui-folder-manager`             | root  |        | The manager's `<div>`.                                    |
| `ui-folder-manager__toolbar`    | slot  |        | The New folder, Rename and Delete buttons.                |
| `ui-folder-manager__filter`     | slot  |        | The filter search box (also `ui-search-field`).           |
| `ui-folder-manager__tree`       | slot  |        | Holds the tree (`ui-tree`); the context menu's target.    |
| `ui-folder-manager__name-input` | slot  |        | The name field of a folder being created or renamed.      |
| `ui-folder-manager__message`    | slot  |        | Why the last action was refused (also `ui-inline-error`). |
| `ui-folder-manager__load-error` | slot  |        | Why a folder's subfolders failed to load, in its row.     |
| `data-pending`                  | state | `true` | Loading, deleting or naming a folder.                     |
| `data-focused`                  | state | `true` | The name field has focus (React Aria).                    |
| `data-focus-visible`            | state | `true` | Keyboard focus on the name field (React Aria).            |
| `data-hovered`                  | state | `true` | Pointer over the name field (React Aria).                 |
| `data-invalid`                  | state | `true` | The name field after a refused attempt (React Aria).      |
