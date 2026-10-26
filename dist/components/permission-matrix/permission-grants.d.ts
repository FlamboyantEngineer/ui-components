import type { Key } from '../../core/props.js';
/** A permission granted to a role. */
export interface PermissionMatrixGrant {
    role: Key;
    permission: Key;
}
/** A change the reader made: permissions granted to or revoked from one role. */
export interface PermissionMatrixChange {
    role: Key;
    /** One permission for a cell, every permission of the group for a group toggle. */
    permissions: Key[];
    isGranted: boolean;
}
/** Grants by role, for lookups. */
export interface PermissionGrantIndex {
    has: (role: Key, permission: Key) => boolean;
}
/** Indexes `grants` by role and permission. */
export declare function indexGrants(grants: readonly PermissionMatrixGrant[]): PermissionGrantIndex;
/**
 * The grants after `change`, without changing `grants`: revoked grants leave, newly granted ones
 * join at the end, and grants the change already matches stay where they are.
 */
export declare function applyPermissionChange(grants: readonly PermissionMatrixGrant[], change: PermissionMatrixChange): PermissionMatrixGrant[];
//# sourceMappingURL=permission-grants.d.ts.map