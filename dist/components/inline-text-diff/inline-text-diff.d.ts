import type { BaseProps } from '../../core/props.js';
import type { InlineTextDiffSegment } from './text-diff.js';
export { createInlineWordDiff } from './text-diff.js';
export type { InlineTextDiffSegment } from './text-diff.js';
export interface InlineTextDiffProps extends BaseProps {
    /** Runs in reading order, from `createInlineTextDiffExcerpt` or `createInlineWordDiff`. */
    segments: readonly InlineTextDiffSegment[];
}
/** A change to a text value, inline: unchanged context, the removed run and the added run. */
export declare function InlineTextDiff({ segments, className, ...rest }: InlineTextDiffProps): import("react").JSX.Element;
//# sourceMappingURL=inline-text-diff.d.ts.map