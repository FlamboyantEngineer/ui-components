import type { PermissionGrantIndex, PermissionMatrixChange } from './permission-grants.js';
import type { PermissionMatrixPermission, PermissionMatrixRole } from './permission-matrix.js';
/** The grants a role's cells read and how they report changes. */
export interface PermissionCellContext {
    grants: PermissionGrantIndex;
    inherited: PermissionGrantIndex;
    committed: PermissionGrantIndex;
    onChange: (change: PermissionMatrixChange) => void;
}
interface GrantCheckboxProps {
    role: PermissionMatrixRole;
    permission: PermissionMatrixPermission;
    context: PermissionCellContext;
}
interface GroupCheckboxProps {
    role: PermissionMatrixRole;
    /** The group's name. */
    label: string;
    permissions: readonly PermissionMatrixPermission[];
    context: PermissionCellContext;
}
/** A role's column header: its label, and a lock read as the provider's `readOnlyRole` when read only. */
export declare function PermissionRoleHeader({ role }: {
    role: PermissionMatrixRole;
}): import("react").JSX.Element;
/**
 * The checkbox of one role and permission: ticked while granted, drawn mixed while only
 * inherited, read only in a read-only role, and dirty while it differs from the committed grants.
 */
export declare function PermissionGrantCheckbox({ role, permission, context }: GrantCheckboxProps): import("react").JSX.Element;
/**
 * A group header's checkbox for one role: ticked while the role holds every permission of the
 * group, mixed while it holds some; a press grants them all, or revokes them all once all are held.
 */
export declare function PermissionGroupCheckbox({ role, label, permissions, context }: GroupCheckboxProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=permission-matrix-cells.d.ts.map