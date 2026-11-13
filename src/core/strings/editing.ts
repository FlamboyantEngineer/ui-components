import { defineStrings } from '../message-format.js';
/** Strings of column mapping tables and step list editors. */
interface EditingStrings {
  /** Names a mapping table. */
  columnMapping: string;
  /** Heads a mapping table's source column names. */
  sourceColumn: string;
  /** Heads a mapping table's sample values. */
  sampleValues: string;
  /** Heads a mapping table's target choices. */
  importAs: string;
  /** Names the target choice of one source column, from the column's name. */
  importColumnAs: (column: string) => string;
  /** The target choice that leaves a source column out of the import. */
  doNotImport: string;
  /** Marks a required target in the list of targets. */
  requiredTarget: string;
  /** Marks a target chosen from the caller's suggestion. */
  suggestedTarget: string;
  /** Counts the mapped source columns (`3 of 5 columns mapped`). */
  mappedColumns: (mapped: number, total: number) => string;
  /** Counts the source columns left out of the import. */
  skippedColumns: (count: number) => string;
  /** Lists the required targets no column maps to. */
  unmappedRequiredTargets: (targets: readonly string[]) => string;
  /** Warns that a target is mapped from other columns too, from their names. */
  duplicateTarget: (target: string, columns: readonly string[]) => string;
  /** Names a step from its number (`Step 2`). */
  stepLabel: (number: string) => string;
  /** Names the menu of a step's actions, from its number. */
  stepActions: (number: string) => string;
  /** Names a step's drag handle, from its number. */
  moveStep: (number: string) => string;
  /** Announces a moved step's new place, from its new position and the number of steps. */
  stepMoved: (position: number, count: number) => string;
  /** Adds a step at the end of a step list. */
  addStep: string;
  /** Inserts a new step before a step. */
  insertStepAbove: string;
  /** Inserts a new step after a step. */
  insertStepBelow: string;
  /** Shown in place of a step list that has no steps. */
  noSteps: string;
  /** Names a form layout designer's canvas. */
  formLayoutCanvas: string;
  /** Names a form layout designer's palette of nodes to add. */
  formLayoutPalette: string;
  /** Shown in an empty form layout's canvas. */
  formLayoutEmpty: string;
  /** Names the top level of a form layout, where a node outside every container sits. */
  formLayoutTopLevel: string;
  /** Says how the keyboard moves and removes a form layout's nodes. */
  formLayoutKeys: string;
  /** Names the drop target at the end of a form layout container, by the container's name. */
  formLayoutDropAtEnd: (container: string) => string;
  /** Names a form layout node's drag handle, by the node's name. */
  formLayoutMove: (node: string) => string;
  /** Removes a form layout node, by the node's name. */
  formLayoutRemove: (node: string) => string;
  /** Announces a node moved in a form layout: its container and its position there, from 1. */
  formLayoutMoved: (node: string, container: string, position: number) => string;
  /** Announces a node added to a form layout: its container and its position there, from 1. */
  formLayoutAdded: (node: string, container: string, position: number) => string;
  /** Announces a node removed from a form layout. */
  formLayoutRemoved: (node: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const editingStrings = defineStrings<EditingStrings>({
  importColumnAs: (column) => ({ column }),
  mappedColumns: (mapped, total) => ({ mapped, total }),
  skippedColumns: (count) => ({ count }),
  unmappedRequiredTargets: (targets) => ({ targets }),
  duplicateTarget: (target, columns) => ({ target, columns }),
  stepLabel: (number) => ({ number }),
  stepActions: (number) => ({ number }),
  moveStep: (number) => ({ number }),
  stepMoved: (position, count) => ({ position, count }),
  formLayoutDropAtEnd: (container) => ({ container }),
  formLayoutMove: (node) => ({ node }),
  formLayoutRemove: (node) => ({ node }),
  formLayoutMoved: (node, container, position) => ({ node, container, position }),
  formLayoutAdded: (node, container, position) => ({ node, container, position }),
  formLayoutRemoved: (node) => ({ node }),
});
