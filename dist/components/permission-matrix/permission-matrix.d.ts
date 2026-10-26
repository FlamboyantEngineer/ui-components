import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { type PermissionMatrixChange, type PermissionMatrixGrant } from './permission-grants.js';
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
/**
 * A matrix of roles (columns) × permissions (rows) on a `Table`: a checkbox per cell, ticked while
 * the role holds the permission and drawn mixed while it only inherits it, permission groups under
 * collapsible header rows with a checkbox per role that grants or revokes the whole group, read-only
 * role columns, and dirty marks on cells that differ from the committed grants. Each change is
 * reported as plain data.
 */
export declare function PermissionMatrix({ roles, permissions, groups, value, defaultValue, onChange, inherited, committedValue, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-details': ariaDetails, className, ...rest }: PermissionMatrixProps): import("react").JSX.Element;
//# sourceMappingURL=permission-matrix.d.ts.map