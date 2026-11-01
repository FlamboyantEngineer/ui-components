# Permission Matrix

`PermissionMatrix` edits which permissions each role holds: a [Table](TABLE.md) with a column per role and a row per permission, a [Checkbox](CHECKBOX.md) in each cell, permissions grouped under header rows whose checkboxes grant or revoke a whole group for a role, inherited permissions drawn mixed, read-only roles, and dirty marks on the cells that differ from the saved grants. It reports each change as plain data, for the owner to save.

## UIC-PERMISSION-MATRIX-1 - Layout

### UIC-PERMISSION-MATRIX-1.1 - Roles and permissions

`PermissionMatrix` shall render a root element holding a `Table` named by its `aria-label` or `aria-labelledby` (its `aria-describedby` and `aria-details` go to the table too): a first column of row headers reading each permission's `label`, headed by the provider's `permissions` string and pinned to the start, then one column per entry of `roles`, in order, headed by a `ui-permission-matrix__role` holding the role's `label` in a `ui-permission-matrix__role-label` slot. Each cell of a role column holds a checkbox (`ui-permission-matrix__grant`) ticked while the role holds the permission. The permission column is at least 160 pixels wide and each role column at least 112, so labels and group counts keep room.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`, `src/components/permission-matrix/permission-matrix-cells.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-1.2 - Permission groups

With `groups`, the permissions shall be listed under one collapsible group header row per group that holds any, in the order of `groups` (Table row groups), each reading its group's `label`; a permission's `group` names its group, and permissions without a known group come last under a group named by the provider's `emptyValue` string. Without `groups` the permissions are one flat list in their order.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-1.3 - Read-only roles

A role with `isReadOnly` shall keep its grants: its checkboxes and group checkboxes are read only and report no change, its header publishes `data-readonly` and draws the `lock` glyph (`ui-permission-matrix__lock`), and its column is named by its label and the provider's `readOnlyRole` string.

Implementation: `src/components/permission-matrix/permission-matrix-cells.tsx`, `src/components/permission-matrix/permission-matrix.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-1.4 - Hooks and caller attributes

`PermissionMatrix` shall carry the hooks below, append the caller's `className` to its root and forward `id`, `ref` and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`, `src/components/permission-matrix/permission-matrix-hooks.ts`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`

### UIC-PERMISSION-MATRIX-1.5 - Role columns follow role ids

Each role column shall be identified by its role's `id` and the id's type, so `1` and `'1'` are distinct roles. When `roles` are reordered, inserted or changed (including `isReadOnly`), every checkbox and group checkbox stays with its role and permission: the focused one keeps focus, and its next change reports the same role. When the focused role is removed, its checkbox leaves with it, and focus goes to the cell in the same row that takes its place rather than retargeting the removed control to another role.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`
Verification: `src/components/permission-matrix/permission-matrix-roles.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-1.6 - Stable table columns

The matrix shall hand its `Table` the same `columns` and `rows` while only the grants change, so a toggle does not rebuild the table's column layout or cell grid: the columns are derived from the roles, groups and provider strings alone, and the cells read the grants, inherited and committed grants and the change handler from a context.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`, `src/components/permission-matrix/permission-matrix-cells.tsx`
Verification: `src/components/permission-matrix/permission-matrix-identity.test.tsx`

### UIC-PERMISSION-MATRIX-1.7 - Virtualized rows

`virtualized` and `rowHeight` shall pass to the `Table`, which then renders only the permission and group rows in view ([UIC-TABLE-7.3](TABLE.md#uic-table-73---virtualization)) and publishes `data-virtualized`; grants, group toggles and collapsing groups work as before, and as in any virtualized table no column pins. The stylesheet bounds the table's height. Without it every permission renders, so a matrix of more than a few hundred permissions should be virtualized.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`, `labs/reference/permission-matrix.css`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-1.8 - Groups follow group ids

Each group header row shall be identified by its group's `id` and the id's type, so `1` and `'1'` are distinct groups, while `groups` gives only their order. When `groups` are reordered, inserted or removed, every group checkbox stays with its group: the focused one keeps focus and its next change reports the same group's permissions, and a collapsed group stays collapsed while the other groups keep their own state.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`, `src/components/table/table-groups.ts`
Verification: `src/components/permission-matrix/permission-matrix-groups.test.tsx`, `e2e/permission-matrix.spec.ts`

## UIC-PERMISSION-MATRIX-2 - Grants

### UIC-PERMISSION-MATRIX-2.1 - Changes as data

The grants shall be a list of `{ role, permission }` entries, controlled with `value` or uncontrolled from `defaultValue`. Toggling a cell calls `onChange(value, change)` with the grants after the change and the change itself, `{ role, permissions, isGranted }`, naming one permission for a cell and every permission of the group for a group checkbox. `applyPermissionChange(grants, change)` returns the grants after a change without changing them: revoked grants leave, new grants join at the end.

Implementation: `src/components/permission-matrix/permission-matrix.tsx`, `src/components/permission-matrix/permission-grants.ts`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `src/components/permission-matrix/permission-grants.test.ts`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-2.2 - Inherited permissions

A permission a role holds through `inherited` (for example from a parent role) but not directly shall draw its checkbox mixed and name it with `inherited` (the provider's `permissionGrant` string); ticking it grants the permission directly and unticking it returns to the inherited state. Its checkbox publishes `data-inherited` whether or not it is also granted directly.

Implementation: `src/components/permission-matrix/permission-matrix-cells.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-2.3 - Group toggles

Each group header row shall hold a checkbox per role (`ui-permission-matrix__group-grant`, the role column's Table aggregate), named by the provider's `permissionGroupGrant` string with the group and the role: ticked while the role holds every permission of the group directly, mixed while it holds some. Pressing it grants every permission of the group, or revokes them all once all are held, as one change.

Implementation: `src/components/permission-matrix/permission-matrix-cells.tsx`, `src/components/permission-matrix/permission-matrix.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

### UIC-PERMISSION-MATRIX-2.4 - Dirty marks

A cell whose grant differs from `committedValue` (the saved grants; the grants of the first render by default) shall publish `data-dirty` on its checkbox, until the grant matches again.

Implementation: `src/components/permission-matrix/permission-matrix-cells.tsx`, `src/components/permission-matrix/permission-matrix.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

## UIC-PERMISSION-MATRIX-3 - Accessibility

### UIC-PERMISSION-MATRIX-3.1 - Named checkboxes in a grid

Every checkbox shall be named by its permission and role (the provider's `permissionGrant` string) or its group and role, so it reads whole out of context. The table's grid keyboard navigation (React Aria) moves between the checkboxes with the arrow keys, Space toggles the focused one, and group rows collapse with ArrowLeft and expand with ArrowRight.

Implementation: `src/components/permission-matrix/permission-matrix-cells.tsx`, `src/components/permission-matrix/permission-matrix.tsx`
Verification: `src/components/permission-matrix/permission-matrix.test.tsx`, `e2e/permission-matrix.spec.ts`

## Hooks

| Hook                                | Kind  | Values | Description                                                   |
| ----------------------------------- | ----- | ------ | ------------------------------------------------------------- |
| `ui-permission-matrix`              | root  |        | The element holding the table.                                |
| `ui-permission-matrix__role`        | slot  |        | A role's column header content.                               |
| `ui-permission-matrix__role-label`  | slot  |        | A role's label.                                               |
| `ui-permission-matrix__lock`        | slot  |        | The lock glyph of a read-only role (also `ui-glyph`).         |
| `ui-permission-matrix__grant`       | slot  |        | The checkbox of a role and a permission (also `ui-checkbox`). |
| `ui-permission-matrix__group-grant` | slot  |        | The checkbox of a role and a group (also `ui-checkbox`).      |
| `data-readonly`                     | state | `true` | A read-only role's header.                                    |
| `data-inherited`                    | state | `true` | A checkbox whose role inherits the permission.                |
| `data-dirty`                        | state | `true` | A checkbox whose grant differs from the committed grants.     |
