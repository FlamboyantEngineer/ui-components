# Folder Manager

`FolderManager` manages a tree of folders on the library [Tree](TREE.md): the reader selects a folder (or several), creates one under it, renames it in place, deletes the selected folders, and reorders or nests folders by drag and drop or Alt+Arrow keys ([Tree Reorder](TREE-REORDER.md)) or moves a selection with Move to. Subfolders can load when a folder is expanded, a search box can filter the folders, and a large tree can render only the rows in view. The folders are data and the manager never changes them: each change goes to a callback, which may return a promise, and the owner renders the result. An action is offered only when its callback is set, so a manager without callbacks is a read-only folder picker. A host that stages a choice behind Apply and Cancel composes the manager in a [Modal](MODAL.md) and reads its selection.

## UIC-FOLDER-MANAGER-1 - Tree

### UIC-FOLDER-MANAGER-1.1 - Folders as a tree

`FolderManager` shall render its nested `folders` (`id`, `name`, `children`) as a `Tree` (inside `ui-folder-manager__tree`) named by its `aria-label` or `aria-labelledby`, one row per folder with the `folder` glyph. Every row with children starts expanded and stays so unless the reader collapses it, so a folder created deep in the tree is in view as soon as it appears.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/use-folder-tree.ts`, `src/core/glyphs.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-1.2 - Root row

`rootLabel` shall add a root row with that label above the folders, standing for no folder: selecting it reports `null`, and it can be neither renamed, deleted nor moved. Folders moved to the top level stay inside it.

Implementation: `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/use-folder-manager.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`

### UIC-FOLDER-MANAGER-1.3 - Selection

The tree shall select one folder at a time (React Aria single selection that follows focus), controlled with `selectedKey` and `onSelectionChange` or held from `defaultSelectedKey`, where `null` is no folder, unless `selectionMode` is `multiple` (UIC-FOLDER-MANAGER-6.1).

Implementation: `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-1.4 - Loading and busy

`isPending` shall show the tree's loading row while there are no folders and make the actions wait. While loading, deleting or naming a folder, the manager is busy: it publishes `data-pending` on its root and refuses other actions and moves.

Implementation: `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`

## UIC-FOLDER-MANAGER-2 - Actions

### UIC-FOLDER-MANAGER-2.1 - Offered actions

A toolbar (`ui-folder-manager__toolbar`) shall hold New folder (`plus` glyph, provider string `newFolder`), Rename (`edit`, `rename`) and Delete (`delete`, `delete`) icon buttons, each drawn only when `onCreate`, `onRename` or `onDelete` is set. Rename acts on the selected folder and is disabled unless exactly one folder is selected; Delete acts on the selected folders and is disabled without one; New folder is disabled while several folders are selected; all are disabled while the manager is busy. Without any of the three callbacks there is no toolbar.

Implementation: `src/components/folder-manager/folder-manager-parts.tsx`, `src/components/folder-manager/folder-manager.tsx`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.2 - Creating a folder

New folder shall add a draft row as the last child of the selected folder (at the top, or under the root row, without one), expanding its ancestors, whose label is an empty name field (`ui-folder-manager__name-input`, named by the provider string `newFolderName`) holding focus. Enter, or leaving the field, calls `onCreate` with the trimmed name and the parent's key (`null` at the top); when it returns or resolves to a key, that folder becomes the selection. A blank name or Escape abandons the draft without calling `onCreate`. When the edit ends, focus goes to the new folder's row, or back to the parent's.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager-parts.tsx`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.3 - Renaming a folder

Rename, F2 on a folder row or the context menu's Rename shall turn the selected folder's label into the name field, seeded with its name and selected, named by the provider string `renameItem` with the name. Enter, or leaving the field, calls `onRename` with the folder's key and the trimmed name; an unchanged or blank name abandons the edit. Focus then returns to the folder's row.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager-parts.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.4 - Keys in the name field

Every key pressed in the name field shall edit the name and reach neither the tree's navigation, typeahead and selection nor its owner keys; Enter submits and Escape abandons.

Implementation: `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.5 - Pending and refused edits

While the promise of `onCreate` or `onRename` is pending, the name field shall be read-only and `aria-busy`, and further submits do nothing, so a held Enter creates one folder. A rejection keeps the field open with the typed name and shows the error's message, or the provider string `actionFailed`, in an `InlineError` alert (`ui-folder-manager__message`) that describes the field, which is then invalid; Enter retries the same name.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/folder-manager-parts.tsx`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`

### UIC-FOLDER-MANAGER-2.6 - Deleting a folder

Delete, the Delete key on a folder row or the context menu's Delete shall call `onDelete` with the selected folder's key, without a confirmation step. A folder for which `getDeleteBlockedReason` returns a reason cannot be deleted: the Delete button is disabled but stays focusable with the reason as its tooltip, the menu entry is disabled with the reason as its description, and the Delete key shows the reason as the message. After a delete the selection falls back to the folder's parent (or no folder) and its row takes focus; a rejection shows its message.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-2.7 - Depth limit

With `maxDepth`, New folder shall be disabled on a folder at that depth (the top level being 1), focusable with the provider string `folderDepthLimit` as its tooltip, and a move that would place a folder or its deepest subfolder below that depth is refused.

Measuring the deepest loaded child shall reduce the children without an argument limit.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`

### UIC-FOLDER-MANAGER-2.8 - Context menu

A secondary click on a folder or root row shall select it (keeping a multiple selection it belongs to) and open a context menu holding the offered Rename and Delete entries, and Move to in multiple selection (UIC-FOLDER-MANAGER-6.3); Shift+F10 or the Context Menu key opens it for the selected row. Entries that do not apply (the root row, a busy manager) are disabled. Without Rename and Delete the browser's own menu is left alone.

Implementation: `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-3 - Reordering

### UIC-FOLDER-MANAGER-3.1 - Moves

`onMove` shall make the tree reorderable: folders move among their siblings and into other folders by drag and drop, Alt+ArrowUp and Alt+ArrowDown, and Alt+ArrowRight and Alt+ArrowLeft. Each move is reported as a `TreeMove` for the owner to apply (for example with `applyTreeMove`). The root and draft rows never move, and nothing moves while the manager is busy.

Implementation: `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-4 - Attributes

### UIC-FOLDER-MANAGER-4.1 - Hooks and caller attributes

`FolderManager` shall carry the hooks below and put the caller's `className`, `id` and `data-*` attributes on its root.

Implementation: `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`

## UIC-FOLDER-MANAGER-5 - Subfolders on demand

### UIC-FOLDER-MANAGER-5.1 - Loading subfolders

A folder with `hasChildren` and no `children` shall start collapsed with an expand button (UIC-TREE-2.2). Expanding it calls `onLoadChildren` with its key, which may return a promise, and the tree shows its loading row below the folder while the promise is pending; the owner adds the subfolders to `folders`, and the folder stays expanded. A rejection shows its message, or the provider string `actionFailed`, in an `InlineError` alert (`ui-folder-manager__load-error`) in the folder's row, whose Retry button loads again.

Expansion shall collect branch and lazy-folder membership once per tree walk, so opening many folders does not search the tree again for each key.

Implementation: `src/components/tree/use-tree-loads.ts`, `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `src/components/folder-manager/use-folder-tree.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-6 - Several folders

### UIC-FOLDER-MANAGER-6.1 - Multiple selection

With `selectionMode="multiple"`, the tree shall select several folders (React Aria multiple selection that replaces on press: Ctrl, Cmd or Shift with a press, and Shift with the arrow keys, extend it), controlled with `selectedKeys` and `onSelectedKeysChange` or held from `defaultSelectedKeys`. The root row stands for an empty selection.

Implementation: `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-6.2 - Deleting several folders

Delete shall delete every selected folder except those inside another selected one, calling `onDelete` for each in tree order and waiting for each. A selected folder for which `getDeleteBlockedReason` returns a reason blocks the whole delete with that reason (UIC-FOLDER-MANAGER-2.6), and a rejection stops the deletes and shows its message. Afterwards the selection falls back to the first deleted folder's parent.

Implementation: `src/components/folder-manager/use-folder-actions.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`

### UIC-FOLDER-MANAGER-6.3 - Move to

With `onMove` in multiple selection, the context menu shall hold Move to (provider string `moveTo`) with a submenu of the places the selected folders may go: the top level (named by `rootLabel`, or the provider string `topLevel`), then every folder in tree order, named by its path (`Fruit / Citrus`), except the selected folders, the folders inside them and the places where a selected folder would sit below `maxDepth`. Choosing one reports a `TreeMove` for each selected folder outside another selected one, in tree order: inside the folder as its last child, or after the last top-level folder and then after the folder moved before it. A folder already there is left alone, and the destination expands.

Destination depth checks shall reuse the paths already listed. Planning a selection's moves shall read the folders' current parents in one tree traversal rather than search again for each selected folder, stopping once all selected folders are found. An empty selection shall not read any folders.

Implementation: `src/components/folder-manager/folder-moves.ts`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/use-folder-manager.ts`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-7 - Finding a folder

### UIC-FOLDER-MANAGER-7.1 - Filter

`filterable` shall draw a [SearchField](SEARCH-FIELD.md) (`ui-folder-manager__filter`) above the tree, named by the provider string `filterLabel` with the tree's `aria-label` (or `search`). Its query keeps the loaded folders whose name holds every term, matched as [TextMatch](TEXT-MATCH.md) matches them, with their ancestors, expands the branches that hold matches and marks the matched text with `TextMatch`; without a match the tree shows the provider string `noResults`. Starting to create or rename a folder clears the query.

Revealing matching branches shall compare collapsed keys against a set of revealed keys, without a repeated scan for each branch.

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-model.ts`, `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`, `src/components/folder-manager/use-folder-tree.test.tsx`, `e2e/folder-manager.spec.ts`

## UIC-FOLDER-MANAGER-8 - Large trees

### UIC-FOLDER-MANAGER-8.1 - Virtualization

`virtualized` and `rowHeight` shall pass to the tree, which then renders only the rows in view (UIC-TREE-4.5).

Preparing filtered nodes, collecting branch keys and selected folders, measuring paths and subtree height, and listing destinations shall preserve reading order without a JavaScript call stack depth limit. Draft rows remain last at their requested parent, and a folder with loaded children never becomes lazy merely because filtering hides those children.

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
| `data-disabled`                 | state | `true` | A disabled name field (React Aria).                       |
