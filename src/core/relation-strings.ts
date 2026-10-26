/** Strings of relation matrices, permission matrices and relation columns. */
export interface RelationStrings {
  /** Names the column of row headers in a relation matrix, shown in its corner. */
  relationItems: string;
  /** Names the mark of a relation that has no kind of its own. */
  related: string;
  /** A row's or column's relation count in a relation matrix. */
  relationCount: (count: number) => string;
  /** Names the column of permissions in a permission matrix. */
  permissions: string;
  /** Names a permission matrix checkbox by its permission, its role and whether it is inherited. */
  permissionGrant: (permission: string, role: string, isInherited: boolean) => string;
  /** Names a permission matrix group toggle by its group and its role. */
  permissionGroupGrant: (group: string, role: string) => string;
  /** Marks a role whose permissions cannot be changed. */
  readOnlyRole: string;
  /** Names the column of the item a relation walk starts from. */
  relationItem: string;
  /** Names a column of the items upstream of an item. */
  upstreamOf: (item: string) => string;
  /** Names a column of the items downstream of an item. */
  downstreamOf: (item: string) => string;
  /** Fills a column with no items upstream. */
  noUpstream: string;
  /** Fills a column with no items downstream. */
  noDownstream: string;
  /** How many items lie further upstream or downstream of an item. */
  relatedCount: (count: number, direction: 'upstream' | 'downstream') => string;
  /** Names the trail of items a relation walk passes through. */
  relationPath: string;
}

export const relationStrings: RelationStrings = {
  relationItems: 'Items',
  related: 'Related',
  relationCount: (count) => {
    if (count === 0) return 'No relations';
    return count === 1 ? '1 relation' : `${count} relations`;
  },
  permissions: 'Permissions',
  permissionGrant: (permission, role, isInherited) =>
    `${permission} for ${role}${isInherited ? ', inherited' : ''}`,
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
