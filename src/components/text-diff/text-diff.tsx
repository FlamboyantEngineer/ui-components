import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { useStateFor } from '../../utils/use-state-for.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useSyncedScroll, type ScrollAnchor } from '../../utils/use-synced-scroll.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  countChanges,
  createDiffBlocks,
  createSplitRows,
  createUnifiedRows,
  type DiffBlock,
  type FoldOptions,
  type FoldRow,
  type TextDiffLine,
} from './diff-rows.js';
import { ChangeNavigation } from './change-navigation.js';
import { textDiffHooks as hooks } from './text-diff-hooks.js';
import {
  SplitTable,
  UnifiedTable,
  getChangeRowId,
  getRowId,
  type TableOptions,
} from './text-diff-table.js';

export { ChangeNavigation } from './change-navigation.js';
export type { TextDiffChange, TextDiffLine } from './diff-rows.js';

/** `unified` draws both texts in one column; `split` draws the old text beside the new one. */
export type TextDiffLayout = 'unified' | 'split';

export interface TextDiffProps extends BaseProps, AriaLabellingProps {
  /** The text before the change. */
  oldText: string;
  /** The text after the change. */
  newText: string;
  /** One column, or the two texts side by side. Defaults to `unified`. */
  layout?: TextDiffLayout | undefined;
  /** Unchanged lines kept beside each change; longer unchanged runs fold. Defaults to 3. */
  context?: number | undefined;
  /** Draws content under a line, such as its comments; nothing when it returns nothing. */
  renderLineWidget?: ((line: TextDiffLine) => ReactNode) | undefined;
}

interface HeaderProps {
  added: number;
  removed: number;
  /** The previous and next changes to move to; out of range when there is none. */
  previous: number;
  next: number;
  changes: number;
  onMove: (change: number) => void;
}

interface BodyProps {
  blocks: readonly DiffBlock[];
  isSplit: boolean;
  fold: FoldOptions;
  options: TableOptions;
}

const noneExpanded: ReadonlySet<number> = new Set();

/** The rows of a split side, as anchors the other side aligns to: line, filler and fold rows. */
function readRowAnchors(container: HTMLElement): ScrollAnchor[] {
  const origin = container.getBoundingClientRect().top - container.scrollTop;
  const rows = container.querySelectorAll(
    `:scope > table > tbody > tr:not(.${hooks.slotClass('widget')})`,
  );
  return Array.from(rows, (row, index) => ({
    key: index,
    offset: row.getBoundingClientRect().top - origin,
  }));
}

function TextDiffHeader({ added, removed, previous, next, changes, onMove }: HeaderProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('header')}>
      <span {...hooks.slot('summary')}>
        <span aria-hidden="true" {...hooks.slot('count', { change: 'added' })}>
          +{added}
        </span>
        <span aria-hidden="true" {...hooks.slot('count', { change: 'removed' })}>
          −{removed}
        </span>
        <VisuallyHidden elementType="span">
          {strings.textDiffSummary(added, removed)}
        </VisuallyHidden>
      </span>
      <ChangeNavigation
        hooks={hooks}
        previous={{
          label: strings.textDiffPreviousChange,
          isDisabled: previous < 0,
          onPress: () => onMove(previous),
        }}
        next={{
          label: strings.textDiffNextChange,
          isDisabled: next >= changes,
          onPress: () => onMove(next),
        }}
      />
    </div>
  );
}

/** The scrolling lines: one pane, or two side by side that scroll together. */
function TextDiffBody({ blocks, isSplit, fold, options }: BodyProps) {
  const strings = useUiStrings();
  const [oldPane, setOldPane] = useState<HTMLElement | null>(null);
  const [newPane, setNewPane] = useState<HTMLElement | null>(null);
  useSyncedScroll([oldPane, newPane], { getAnchors: readRowAnchors, enabled: isSplit });
  const pane = { className: hooks.slotClass('pane'), role: 'group', tabIndex: 0 } as const;
  if (!isSplit) {
    return (
      <ScrollRegion {...pane} axis="both" data-side="both" aria-label={strings.textDiffLines}>
        <UnifiedTable rows={createUnifiedRows(blocks, fold)} options={options} />
      </ScrollRegion>
    );
  }
  const rows = createSplitRows(blocks, fold);
  return (
    <div {...hooks.slot('panes')}>
      <ScrollRegion
        {...pane}
        axis="both"
        data-side="old"
        aria-label={strings.valueBefore}
        ref={setOldPane}
      >
        <SplitTable rows={rows} side="old" options={options} />
      </ScrollRegion>
      <ScrollRegion
        {...pane}
        axis="both"
        data-side="new"
        aria-label={strings.valueAfter}
        ref={setNewPane}
      >
        <SplitTable rows={rows} side="new" options={options} />
      </ScrollRegion>
    </div>
  );
}

/**
 * The line diff of two texts, unified or split side by side, with word changes inside changed
 * lines, line numbers, unchanged runs folded behind buttons, widgets under lines, and a header
 * that counts the changes and moves between them.
 */
export function TextDiff({
  oldText,
  newText,
  layout = 'unified',
  context = 3,
  renderLineWidget,
  className,
  ...rest
}: TextDiffProps) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const blocks = useMemo(() => createDiffBlocks(oldText, newText), [oldText, newText]);
  // Opened folds and the current change belong to one pair of texts and start over with the next.
  const [expanded, setExpanded] = useStateFor(blocks, noneExpanded);
  const [current, setCurrent] = useStateFor<number | null>(blocks, null);
  const isSplit = layout === 'split';
  const counts = countChanges(blocks);
  const changeBlocks = blocks.filter((block) => block.kind === 'change');
  const previous = current === null ? -1 : current - 1;
  const next = current === null ? 0 : current + 1;

  const focusRow = (id: string) => rootRef.current?.ownerDocument.getElementById(id)?.focus();
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    focusRow(pendingFocus.current);
    pendingFocus.current = null;
  });
  const moveTo = (change: number) => {
    const block = changeBlocks[change];
    if (!block) return;
    setCurrent(change);
    focusRow(getChangeRowId(baseId, block, isSplit));
  };
  const onExpand = (fold: FoldRow) => {
    setExpanded(new Set(expanded).add(fold.block));
    pendingFocus.current = getRowId(baseId, isSplit ? 'new' : 'both', fold.firstKey);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const widget = `.${hooks.slotClass('widget')}`;
    if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target, widget)) {
      return;
    }
    if (event.key === 'n') moveTo(next);
    else if (event.key === 'p') moveTo(previous);
    else return;
    event.preventDefault();
  };

  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { layout } })}
      ref={rootRef}
      role="group"
      onKeyDown={onKeyDown}
    >
      <TextDiffHeader {...counts} previous={previous} next={next} onMove={moveTo} />
      <TextDiffBody
        blocks={blocks}
        isSplit={isSplit}
        fold={{ context, expanded }}
        options={{ baseId, current, renderLineWidget, onExpand }}
      />
    </div>
  );
}
