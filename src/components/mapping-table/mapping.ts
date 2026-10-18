// The plain data of a column mapping: suggestions, and the counts and problems a mapping has.

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
export type MappingTableSuggest = (
  column: MappingTableColumn,
  targets: readonly MappingTableTarget[],
) => string | null;

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
export function suggestMapping(
  columns: readonly MappingTableColumn[],
  targets: readonly MappingTableTarget[],
  suggest: MappingTableSuggest | undefined,
): Record<string, string | null> {
  const known = new Set(targets.map((target) => target.id));
  return Object.fromEntries(
    columns.map((column) => {
      const target = suggest?.(column, targets) ?? null;
      return [column.id, target !== null && known.has(target) ? target : null];
    }),
  );
}

/** The target a column maps to, or `null` when it is not imported or maps to an unknown target. */
export function readMappedTarget(
  value: MappingTableValue,
  column: string,
  targets: readonly MappingTableTarget[],
): string | null {
  const target = value[column] ?? null;
  return target !== null && targets.some((candidate) => candidate.id === target) ? target : null;
}

/** Counts the mapped and skipped columns and finds unmapped required and duplicate targets. */
export function summarizeMapping(
  columns: readonly MappingTableColumn[],
  targets: readonly MappingTableTarget[],
  value: MappingTableValue,
): MappingSummary {
  const sources = new Map<string, string[]>();
  for (const column of columns) {
    const target = readMappedTarget(value, column.id, targets);
    if (target !== null) sources.set(target, [...(sources.get(target) ?? []), column.id]);
  }
  const mappedCount = [...sources.values()].reduce((total, ids) => total + ids.length, 0);
  const unmappedRequired = targets
    .filter((target) => target.isRequired && !sources.has(target.id))
    .map((target) => target.id);
  const duplicates = Object.fromEntries([...sources].filter(([, ids]) => ids.length > 1));
  return {
    mappedCount,
    skippedCount: columns.length - mappedCount,
    unmappedRequired,
    duplicates,
    isComplete: unmappedRequired.length === 0,
  };
}
