import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { permissionMatrixHooks as hooks } from './permission-matrix-hooks.js';
/** A role's column header: its label, and a lock read as the provider's `readOnlyRole` when read only. */
export function PermissionRoleHeader({ role }) {
    const strings = useUiStrings();
    const isReadOnly = role.isReadOnly ?? false;
    return (_jsxs("span", { ...hooks.slot('role', { readonly: isReadOnly }), children: [_jsx("span", { ...hooks.slot('role-label'), children: role.label }), isReadOnly ? (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "lock", className: hooks.slotClass('lock') }), _jsx(VisuallyHidden, { elementType: "span", children: `, ${strings.readOnlyRole}` })] })) : null] }));
}
/**
 * The checkbox of one role and permission: ticked while granted, drawn mixed while only
 * inherited, read only in a read-only role, and dirty while it differs from the committed grants.
 */
export function PermissionGrantCheckbox({ role, permission, context }) {
    const strings = useUiStrings();
    const isGranted = context.grants.has(role.id, permission.id);
    const isInherited = context.inherited.has(role.id, permission.id);
    const isDirty = isGranted !== context.committed.has(role.id, permission.id);
    return (_jsx(Checkbox, { size: "sm", "aria-label": strings.permissionGrant(permission.label, role.label, isInherited && !isGranted), isSelected: isGranted, isIndeterminate: isInherited && !isGranted, isReadOnly: role.isReadOnly, className: hooks.slotClass('grant'), "data-inherited": isInherited || undefined, "data-dirty": isDirty || undefined, onChange: (isSelected) => context.onChange({ role: role.id, permissions: [permission.id], isGranted: isSelected }) }));
}
/**
 * A group header's checkbox for one role: ticked while the role holds every permission of the
 * group, mixed while it holds some; a press grants them all, or revokes them all once all are held.
 */
export function PermissionGroupCheckbox({ role, label, permissions, context }) {
    const strings = useUiStrings();
    const keys = permissions.map((permission) => permission.id);
    const held = keys.filter((key) => context.grants.has(role.id, key)).length;
    const isAll = keys.length > 0 && held === keys.length;
    return (_jsx(Checkbox, { size: "sm", "aria-label": strings.permissionGroupGrant(label, role.label), isSelected: isAll, isIndeterminate: held > 0 && !isAll, isReadOnly: role.isReadOnly, className: hooks.slotClass('group-grant'), onChange: () => context.onChange({ role: role.id, permissions: keys, isGranted: !isAll }) }));
}
//# sourceMappingURL=permission-matrix-cells.js.map