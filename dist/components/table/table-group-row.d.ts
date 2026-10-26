import type { ReactNode } from 'react';
import { type TableBodyNode } from './table-groups.js';
import { type TableRowModel } from './table-row.js';
import { type TableRow } from './table-rows.js';
/** A node of the table body: a group header row with its contents, or a row with its own. */
export declare function renderBodyNode<T extends TableRow>(node: TableBodyNode<T>, model: TableRowModel<T>): ReactNode;
//# sourceMappingURL=table-group-row.d.ts.map