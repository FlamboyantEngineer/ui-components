/** Indexes `grants` by role and permission. */
export function indexGrants(grants) {
    const byRole = new Map();
    for (const grant of grants) {
        const permissions = byRole.get(grant.role) ?? new Set();
        permissions.add(grant.permission);
        byRole.set(grant.role, permissions);
    }
    return { has: (role, permission) => byRole.get(role)?.has(permission) ?? false };
}
/**
 * The grants after `change`, without changing `grants`: revoked grants leave, newly granted ones
 * join at the end, and grants the change already matches stay where they are.
 */
export function applyPermissionChange(grants, change) {
    const changed = new Set(change.permissions);
    const isChanged = (grant) => grant.role === change.role && changed.has(grant.permission);
    if (!change.isGranted)
        return grants.filter((grant) => !isChanged(grant));
    const index = indexGrants(grants);
    const added = change.permissions
        .filter((permission) => !index.has(change.role, permission))
        .map((permission) => ({ role: change.role, permission }));
    return [...grants, ...added];
}
//# sourceMappingURL=permission-grants.js.map