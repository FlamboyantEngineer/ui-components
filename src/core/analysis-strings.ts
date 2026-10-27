import type { MessageArguments } from './message-format.js';
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

/** The message values each text function reads its arguments as. */
export const analysisArguments: MessageArguments<AnalysisStrings> = {
  mergeViewConflictCount: (unresolved, total) => ({ unresolved, total }),
  mergeViewConflict: (index, total) => ({ index, total }),
  mergeViewConflictResult: (index) => ({ index }),
  mergeViewTake: (side) => ({ side }),
  mergeViewLine: (change, number) => ({ change, number: String(number) }),
  pivotAggregate: (aggregate) => ({ aggregate }),
  pivotValueLabel: (aggregate, field) => ({ aggregate, field }),
  pivotAggregationOf: (field) => ({ field }),
};
