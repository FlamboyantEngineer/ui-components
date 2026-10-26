import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type MergeViewResult } from './use-merge-state.js';
export type { MergeResolution } from './merge-blocks.js';
export type { MergeViewResult } from './use-merge-state.js';
export interface MergeViewProps extends BaseProps, AriaLabellingProps {
    /** The common ancestor both sides changed. */
    base: string;
    /** Our side's text. */
    ours: string;
    /** Their side's text. */
    theirs: string;
    /** Our side's title, also on its take action. Defaults to the provider's `mergeViewOurs`. */
    oursLabel?: string | undefined;
    /** The base's title. Defaults to the provider's `mergeViewBase`. */
    baseLabel?: string | undefined;
    /** Their side's title. Defaults to the provider's `mergeViewTheirs`. */
    theirsLabel?: string | undefined;
    /** Draws the base between the two sides. Defaults to true. */
    showBase?: boolean | undefined;
    /** Called with the result after each take action or edit of a conflict's result. */
    onChange?: ((result: MergeViewResult) => void) | undefined;
}
/**
 * The three-way merge of two texts that changed a common base: our side, the base and their side
 * level with each other, and a result pane where clean changes are merged and each conflict offers
 * take actions and an editable result. A header counts the unresolved conflicts and moves between
 * them; the panes scroll together.
 */
export declare function MergeView({ base, ours, theirs, oursLabel, baseLabel, theirsLabel, showBase, onChange, className, ...rest }: MergeViewProps): import("react").JSX.Element;
//# sourceMappingURL=merge-view.d.ts.map