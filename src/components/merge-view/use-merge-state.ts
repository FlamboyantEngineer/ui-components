'use client';

import { useMemo } from 'react';
import { mergeThreeWay } from '../../utils/three-way-merge.js';
import { useGeneration } from '../../utils/use-generation.js';
import { useStateFor } from '../../utils/use-state-for.js';
import { type ConflictMarkers, type ConflictState, createMergeBlocks } from './merge-blocks.js';
import {
  countUnresolved,
  createInitialStates,
  type MergeViewResult,
  toMergeViewResult,
} from './merge-result.js';

interface MergeStateOptions {
  base: string;
  ours: string;
  theirs: string;
  markers: ConflictMarkers;
  onChange: ((result: MergeViewResult) => void) | undefined;
}

/** What a merge view holds for one set of texts, starting over when they change. */
interface MergeState {
  states: readonly ConflictState[];
  current: number | null;
}

/**
 * A merge view's blocks and conflict states for its texts: resolving a conflict makes it current
 * and reports the result; every conflict, and its editor's history, starts over when a text
 * changes.
 */
export function useMergeState({ base, ours, theirs, markers, onChange }: MergeStateOptions) {
  const blocks = useMemo(
    () => createMergeBlocks(mergeThreeWay(base, ours, theirs)),
    [base, ours, theirs],
  );
  const initial = useMemo(
    (): MergeState => ({ states: createInitialStates(blocks), current: null }),
    [blocks],
  );
  const [state, setState] = useStateFor(blocks, initial);
  const generation = useGeneration(blocks);
  const resolve = (conflict: number, next: ConflictState) => {
    const states = state.states.map((entry, index) => (index === conflict ? next : entry));
    setState({ states, current: conflict });
    onChange?.(toMergeViewResult({ blocks, states, markers, ours }));
  };
  return {
    blocks,
    generation,
    states: state.states,
    current: state.current,
    unresolved: countUnresolved(state.states),
    resolve,
    setCurrent: (conflict: number) => setState({ ...state, current: conflict }),
  };
}
