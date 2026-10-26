import type { ComparedBlockRow } from '../../utils/compare-blocks.js';
/** A decision on one change. */
export type RedlineDecision = 'accepted' | 'rejected';
export interface RedlineRowProps {
    row: ComparedBlockRow;
    /** The row element's id. */
    rowId: string;
    isSplit: boolean;
    isCurrent: boolean;
    decision: RedlineDecision | undefined;
    /** Decides the change; without it the row draws no decision buttons. */
    onResolve: ((decision: RedlineDecision) => void) | undefined;
    /** Moves to a moved block's other position. */
    onJump: () => void;
}
/**
 * One aligned row: its change marker and spoken description, one cell inline or the old and new
 * cells side by side, its notes and, for a change, the accept and reject buttons.
 */
export declare function RedlineRow({ row, rowId, isSplit, isCurrent, decision, onResolve, onJump, }: RedlineRowProps): import("react").JSX.Element;
//# sourceMappingURL=redline-row.d.ts.map