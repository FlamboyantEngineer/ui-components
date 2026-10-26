import type { GlyphName } from '../../core/glyphs.js';
import type { BaseProps } from '../../core/props.js';
import { type ButtonProps } from '../button/button.js';
export interface ExpandToggleProps extends Pick<ButtonProps, 'isDisabled' | 'isPending' | 'pendingLabel' | 'excludeFromTabOrder' | 'aria-controls' | 'ref'>, BaseProps {
    /** Whether the controlled region is expanded (controlled). */
    isExpanded?: boolean | undefined;
    /** Initial expanded state (uncontrolled). */
    defaultExpanded?: boolean | undefined;
    /** Called with the requested expanded state when the toggle is pressed. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    /**
     * Whether there is anything to expand. Without it the toggle renders an empty, hidden box of the
     * same size, so labels beside it stay aligned. Defaults to `true`.
     */
    isExpandable?: boolean | undefined;
    /** A constant accessible name. Defaults to the provider's `expand` or `collapse` string, by state. */
    label?: string | undefined;
    /** Box size. Defaults to `sm`. */
    size?: ButtonProps['size'];
}
/** The chevron of a disclosure: down while expanded, else pointing to the inline end. */
export declare function useExpandGlyph(isExpanded: boolean): GlyphName;
/**
 * A chevron button that expands and collapses a row or region. It points to the inline end while
 * collapsed and down while expanded, and its presses never reach the row around it. Inside a React
 * Aria `Disclosure` it is the disclosure's trigger, wired to its panel.
 */
export declare function ExpandToggle({ isExpanded, defaultExpanded, onExpandedChange, isExpandable, label, size, className, ...rest }: ExpandToggleProps): import("react").JSX.Element;
//# sourceMappingURL=expand-toggle.d.ts.map