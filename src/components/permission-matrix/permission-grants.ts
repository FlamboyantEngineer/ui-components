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
export function indexGrants(grants: readonly PermissionMatrixGrant[]): PermissionGrantIndex {
  const byRole = new Map<Key, Set<Key>>();
  for (const grant of grants) {
    const permissions = byRole.get(grant.role) ?? new Set<Key>();
    permissions.add(grant.permission);
    byRole.set(grant.role, permissions);
  }
  return { has: (role, permission) => byRole.get(role)?.has(permission) ?? false };
}

/**
 * The grants after `change`, without changing `grants`: revoked grants leave, newly granted ones
 * join at the end, and grants the change already matches stay where they are.
 */
export function applyPermissionChange(
  grants: readonly PermissionMatrixGrant[],
  change: PermissionMatrixChange,
): PermissionMatrixGrant[] {
  const changed = new Set(change.permissions);
  const isChanged = (grant: PermissionMatrixGrant) =>
    grant.role === change.role && changed.has(grant.permission);
  if (!change.isGranted) return grants.filter((grant) => !isChanged(grant));
  const index = indexGrants(grants);
  const added = change.permissions
    .filter((permission) => !index.has(change.role, permission))
    .map((permission) => ({ role: change.role, permission }));
  return [...grants, ...added];
}
