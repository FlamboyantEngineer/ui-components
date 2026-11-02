'use client';

import { useMemo } from 'react';
import { mergeThreeWay } from '../../utils/three-way-merge.js';
import { useGeneration } from '../../utils/use-generation.js';
import { useStateFor } from '../../utils/use-state-for.js';
import {
  createMergeBlocks,
  createMergeText,
  type ConflictMarkers,
  type ConflictState,
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

const finalBreak = /(?:\r\n|\r|\n)$/;

function createInitialState(blocks: readonly MergeBlock[]): MergeState {
  const conflicts = blocks.filter((block) => block.conflict !== null).length;
  const states = Array.from({ length: conflicts }, (): ConflictState => ({
    resolution: 'unresolved',
  }));
  return { states, current: null };
}

function countUnresolved(states: readonly ConflictState[]): number {
  return states.filter((entry) => entry.resolution === 'unresolved').length;
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
  const initial = useMemo(() => createInitialState(blocks), [blocks]);
  const [state, setState] = useStateFor(blocks, initial);
  const generation = useGeneration(blocks);
  const resolve = (conflict: number, next: ConflictState) => {
    const states = state.states.map((entry, index) => (index === conflict ? next : entry));
    setState({ states, current: conflict });
    onChange?.({
      text: createMergeText({ blocks, states, markers, hasFinalBreak: finalBreak.test(ours) }),
      resolutions: states.map((entry) => entry.resolution),
      unresolved: countUnresolved(states),
    });
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
