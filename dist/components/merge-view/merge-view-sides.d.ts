import { type ReactNode } from 'react';
import type { MergeBlock, MergeSide } from './merge-blocks.js';
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
/** A titled pane with a scrolling area, shared by the input sides and the result. */
export declare function MergePane({ side, label, paneRef, children }: MergeFrameProps): import("react").JSX.Element;
/**
 * One input side: a table of its lines, one body per chunk, padded with filler rows so every side
 * draws as many rows for a chunk and the sides stay level. Its props hold while the reader edits a
 * conflict's result, so typing redraws only the result pane.
 */
export declare const MergeSidePane: import("react").MemoExoticComponent<({ side, label, blocks, current, paneRef, }: MergeSidePaneProps) => import("react").JSX.Element>;
export {};
//# sourceMappingURL=merge-view-sides.d.ts.map