import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type ComparedBlockRow, type DocumentBlock } from '../../utils/compare-blocks.js';
import { type RedlineDecision } from './redline-row.js';
export type { RedlineDecision } from './redline-row.js';
/** `inline` draws both documents in one column; `split` draws the old beside the new. */
export type RedlineCompareLayout = 'inline' | 'split';
/** A decision the reader took on one change, with the row it is about. */
export interface RedlineResolution<B extends DocumentBlock = DocumentBlock> {
    decision: RedlineDecision;
    /** The change: its key, its kind, both blocks where it has them and their indices. */
    row: ComparedBlockRow<B>;
}
export interface RedlineCompareProps<B extends DocumentBlock = DocumentBlock> extends BaseProps, AriaLabellingProps {
    /** The blocks of the document before the change. */
    oldBlocks: readonly B[];
    /** The blocks of the document after the change. */
    newBlocks: readonly B[];
    /** One column, or the two documents side by side. Defaults to `inline`. */
    layout?: RedlineCompareLayout | undefined;
    /** Heads the old column of a split compare. Defaults to the provider's `valueBefore` string. */
    oldLabel?: string | undefined;
    /** Heads the new column of a split compare. Defaults to the provider's `valueAfter` string. */
    newLabel?: string | undefined;
    /** The decisions taken so far by change key, controlled; without it the compare keeps them. */
    resolutions?: Readonly<Record<string, RedlineDecision>> | undefined;
    /** Called when the reader accepts or rejects a change. Without it no decision buttons draw. */
    onResolve?: ((resolution: RedlineResolution<B>) => void) | undefined;
}
/**
 * The block-level redline of two rich documents: blocks aligned by id or text, inserted and
 * deleted words inline, changed kinds and formatting noted, moved blocks linked between their two
 * positions, inline or side by side, with steps between changes and accept and reject buttons that
 * report each decision as plain data.
 */
export declare function RedlineCompare<B extends DocumentBlock>({ oldBlocks, newBlocks, layout, oldLabel, newLabel, resolutions, onResolve, className, ...rest }: RedlineCompareProps<B>): import("react").JSX.Element;
//# sourceMappingURL=redline-compare.d.ts.map