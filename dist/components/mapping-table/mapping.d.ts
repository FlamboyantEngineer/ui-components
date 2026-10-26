/** A column of the source data, such as a column of a spreadsheet being imported. */
export interface MappingTableColumn {
    /** Unique among the columns: the key of the column's target in the mapping. */
    id: string;
    /** The column's name, such as its header text. */
    label: string;
    /** A few of the column's values, to recognise its content by. */
    samples?: readonly string[] | undefined;
}
/** A field the columns can be imported into. */
export interface MappingTableTarget {
    /** Unique among the targets: the value a column maps to. */
    id: string;
    label: string;
    /** Some column must map to this target before the mapping is complete. */
    isRequired?: boolean | undefined;
}
/** The target id each column maps to, by column id; `null` or a missing column is not imported. */
export type MappingTableValue = Readonly<Record<string, string | null>>;
/** The target a column most likely maps to, or `null` when none fits. */
export type MappingTableSuggest = (column: MappingTableColumn, targets: readonly MappingTableTarget[]) => string | null;
/** What a mapping covers and what it lacks. */
export interface MappingSummary {
    /** The columns mapped to a known target. */
    mappedCount: number;
    /** The columns left out of the import. */
    skippedCount: number;
    /** The ids of the required targets no column maps to, in target order. */
    unmappedRequired: readonly string[];
    /** The ids of the columns mapped to each target that more than one column maps to. */
    duplicates: Readonly<Record<string, readonly string[]>>;
    /** Every required target is mapped. Duplicates warn without blocking. */
    isComplete: boolean;
}
/** The mapping the suggestions make: each column to its suggested target, if it is known. */
export declare function suggestMapping(columns: readonly MappingTableColumn[], targets: readonly MappingTableTarget[], suggest: MappingTableSuggest | undefined): Record<string, string | null>;
/** The target a column maps to, or `null` when it is not imported or maps to an unknown target. */
export declare function readMappedTarget(value: MappingTableValue, column: string, targets: readonly MappingTableTarget[]): string | null;
/** Counts the mapped and skipped columns and finds unmapped required and duplicate targets. */
export declare function summarizeMapping(columns: readonly MappingTableColumn[], targets: readonly MappingTableTarget[], value: MappingTableValue): MappingSummary;
//# sourceMappingURL=mapping.d.ts.map