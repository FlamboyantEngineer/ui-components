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
export declare const relationStrings: RelationStrings;
//# sourceMappingURL=relation-strings.d.ts.map