/** Maps descendants before their parent; returning null omits that item and its mapped children. */
export declare function mapTree<T, U>(items: readonly T[], getChildren: (item: T) => readonly T[] | null | undefined, transform: (item: T, children: U[], index: number) => U | null): U[];
//# sourceMappingURL=map-tree.d.ts.map