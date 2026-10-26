import type { BaseProps, NativeProps } from '../../core/props.js';
/** Width to height, landscape then portrait: `16-9` is sixteen wide by nine tall. */
export type AspectRatioValue = '1-1' | '4-3' | '3-2' | '16-9' | '21-9' | '3-4' | '2-3' | '9-16';
export interface AspectRatioProps extends NativeProps<'div'>, BaseProps {
    /** Width to height of the box. Defaults to `1-1`. */
    ratio?: AspectRatioValue | undefined;
}
/** A box whose height the stylesheet derives from its width, for media and embedded frames. */
export declare function AspectRatio({ ratio, children, className, ...rest }: AspectRatioProps): import("react").JSX.Element;
//# sourceMappingURL=aspect-ratio.d.ts.map