// The values of one change: old → new on one line (compact), or the old and the new value under
// their captions (detailed), drawn per value type.

import type { ReactNode } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import {
  createInlineWordDiff,
  InlineTextDiff,
  type InlineTextDiffSegment,
} from '../inline-text-diff/inline-text-diff.js';
import { compareLists, isBlankValue, type ListItemChange } from './list-changes.js';

/** How a change's values are compared and drawn. */
export type ChangeListValueType = 'text' | 'value' | 'list';

/** A property's value: a text, a list of texts, or nothing. */
export type ChangeListValue = string | readonly string[] | null | undefined;

export type ChangeListVariant = 'compact' | 'detailed';

/** Draws a plain value or a list item, such as a status in a badge. */
export type ChangeListValueRenderer = (value: string) => ReactNode;

interface ChangeValuesProps {
  type: ChangeListValueType;
  before: ChangeListValue;
  after: ChangeListValue;
  variant: ChangeListVariant;
  renderValue: ChangeListValueRenderer;
}

export const changeListHooks = createHooks('change-list', [
  'change',
  'text',
  'old',
  'new',
  'arrow',
  'items',
  'item',
  'side',
  'caption',
  'empty',
  'attribution',
]);

const hooks = changeListHooks;

const toText = (value: ChangeListValue) =>
  typeof value === 'string' ? value : (value ?? []).join(', ');
// A blank value is unset: an empty text is a list of none, not a list of one empty item.
const toList = (value: ChangeListValue) =>
  isBlankValue(value) ? [] : typeof value === 'string' ? [value] : [...(value ?? [])];

function ListItems({
  items,
  renderValue,
}: {
  items: ListItemChange[];
  renderValue: ChangeListValueRenderer;
}) {
  return (
    <ul {...hooks.slot('items')}>
      {items.map(({ value, change }, index) => {
        const content = renderValue(value);
        return (
          <li key={`${change}:${value}:${index}`} {...hooks.slot('item', { change })}>
            {change === 'added' ? <ins>{content}</ins> : null}
            {change === 'removed' ? <del>{content}</del> : null}
            {change === 'unchanged' ? content : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Old → new on one line: the word diff of a text, the changed items of a list, or both values. */
function CompactValues({ type, before, after, renderValue }: ChangeValuesProps) {
  const strings = useUiStrings();
  if (type === 'text') {
    const segments = createInlineWordDiff(toText(before), toText(after));
    return <InlineTextDiff segments={segments} className={hooks.slotClass('text')} />;
  }
  if (type === 'list') {
    const { before: old, after: next } = compareLists(toList(before), toList(after));
    const moved = [...old, ...next].filter((item) => item.change !== 'unchanged');
    return <ListItems items={moved} renderValue={renderValue} />;
  }
  const hasBoth = !isBlankValue(before) && !isBlankValue(after);
  return (
    <>
      {isBlankValue(before) ? null : (
        <del {...hooks.slot('old')}>{renderValue(toText(before))}</del>
      )}
      {hasBoth ? (
        <>
          <span {...hooks.slot('arrow')} aria-hidden="true">
            {' → '}
          </span>
          <VisuallyHidden> {strings.changedTo} </VisuallyHidden>
        </>
      ) : null}
      {isBlankValue(after) ? null : <ins {...hooks.slot('new')}>{renderValue(toText(after))}</ins>}
    </>
  );
}

/** One side of a detailed change: its caption, then its value or the empty placeholder. */
function Side({ side, children }: { side: 'before' | 'after'; children: ReactNode }) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('side', { side })}>
      <span {...hooks.slot('caption')}>
        {side === 'before' ? strings.valueBefore : strings.valueAfter}
      </span>{' '}
      {children ?? <span {...hooks.slot('empty')}>{strings.emptyValue}</span>}
    </div>
  );
}

const keepOut = (kind: InlineTextDiffSegment['kind']) => (segment: InlineTextDiffSegment) =>
  segment.kind !== kind;

/** The old and the new value of a detailed change, each drawn with what changed on its side. */
function DetailedValues({ type, before, after, renderValue }: ChangeValuesProps) {
  let old: ReactNode = null;
  let next: ReactNode = null;
  if (type === 'text') {
    const segments = createInlineWordDiff(toText(before), toText(after));
    const className = hooks.slotClass('text');
    if (!isBlankValue(before))
      old = <InlineTextDiff segments={segments.filter(keepOut('added'))} className={className} />;
    if (!isBlankValue(after))
      next = (
        <InlineTextDiff segments={segments.filter(keepOut('removed'))} className={className} />
      );
  } else if (type === 'list') {
    const lists = compareLists(toList(before), toList(after));
    if (lists.before.length > 0) old = <ListItems items={lists.before} renderValue={renderValue} />;
    if (lists.after.length > 0) next = <ListItems items={lists.after} renderValue={renderValue} />;
  } else {
    if (!isBlankValue(before))
      old = <del {...hooks.slot('old')}>{renderValue(toText(before))}</del>;
    if (!isBlankValue(after)) next = <ins {...hooks.slot('new')}>{renderValue(toText(after))}</ins>;
  }
  return (
    <>
      <Side side="before">{old}</Side>
      <Side side="after">{next}</Side>
    </>
  );
}

/** A change's values in the variant's arrangement. */
export function ChangeValues(props: ChangeValuesProps) {
  return props.variant === 'compact' ? <CompactValues {...props} /> : <DetailedValues {...props} />;
}
