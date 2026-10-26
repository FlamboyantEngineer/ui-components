import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
/** `text` is a line of text, `rectangle` a block such as media, `circle` a round avatar. */
export type SkeletonShape = 'text' | 'rectangle' | 'circle';
export interface SkeletonProps extends BaseProps {
    /** The placeholder's shape. Defaults to `rectangle`. */
    shape?: SkeletonShape | undefined;
    /** Whether the content is loading. Defaults to `true`. */
    isLoading?: boolean | undefined;
    /** Whether the stylesheet may animate the placeholder while loading. Defaults to `true`. */
    animated?: boolean | undefined;
    /**
     * The real content. While loading it keeps its layout under the placeholder but is inert and
     * hidden from assistive technology; once loaded it shows. Without it, the skeleton is a block.
     */
    children?: ReactNode;
}
export interface SkeletonTextProps extends BaseProps, Pick<SkeletonProps, 'animated'> {
    /** The number of placeholder lines, at least one. Defaults to 3. */
    lines?: number | undefined;
}
/**
 * A placeholder for content that is loading. Without children it is a decorative block of `shape`;
 * around real content it is the loading region, drawing the placeholder in the content's place
 * until `isLoading` turns false, without remounting the content.
 */
export declare function Skeleton({ shape, isLoading, animated, children, className, ...rest }: SkeletonProps): import("react").JSX.Element;
/** A decorative placeholder for a paragraph: `lines` text skeletons. */
export declare function SkeletonText({ lines, animated, className, ...rest }: SkeletonTextProps): import("react").JSX.Element;
//# sourceMappingURL=skeleton.d.ts.map