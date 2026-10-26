import { type TruncationTooltipProps } from '../truncation-tooltip/truncation-tooltip.js';
/** The truncation tooltip's expandable text, which a path does not offer. */
type TooltipExpansionProps = 'expandable' | 'isExpanded' | 'defaultExpanded' | 'onExpandedChange';
export interface PathProps extends Omit<TruncationTooltipProps, 'children' | 'placement' | 'delay' | TooltipExpansionProps> {
    /** A `/`-separated string (rooted when it starts with `/`) or a list of labels kept whole. */
    path: string | readonly string[];
}
/**
 * One line of location text that a stylesheet truncates from the start, keeping the end visible,
 * and that shows the whole path in a tooltip while it is cut.
 */
export declare function Path({ path, className, ...rest }: PathProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=path.d.ts.map