// A three-way merge's result as a merge view reports it, for its states or before any change.

import { mergeThreeWay } from '../../utils/three-way-merge.js';
import {
  type ConflictMarkers,
  type ConflictState,
  createMergeBlocks,
  createMergeText,
  type MergeBlock,
  type MergeResolution,
} from './merge-blocks.js';

/** The merge after a change: the result text and how each conflict stands. */
export interface MergeViewResult {
  /**
   * The merged text: clean changes applied, each resolved conflict's result, and each unresolved
   * conflict's sides between conflict markers.
   */
  text: string;
  /** Each conflict's resolution, in order. */
  resolutions: MergeResolution[];
  /** How many conflicts are unresolved. */
  unresolved: number;
}

/** Every conflict of the blocks, unresolved. */
export function createInitialStates(blocks: readonly MergeBlock[]): ConflictState[] {
  const conflicts = blocks.filter((block) => block.conflict !== null).length;
  return Array.from({ length: conflicts }, (): ConflictState => ({ resolution: 'unresolved' }));
}

/**
 * The merge of three texts before any conflict is resolved: what `MergeView` holds when it opens,
 * so a host learns a merge that needs no action (`unresolved` is 0) without drawing the view.
 * `markers` name the sides on unresolved conflicts' markers, as the view's side labels do.
 */
export function getMergeViewResult(options: {
  base: string;
  ours: string;
  theirs: string;
  markers: ConflictMarkers;
}): MergeViewResult {
  const { base, ours, theirs, markers } = options;
  const blocks = createMergeBlocks(mergeThreeWay(base, ours, theirs));
  return toMergeViewResult({ blocks, states: createInitialStates(blocks), markers, ours });
}

/** The result a merge view reports for its conflicts' states. */
export function toMergeViewResult({
  blocks,
  states,
  markers,
  ours,
}: {
  blocks: readonly MergeBlock[];
  states: readonly ConflictState[];
  markers: ConflictMarkers;
  ours: string;
}): MergeViewResult {
  return {
    text: createMergeText({ blocks, states, markers, ours }),
    resolutions: states.map((entry) => entry.resolution),
    unresolved: countUnresolved(states),
  };
}

export function countUnresolved(states: readonly ConflictState[]): number {
  return states.filter((entry) => entry.resolution === 'unresolved').length;
}
