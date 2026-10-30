'use client';

import { memo } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import {
  getCleanLines,
  getConflictText,
  type ConflictMarkers,
  type ConflictState,
  type MergeBlock,
} from './merge-blocks.js';
import { mergeViewHooks as hooks } from './merge-view-hooks.js';
import { MergePane, type MergePaneProps } from './merge-view-sides.js';

/** The sides' labels: our side, the base and their side. */
export interface MergeLabels {
  ours: string;
  base: string;
  theirs: string;
}

interface MergeResultPaneProps extends MergePaneProps {
  blocks: readonly MergeBlock[];
  states: readonly ConflictState[];
  labels: MergeLabels;
  /** Prefix of the conflict blocks' ids. */
  baseId: string;
  onResolve: (conflict: number, state: ConflictState) => void;
}

interface ConflictBlockProps {
  block: MergeBlock;
  /** The conflict's 0-based number. */
  conflict: number;
  total: number;
  state: ConflictState;
  labels: MergeLabels;
  id: string;
  isCurrent: boolean;
  onResolve: (state: ConflictState) => void;
}

const takes = ['ours', 'theirs', 'both', 'base'] as const;

/** The id of a conflict's block in the result. */
export function getConflictId(baseId: string, conflict: number): string {
  return `${baseId}-conflict-${conflict}`;
}

function ConflictBlock(props: ConflictBlockProps) {
  const { block, conflict, total, state, labels, id, isCurrent, onResolve } = props;
  const strings = useUiStrings();
  const markers: ConflictMarkers = { ours: labels.ours, theirs: labels.theirs };
  const position = conflict + 1;
  const text = getConflictText(block.chunk, state, markers);
  const takeLabel = (take: (typeof takes)[number]) =>
    take === 'both' ? strings.mergeViewTakeBoth : strings.mergeViewTake(labels[take]);
  return (
    <div
      id={id}
      role="group"
      aria-labelledby={`${id}-title`}
      {...hooks.slot('block', {
        kind: 'conflict',
        resolution: state.resolution,
        current: isCurrent,
      })}
    >
      <div {...hooks.slot('conflict-header')}>
        <span id={`${id}-title`} {...hooks.slot('conflict-title')}>
          {strings.mergeViewConflict(position, total)}
        </span>
        <span {...hooks.slot('resolution')}>
          {state.resolution === 'unresolved'
            ? strings.mergeViewUnresolved
            : strings.mergeViewResolved}
        </span>
        <span {...hooks.slot('actions')}>
          {takes.map((take) => (
            <Button
              key={take}
              size="sm"
              variant="secondary"
              className={hooks.slotClass('take')}
              data-take={take}
              onPress={() => onResolve({ resolution: take })}
            >
              {takeLabel(take)}
            </Button>
          ))}
        </span>
      </div>
      <TextField
        className={hooks.slotClass('editor')}
        label={strings.mergeViewConflictResult(position)}
        labelLayout="control-only"
        multiline
        minRows={1}
        spellCheck={false}
        value={text}
        committedValue={text}
        onChange={(text) => onResolve({ resolution: 'edited', text })}
      />
    </div>
  );
}

/** A clean chunk's merged lines, which an edit of a conflict leaves as they are. */
const CleanBlock = memo(function CleanBlock({ block }: { block: MergeBlock }) {
  return (
    <div {...hooks.slot('block', { kind: block.chunk.kind })}>
      <pre {...hooks.slot('text')}>{getCleanLines(block.chunk).join('\n')}</pre>
    </div>
  );
});

/**
 * The result pane: each clean chunk's merged lines, and each conflict as a block with its take
 * actions and an editor holding its result.
 */
export function MergeResultPane(props: MergeResultPaneProps) {
  const { label, blocks, states, labels, current, baseId, paneRef, onResolve } = props;
  return (
    <MergePane side="result" label={label} paneRef={paneRef}>
      <div {...hooks.slot('blocks')}>
        {blocks.map((block) => {
          const { conflict } = block;
          if (conflict === null) return <CleanBlock key={block.index} block={block} />;
          return (
            <ConflictBlock
              key={block.index}
              block={block}
              conflict={conflict}
              total={states.length}
              state={requireDefined(states[conflict])}
              labels={labels}
              id={getConflictId(baseId, conflict)}
              isCurrent={conflict === current}
              onResolve={(state) => onResolve(conflict, state)}
            />
          );
        })}
      </div>
    </MergePane>
  );
}
