'use client';

// Roles × permissions: a configured Table whose role columns hold checkboxes and whose permission
// groups get a header row with a checkbox per role.

import { useMemo, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { Table, type TableProps } from '../table/table.js';
import {
  applyPermissionChange,
  indexGrants,
  type PermissionMatrixChange,
  type PermissionMatrixGrant,
} from './permission-grants.js';
import {
  PermissionGrantCheckbox,
  PermissionGroupCheckbox,
  PermissionRoleHeader,
  type PermissionCellContext,
} from './permission-matrix-cells.js';
import { permissionMatrixHooks as hooks } from './permission-matrix-hooks.js';

/** A role: a column of the matrix. */
export interface PermissionMatrixRole {
  id: Key;
  /** The column header text. */
  label: string;
  /** Keeps the role's grants as they are: its checkboxes are read only. */
  isReadOnly?: boolean | undefined;
}

/** A permission: a row of the matrix. */
export interface PermissionMatrixPermission {
  id: Key;
  /** The row header text. */
  label: string;
  /** The id of the group the permission is listed under. */
  group?: Key | undefined;
}

/** A named group of permissions, with a header row of group toggles. */
export interface PermissionMatrixGroup {
  id: Key;
  label: string;
}

export interface PermissionMatrixProps extends BaseProps, AriaLabellingProps {
  /** The roles, in column order. */
  roles: readonly PermissionMatrixRole[];
  /** The permissions, in row order within their groups. */
  permissions: readonly PermissionMatrixPermission[];
  /** The permission groups, in order. Without them the permissions are one flat list. */
  groups?: readonly PermissionMatrixGroup[] | undefined;
  /** The granted permissions, controlled. */
  value?: readonly PermissionMatrixGrant[] | undefined;
  /** The granted permissions at first, uncontrolled. */
  defaultValue?: readonly PermissionMatrixGrant[] | undefined;
  /** Called with the grants and the change after each change the reader makes. */
  onChange?: ((value: PermissionMatrixGrant[], change: PermissionMatrixChange) => void) | undefined;
  /** Permissions roles hold from elsewhere (a parent role): drawn mixed until granted directly. */
  inherited?: readonly PermissionMatrixGrant[] | undefined;
  /** The saved grants dirty cells differ from. Defaults to the grants of the first render. */
  committedValue?: readonly PermissionMatrixGrant[] | undefined;
}

type PermissionRow = PermissionMatrixPermission;
type PermissionTableProps = TableProps<PermissionRow>;
type TableColumn = PermissionTableProps['columns'][number];
type TableGroupBy = NonNullable<PermissionTableProps['groupBy']>[number];
type TableGroup = Parameters<NonNullable<PermissionTableProps['renderGroupLabel']>>[0];

const permissionColumnId = 'permission';
const noGrants: readonly PermissionMatrixGrant[] = [];
/** The narrowest permission and role columns, in pixels: room for a label and a group's count. */
const permissionMinWidth = 160;
const roleMinWidth = 112;

interface PermissionGrouping {
  groupBy: TableGroupBy[] | undefined;
  renderGroupLabel: (group: TableGroup) => string;
  /** The name of the group `rows` belong to. */
  labelRows: (rows: readonly PermissionRow[]) => string;
}

/**
 * Groups the rows by their group's position in `groups`, so groups keep the caller's order;
 * permissions outside every group come last, named by the provider's `emptyValue`.
 */
function useGrouping(
  groups: readonly PermissionMatrixGroup[] | undefined,
  emptyLabel: string,
): PermissionGrouping {
  return useMemo(() => {
    const order = new Map(groups?.map((group, index) => [group.id, index]));
    const position = (row: PermissionRow) =>
      row.group === undefined ? null : (order.get(row.group) ?? null);
    const label = (index: number | null) =>
      index === null ? emptyLabel : (groups?.[index]?.label ?? emptyLabel);
    return {
      groupBy: groups ? [{ id: 'group', label: '', getValue: position }] : undefined,
      renderGroupLabel: (group) => label(typeof group.value === 'number' ? group.value : null),
      labelRows: (rows) => label(rows[0] ? position(rows[0]) : null),
    };
  }, [groups, emptyLabel]);
}

/** A role's column id, from its id and the id's type, so `1` and `'1'` stay apart. */
const roleColumnId = (id: Key) => `role-${typeof id}-${String(id)}`;

function roleColumn(
  role: PermissionMatrixRole,
  options: { context: PermissionCellContext; readOnlyText: string; grouping: PermissionGrouping },
): TableColumn {
  const { context, readOnlyText, grouping } = options;
  return {
    id: roleColumnId(role.id),
    minWidth: roleMinWidth,
    header: <PermissionRoleHeader role={role} />,
    textValue: role.isReadOnly ? `${role.label}, ${readOnlyText}` : role.label,
    align: 'center',
    renderCell: (permission) => (
      <PermissionGrantCheckbox role={role} permission={permission} context={context} />
    ),
    aggregate: (rows) => (
      <PermissionGroupCheckbox
        role={role}
        label={grouping.labelRows(rows)}
        permissions={rows}
        context={context}
      />
    ),
  };
}

/**
 * A matrix of roles (columns) × permissions (rows) on a `Table`: a checkbox per cell, ticked while
 * the role holds the permission and drawn mixed while it only inherits it, permission groups under
 * collapsible header rows with a checkbox per role that grants or revokes the whole group, read-only
 * role columns, and dirty marks on cells that differ from the committed grants. Each change is
 * reported as plain data.
 */
export function PermissionMatrix({
  roles,
  permissions,
  groups,
  value,
  defaultValue = noGrants,
  onChange,
  inherited = noGrants,
  committedValue,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-details': ariaDetails,
  className,
  ...rest
}: PermissionMatrixProps) {
  const strings = useUiStrings();
  const [grants, setGrants] = useControllableState<readonly PermissionMatrixGrant[]>(
    value,
    defaultValue,
  );
  const [initial] = useState(grants);
  const grantIndex = useMemo(() => indexGrants(grants), [grants]);
  const inheritedIndex = useMemo(() => indexGrants(inherited), [inherited]);
  const committed = committedValue ?? initial;
  const committedIndex = useMemo(() => indexGrants(committed), [committed]);
  const grouping = useGrouping(groups, strings.emptyValue);
  const context: PermissionCellContext = {
    ...{ grants: grantIndex, inherited: inheritedIndex, committed: committedIndex },
    onChange: (change) => {
      const next = applyPermissionChange(grants, change);
      setGrants(next);
      onChange?.(next, change);
    },
  };
  const columns: TableColumn[] = [
    {
      id: permissionColumnId,
      header: strings.permissions,
      isRowHeader: true,
      pin: 'start',
      minWidth: permissionMinWidth,
      getValue: (permission) => permission.label,
    },
    ...roles.map((role) =>
      roleColumn(role, { context, readOnlyText: strings.readOnlyRole, grouping }),
    ),
  ];
  return (
    <div {...rest} {...hooks.root({ className, props: rest })}>
      <Table
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-details={ariaDetails}
        columns={columns}
        rows={permissions}
        groupBy={grouping.groupBy}
        renderGroupLabel={grouping.renderGroupLabel}
      />
    </div>
  );
}
