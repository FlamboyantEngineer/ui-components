import type { BaseProps, NativeProps } from '../../core/props.js';
import { type LayoutContainmentProps } from './layout.js';
export type ContentsProps = NativeProps<'div'> & BaseProps;
export type InlineContentsProps = NativeProps<'span'> & BaseProps;
export interface EmbeddedFrameProps extends Omit<NativeProps<'iframe'>, 'title'>, BaseProps, LayoutContainmentProps {
    /** The frame's accessible name. */
    title: string;
}
/**
 * A wrapper that adds no box of its own (`display: contents` in the stylesheet), for event capture,
 * portals and adapters. `hidden` removes its children from layout without unmounting them.
 */
export declare function Contents({ children, className, ...rest }: ContentsProps): import("react").JSX.Element;
/** The inline counterpart of `Contents`, valid inside phrasing content. */
export declare function InlineContents({ children, className, ...rest }: InlineContentsProps): import("react").JSX.Element;
/**
 * An `<iframe>` that fills its host like `View`. It is fully sandboxed unless the caller grants
 * permissions through `sandbox`.
 */
export declare function EmbeddedFrame({ className, sandbox, grow, fill, clip, ...rest }: EmbeddedFrameProps): import("react").JSX.Element;
//# sourceMappingURL=wrappers.d.ts.map