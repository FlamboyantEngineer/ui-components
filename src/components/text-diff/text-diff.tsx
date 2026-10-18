import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useSyncedScroll, type ScrollAnchor } from '../../utils/use-synced-scroll.js';
import { IconButton } from '../icon-button/icon-button.js';
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
import { textDiffHooks as hooks } from './text-diff-hooks.js';
import {
  SplitTable,
  UnifiedTable,
  getChangeRowId,
  getRowId,
  type TableOptions,
} from './text-diff-table.js';

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

/** State that belongs to one pair of texts and starts over when they change. */
interface DiffState<T> {
  blocks: readonly DiffBlock[];
  value: T;
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

/** Whether a key press belongs to a line widget or a text input rather than to the diff. */
function isWithinEditableContent(target: EventTarget): boolean {
  const element = target as Element;
  return Boolean(
    element.closest?.(`.${hooks.slotClass('widget')}, input, textarea, select, [contenteditable]`),
  );
}

/** State for the current pair of texts: the value set for them, or the initial one. */
function useDiffState<T>(blocks: readonly DiffBlock[], initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<DiffState<T>>({ blocks, value: initial });
  return [state.blocks === blocks ? state.value : initial, (value) => setState({ blocks, value })];
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
      <span {...hooks.slot('navigation')}>
        <IconButton
          icon="chevron-up"
          size="sm"
          label={strings.textDiffPreviousChange}
          className={hooks.slotClass('previous')}
          isDisabled={previous < 0}
          onPress={() => onMove(previous)}
        />
        <IconButton
          icon="chevron-down"
          size="sm"
          label={strings.textDiffNextChange}
          className={hooks.slotClass('next')}
          isDisabled={next >= changes}
          onPress={() => onMove(next)}
        />
      </span>
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
  const [expanded, setExpanded] = useDiffState(blocks, noneExpanded);
  const [current, setCurrent] = useDiffState<number | null>(blocks, null);
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
    if (event.altKey || event.ctrlKey || event.metaKey || isWithinEditableContent(event.target)) {
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
