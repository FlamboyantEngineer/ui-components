'use client';

import { EditGlyph, MinusGlyph, MoveGlyph, PlusGlyph } from '../../core/glyphs.js';
import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Glyph, UiLink, useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import type { BlockChangeCounts, DocumentBlock, DocumentMark } from '../../utils/compare-blocks.js';
import { isSafeUrl } from '../../utils/safe-url.js';
import { ChangeNavigation } from '../text-diff/text-diff.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { MarkedRun, RedlineWords } from './redline-text.js';

export const redlineCompareHooks = createHooks('redline-compare', [
  'header',
  'summary',
  'navigation',
  'previous',
  'next',
  'columns',
  'column-label',
  'rows',
  'row',
  'marker',
  'cell',
  'block',
  'word',
  'mark',
  'notes',
  'note',
  'jump',
  'actions',
  'accept',
  'reject',
]);

const hooks = redlineCompareHooks;

/** Marks nest in this order, the first outermost. */
const markOrder: readonly DocumentMark['type'][] = [
  'link',
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
];

const markElements = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strike: 's',
  code: 'code',
} as const;

/** The name of a block's kind, with its level where the kind has one. */
export function nameBlockType(block: DocumentBlock, strings: UiStrings): string {
  return strings.redlineBlockType(block.type, block.level ?? null);
}

/** Wraps text in one mark's element; a link with an unsafe destination draws as plain text. */
function wrapInMark(mark: DocumentMark, content: ReactNode): ReactNode {
  const props = hooks.slot('mark', { mark: mark.type });
  if (mark.type !== 'link') {
    const Element = markElements[mark.type];
    return <Element {...props}>{content}</Element>;
  }
  if (mark.href === undefined || !isSafeUrl(mark.href)) return <span {...props}>{content}</span>;
  return (
    <UiLink {...props} href={mark.href}>
      {content}
    </UiLink>
  );
}

function MarkedText({ run }: { run: MarkedRun }) {
  const marks = [...run.marks].sort(
    (a, b) => markOrder.indexOf(b.type) - markOrder.indexOf(a.type),
  );
  return <>{marks.reduce<ReactNode>((content, mark) => wrapInMark(mark, content), run.text)}</>;
}

/** A block's text on one side: kept words as they are, added words in `<ins>`, removed in `<del>`. */
export function RedlineBlock({ block, words }: { block: DocumentBlock; words: RedlineWords[] }) {
  return (
    <div {...hooks.slot('block', { type: block.type, level: block.level })}>
      {words.map(({ change, runs }, index) => {
        const text = runs.map((run, at) => <MarkedText key={at} run={run} />);
        if (change === 'equal') return <span key={index}>{text}</span>;
        const Element = change === 'added' ? 'ins' : 'del';
        return (
          <Element key={index} {...hooks.slot('word', { change })}>
            {text}
          </Element>
        );
      })}
    </div>
  );
}

/** The counts of changed blocks and the buttons that move between changes. */
export function RedlineCompareHeader(props: {
  counts: BlockChangeCounts;
  canMove: { previous: boolean; next: boolean };
  onMove: (step: 1 | -1) => void;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('header')}>
      <p {...hooks.slot('summary')}>{strings.redlineSummary(props.counts)}</p>
      <ChangeNavigation
        hooks={hooks}
        previous={{
          label: strings.redlinePreviousChange,
          isDisabled: !props.canMove.previous,
          onPress: () => props.onMove(-1),
        }}
        next={{
          label: strings.redlineNextChange,
          isDisabled: !props.canMove.next,
          onPress: () => props.onMove(1),
        }}
      />
    </div>
  );
}

/** The labels over the two columns of a split compare, which the cells' content already conveys. */
export function RedlineCompareColumns({ labels }: { labels: { old: string; new: string } }) {
  return (
    <div {...hooks.slot('columns')} aria-hidden="true">
      <span {...hooks.slot('column-label', { side: 'old' })}>{labels.old}</span>
      <span {...hooks.slot('column-label', { side: 'new' })}>{labels.new}</span>
    </div>
  );
}

const markerGlyphs = {
  changed: EditGlyph,
  added: PlusGlyph,
  removed: MinusGlyph,
  moved: MoveGlyph,
} as const;

/** The row's change glyph and its spoken description, which also describes its buttons. */
export function RedlineMarker(props: {
  change: keyof typeof markerGlyphs | 'unchanged';
  label: string;
  labelId: string;
}) {
  return (
    <span {...hooks.slot('marker', { change: props.change })}>
      {props.change === 'unchanged' ? null : <Glyph icon={markerGlyphs[props.change]} />}
      <VisuallyHidden elementType="span" id={props.labelId}>
        {props.label}
      </VisuallyHidden>
    </span>
  );
}
