import { jsx as _jsx } from "react/jsx-runtime";
// Roles × permissions: a configured Table whose role columns hold checkboxes and whose permission
// groups get a header row with a checkbox per role.
import { useMemo, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { Table } from '../table/table.js';
import { applyPermissionChange, indexGrants, } from './permission-grants.js';
import { PermissionGrantCheckbox, PermissionGroupCheckbox, PermissionRoleHeader, } from './permission-matrix-cells.js';
import { permissionMatrixHooks as hooks } from './permission-matrix-hooks.js';
const permissionColumnId = 'permission';
const noGrants = [];
/** The narrowest permission and role columns, in pixels: room for a label and a group's count. */
const permissionMinWidth = 160;
const roleMinWidth = 112;
/**
 * Groups the rows by their group's position in `groups`, so groups keep the caller's order;
 * permissions outside every group come last, named by the provider's `emptyValue`.
 */
function useGrouping(groups, emptyLabel) {
    return useMemo(() => {
        const order = new Map(groups?.map((group, index) => [group.id, index]));
        const position = (row) => row.group === undefined ? null : (order.get(row.group) ?? null);
        const label = (index) => index === null ? emptyLabel : (groups?.[index]?.label ?? emptyLabel);
        return {
            groupBy: groups ? [{ id: 'group', label: '', getValue: position }] : undefined,
            renderGroupLabel: (group) => label(typeof group.value === 'number' ? group.value : null),
            labelRows: (rows) => label(rows[0] ? position(rows[0]) : null),
        };
    }, [groups, emptyLabel]);
}
function roleColumn(role, index, options) {
    const { context, readOnlyText, grouping } = options;
    return {
        id: `role-${index}`,
        minWidth: roleMinWidth,
        header: _jsx(PermissionRoleHeader, { role: role }),
        textValue: role.isReadOnly ? `${role.label}, ${readOnlyText}` : role.label,
        align: 'center',
        renderCell: (permission) => (_jsx(PermissionGrantCheckbox, { role: role, permission: permission, context: context })),
        aggregate: (rows) => (_jsx(PermissionGroupCheckbox, { role: role, label: grouping.labelRows(rows), permissions: rows, context: context })),
    };
}
/**
 * A matrix of roles (columns) × permissions (rows) on a `Table`: a checkbox per cell, ticked while
 * the role holds the permission and drawn mixed while it only inherits it, permission groups under
 * collapsible header rows with a checkbox per role that grants or revokes the whole group, read-only
 * role columns, and dirty marks on cells that differ from the committed grants. Each change is
 * reported as plain data.
 */
export function PermissionMatrix({ roles, permissions, groups, value, defaultValue = noGrants, onChange, inherited = noGrants, committedValue, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-details': ariaDetails, className, ...rest }) {
    const strings = useUiStrings();
    const [grants, setGrants] = useControllableState(value, defaultValue);
    const [initial] = useState(grants);
    const grantIndex = useMemo(() => indexGrants(grants), [grants]);
    const inheritedIndex = useMemo(() => indexGrants(inherited), [inherited]);
    const committed = committedValue ?? initial;
    const committedIndex = useMemo(() => indexGrants(committed), [committed]);
    const grouping = useGrouping(groups, strings.emptyValue);
    const context = {
        ...{ grants: grantIndex, inherited: inheritedIndex, committed: committedIndex },
        onChange: (change) => {
            const next = applyPermissionChange(grants, change);
            setGrants(next);
            onChange?.(next, change);
        },
    };
    const columns = [
        {
            id: permissionColumnId,
            header: strings.permissions,
            isRowHeader: true,
            pin: 'start',
            minWidth: permissionMinWidth,
            getValue: (permission) => permission.label,
        },
        ...roles.map((role, index) => roleColumn(role, index, { context, readOnlyText: strings.readOnlyRole, grouping })),
    ];
    return (_jsx("div", { ...rest, ...hooks.root({ className, props: rest }), children: _jsx(Table, { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, "aria-describedby": ariaDescribedBy, "aria-details": ariaDetails, columns: columns, rows: permissions, groupBy: grouping.groupBy, renderGroupLabel: grouping.renderGroupLabel }) }));
}
//# sourceMappingURL=permission-matrix.js.map