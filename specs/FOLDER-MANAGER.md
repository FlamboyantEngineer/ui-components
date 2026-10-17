# Folder Manager

`FolderManager` manages a tree of folders on the library [Tree](TREE.md): the reader selects a folder, creates one under it, renames it in place, deletes it, and reorders or nests folders by drag and drop or Alt+Arrow keys ([Tree Reorder](TREE-REORDER.md)). The folders are data and the manager never changes them: each change goes to a callback, which may return a promise, and the owner renders the result. An action is offered only when its callback is set, so a manager without callbacks is a read-only folder picker. A host that stages a choice behind Apply and Cancel composes the manager in a [Modal](MODAL.md) and reads its selection.

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

The tree shall select one folder at a time (React Aria single selection that follows focus), controlled with `selectedKey` and `onSelectionChange` or held from `defaultSelectedKey`, where `null` is no folder.

Implementation: `src/components/folder-manager/use-folder-tree.ts`, `src/components/folder-manager/folder-tree.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `e2e/folder-manager.spec.ts`

### UIC-FOLDER-MANAGER-1.4 - Loading and busy

`isPending` shall show the tree's loading row while there are no folders and make the actions wait. While loading, deleting or naming a folder, the manager is busy: it publishes `data-pending` on its root and refuses other actions and moves.

Implementation: `src/components/folder-manager/use-folder-manager.ts`, `src/components/folder-manager/folder-manager.tsx`
Verification: `src/components/folder-manager/folder-manager.test.tsx`

## UIC-FOLDER-MANAGER-2 - Actions

### UIC-FOLDER-MANAGER-2.1 - Offered actions

A toolbar (`ui-folder-manager__toolbar`) shall hold New folder (`plus` glyph, provider string `newFolder`), Rename (`edit`, `rename`) and Delete (`delete`, `delete`) icon buttons, each drawn only when `onCreate`, `onRename` or `onDelete` is set. Rename and Delete act on the selected folder and are disabled without one or while the manager is busy. Without any of the three callbacks there is no toolbar.

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

Implementation: `src/components/folder-manager/folder-manager.tsx`, `src/components/folder-manager/folder-tree.tsx`, `src/components/folder-manager/folder-model.ts`, `src/core/strings.ts`
Verification: `src/components/folder-manager/folder-manager.test.tsx`, `src/components/folder-manager/folder-model.test.ts`

### UIC-FOLDER-MANAGER-2.8 - Context menu

A secondary click on a folder or root row shall select it and open a context menu holding the offered Rename and Delete entries; Shift+F10 or the Context Menu key opens it for the selected row. Entries that do not apply (the root row, a busy manager) are disabled. Without Rename and Delete the browser's own menu is left alone.

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

## Hooks

| Hook                            | Kind  | Values | Description                                               |
| ------------------------------- | ----- | ------ | --------------------------------------------------------- |
| `ui-folder-manager`             | root  |        | The manager's `<div>`.                                    |
| `ui-folder-manager__toolbar`    | slot  |        | The New folder, Rename and Delete buttons.                |
| `ui-folder-manager__tree`       | slot  |        | Holds the tree (`ui-tree`); the context menu's target.    |
| `ui-folder-manager__name-input` | slot  |        | The name field of a folder being created or renamed.      |
| `ui-folder-manager__message`    | slot  |        | Why the last action was refused (also `ui-inline-error`). |
| `data-pending`                  | state | `true` | Loading, deleting or naming a folder.                     |
| `data-focused`                  | state | `true` | The name field has focus (React Aria).                    |
| `data-focus-visible`            | state | `true` | Keyboard focus on the name field (React Aria).            |
| `data-hovered`                  | state | `true` | Pointer over the name field (React Aria).                 |
| `data-invalid`                  | state | `true` | The name field after a refused attempt (React Aria).      |
| `data-disabled`                 | state | `true` | A disabled name field (React Aria).                       |
