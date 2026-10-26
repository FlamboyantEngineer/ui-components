export const relationStrings = {
    relationItems: 'Items',
    related: 'Related',
    relationCount: (count) => {
        if (count === 0)
            return 'No relations';
        return count === 1 ? '1 relation' : `${count} relations`;
    },
    permissions: 'Permissions',
    permissionGrant: (permission, role, isInherited) => `${permission} for ${role}${isInherited ? ', inherited' : ''}`,
    permissionGroupGrant: (group, role) => `All ${group} for ${role}`,
    readOnlyRole: 'Read only',
    relationItem: 'Item',
    upstreamOf: (item) => `Upstream of ${item}`,
    downstreamOf: (item) => `Downstream of ${item}`,
    noUpstream: 'No upstream items',
    noDownstream: 'No downstream items',
    relatedCount: (count, direction) => `${count} ${direction}`,
    relationPath: 'Relation path',
};
//# sourceMappingURL=relation-strings.js.map