/** Strings of merge views and pivot tables. */
export interface AnalysisStrings {
  /** Names our side of a three-way merge. */
  mergeViewOurs: string;
  /** Names the common base of a three-way merge. */
  mergeViewBase: string;
  /** Names their side of a three-way merge. */
  mergeViewTheirs: string;
  /** Names the merged result. */
  mergeViewResult: string;
  /** How many of a merge's conflicts are still unresolved, out of all of them. */
  mergeViewConflictCount: (unresolved: number, total: number) => string;
  /** Names one conflict of a merge by its position. */
  mergeViewConflict: (index: number, total: number) => string;
  /** Names the editable result of one conflict by its position. */
  mergeViewConflictResult: (index: number) => string;
  /** A conflict no side has been taken for yet. */
  mergeViewUnresolved: string;
  /** A conflict with a result. */
  mergeViewResolved: string;
  /** Takes one side's lines, named by the side, as a conflict's result. */
  mergeViewTake: (side: string) => string;
  /** Takes our lines followed by theirs as a conflict's result. */
  mergeViewTakeBoth: string;
  /** Moves to the previous conflict of a merge. */
  mergeViewPreviousConflict: string;
  /** Moves to the next conflict of a merge. */
  mergeViewNextConflict: string;
  /** Names one line of a merge side: how the side changed it, then its number. */
  mergeViewLine: (change: 'unchanged' | 'changed' | 'conflict', number: number) => string;
  /** Names the list of fields a pivot does not use. */
  pivotFields: string;
  /** Names the fields that group a pivot's rows. */
  pivotRows: string;
  /** Names the fields that group a pivot's columns. */
  pivotColumns: string;
  /** Names the values a pivot aggregates. */
  pivotValues: string;
  /** Heads the totals of a pivot. */
  pivotTotal: string;
  /** Stands for an empty group key in a pivot. */
  pivotEmptyKey: string;
  /** Shown in a zone of the pivot field chooser without fields. */
  pivotNoFields: string;
  /** Names the pivot field chooser. */
  pivotFieldChooser: string;
  /** Names a built-in aggregation. */
  pivotAggregate: (aggregate: 'sum' | 'count' | 'min' | 'max' | 'average') => string;
  /** Heads an aggregated value: the aggregation's name, then the field's. */
  pivotValueLabel: (aggregate: string, field: string) => string;
  /** Names the aggregation picker of a value field. */
  pivotAggregationOf: (field: string) => string;
}

const conflictsText = (count: number) => (count === 1 ? '1 conflict' : `${count} conflicts`);

const aggregateNames = {
  sum: 'Sum',
  count: 'Count',
  min: 'Minimum',
  max: 'Maximum',
  average: 'Average',
} as const;

const lineChanges = { unchanged: null, changed: 'Changed', conflict: 'Conflict' } as const;

export const analysisStrings: AnalysisStrings = {
  mergeViewOurs: 'Ours',
  mergeViewBase: 'Base',
  mergeViewTheirs: 'Theirs',
  mergeViewResult: 'Result',
  mergeViewConflictCount: (unresolved, total) => {
    if (total === 0) return 'No conflicts';
    if (unresolved === 0)
      return total === 1 ? 'Conflict resolved' : `All ${total} conflicts resolved`;
    return `${unresolved} of ${conflictsText(total)} unresolved`;
  },
  mergeViewConflict: (index, total) => `Conflict ${index} of ${total}`,
  mergeViewConflictResult: (index) => `Result of conflict ${index}`,
  mergeViewUnresolved: 'Unresolved',
  mergeViewResolved: 'Resolved',
  mergeViewTake: (side) => `Take ${side}`,
  mergeViewTakeBoth: 'Take both',
  mergeViewPreviousConflict: 'Previous conflict',
  mergeViewNextConflict: 'Next conflict',
  mergeViewLine: (change, number) =>
    lineChanges[change] === null ? `Line ${number}` : `${lineChanges[change]}, line ${number}`,
  pivotFields: 'Fields',
  pivotRows: 'Rows',
  pivotColumns: 'Columns',
  pivotValues: 'Values',
  pivotTotal: 'Total',
  pivotEmptyKey: '(empty)',
  pivotNoFields: 'No fields',
  pivotFieldChooser: 'Pivot fields',
  pivotAggregate: (aggregate) => aggregateNames[aggregate],
  pivotValueLabel: (aggregate, field) => `${aggregate} of ${field}`,
  pivotAggregationOf: (field) => `Aggregation of ${field}`,
};
