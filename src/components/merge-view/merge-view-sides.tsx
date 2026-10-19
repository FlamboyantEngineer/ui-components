import { useId, type ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type { MergeBlock, MergeLine, MergeSide } from './merge-blocks.js';
import { mergeViewHooks as hooks } from './merge-view-hooks.js';

export interface MergePaneProps {
  /** The pane's title, which names its scrolling area. */
  label: string;
  /** The conflict the reader moved to. */
  current: number | null;
  /** Receives the scrolling viewport, which scrolls with the other panes. */
  paneRef: (element: HTMLElement | null) => void;
}

interface MergeFrameProps extends Pick<MergePaneProps, 'label' | 'paneRef'> {
  side: MergeSide | 'result';
  children: ReactNode;
}

interface MergeSidePaneProps extends MergePaneProps {
  side: MergeSide;
  blocks: readonly MergeBlock[];
}

const markers = { unchanged: '', changed: '•', conflict: '!' } as const;

function LineRow({ line }: { line: MergeLine }) {
  const strings = useUiStrings();
  return (
    <tr {...hooks.slot('line', { change: line.change })}>
      <td {...hooks.slot('number')}>
        <span aria-hidden="true">{line.number}</span>
      </td>
      <td {...hooks.slot('marker')}>
        <span aria-hidden="true">{markers[line.change]}</span>
        <VisuallyHidden elementType="span">
          {strings.mergeViewLine(line.change, line.number)}
        </VisuallyHidden>
      </td>
      <td {...hooks.slot('content')}>{line.text}</td>
    </tr>
  );
}

/** A titled pane with a scrolling area, shared by the input sides and the result. */
export function MergePane({ side, label, paneRef, children }: MergeFrameProps) {
  const titleId = useId();
  return (
    <div {...hooks.slot('side', { side })}>
      <div id={titleId} {...hooks.slot('title')}>
        {label}
      </div>
      <ScrollRegion
        className={hooks.slotClass('pane')}
        axis="both"
        role="group"
        tabIndex={0}
        aria-labelledby={titleId}
        ref={paneRef}
      >
        {children}
      </ScrollRegion>
    </div>
  );
}

/**
 * One input side: a table of its lines, one body per chunk, padded with filler rows so every side
 * draws as many rows for a chunk and the sides stay level.
 */
export function MergeSidePane({ side, label, blocks, current, paneRef }: MergeSidePaneProps) {
  return (
    <MergePane side={side} label={label} paneRef={paneRef}>
      <table {...hooks.slot('table')}>
        {blocks.map((block) => (
          <tbody
            key={block.index}
            {...hooks.slot('chunk', {
              kind: block.chunk.kind,
              current: block.conflict !== null && block.conflict === current,
            })}
          >
            {Array.from({ length: block.rows }, (_, row) => {
              const line = block.lines[side][row];
              return line ? (
                <LineRow key={row} line={line} />
              ) : (
                <tr key={row} aria-hidden="true" {...hooks.slot('filler')}>
                  <td colSpan={3} />
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </MergePane>
  );
}
