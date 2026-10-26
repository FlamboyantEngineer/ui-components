import type { NameMatch, TestUser } from './test-user.js';
/** Presses the expand button of the tree row named `name`, expanding or collapsing it. */
export declare function toggleTreeItem(user: TestUser, tree: Element, name: NameMatch): Promise<void>;
/**
 * The cell of a table or grid at the row named `rowName` (rows are named by their row header) and
 * the column whose header is named `columnName`.
 */
export declare function getTableCell(table: Element, rowName: NameMatch, columnName: NameMatch): HTMLElement;
//# sourceMappingURL=collections.d.ts.map