import { defineStrings } from '../message-format.js';
/** Strings of relation matrices, permission matrices and relation columns. */
export interface RelationStrings {
  /** Names the column of row headers in a relation matrix, shown in its corner. */
  relationItems: string;
  /** Names the mark of a relation that has no kind of its own. */
  related: string;
  /** A row's or column's relation count in a relation matrix. */
  relationCount: (count: number) => string;
  /** Names the context menu of a relation matrix cell by its row and column items. */
  relationCellActions: (row: string, column: string) => string;
  /** Removes the relation of a relation matrix cell. */
  removeRelation: string;
  /** Names the context menu of a relation matrix row or column header by its item. */
  relationItemActions: (item: string) => string;
  /** Inserts an item beside a relation matrix row or column, on the side named. */
  insertRelationItem: (side: 'above' | 'below' | 'left' | 'right') => string;
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

/** The module's text, with the message values each text function reads its arguments as. */
export const relationStrings = defineStrings<RelationStrings>({
  relationCount: (count) => ({ count }),
  relationCellActions: (row, column) => ({ row, column }),
  relationItemActions: (item) => ({ item }),
  insertRelationItem: (side) => ({ side }),
  permissionGrant: (permission, role, isInherited) => ({ permission, role, isInherited }),
  permissionGroupGrant: (group, role) => ({ group, role }),
  upstreamOf: (item) => ({ item }),
  downstreamOf: (item) => ({ item }),
  relatedCount: (count, direction) => ({ count, direction }),
});
