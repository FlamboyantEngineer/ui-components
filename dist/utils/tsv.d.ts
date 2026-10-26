/** Rows of cell text as tab-separated text, quoting the cells that need it. */
export declare function formatTsv(rows: readonly (readonly string[])[]): string;
/**
 * Tab-separated text as rows of cell text. Quoted cells may hold tabs, line breaks and doubled
 * quotes; Windows line breaks read as one, and a final line break ends the last row. Empty text
 * has no rows.
 */
export declare function parseTsv(text: string): string[][];
//# sourceMappingURL=tsv.d.ts.map