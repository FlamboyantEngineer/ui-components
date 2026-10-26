import { type ReactNode, type Ref } from 'react';
import type { GlyphName } from '../../core/glyphs.js';
import type { BaseProps, NativeProps, Tone } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
export type BannerTone = Tone;
export interface BannerProps extends BaseProps, Pick<NativeProps<'div'>, 'hidden' | 'aria-label'> {
    /** The message's tone; it also chooses the announcement. Defaults to `neutral`. */
    tone?: BannerTone | undefined;
    /** A short summary before the description. */
    title?: ReactNode;
    /** The message itself: text or rich content. */
    description?: ReactNode;
    /** Controls for the reader's next step, after the message. */
    actions?: ReactNode;
    /** A built-in glyph name or icon node. Omit for the tone's glyph; `null` draws none. */
    icon?: IconSource;
    /** Draws a dismiss button that calls this once per activation. */
    onDismiss?: (() => void) | undefined;
    /** Names the dismiss button. Defaults to the provider's `dismiss` string. */
    dismissLabel?: string | undefined;
    /** Work is in progress: a decorative spinner replaces the glyph and the region is busy. */
    isPending?: boolean | undefined;
    /** The banner has just appeared; publishes `data-entering` for an enter animation. */
    isEntering?: boolean | undefined;
    /** The banner is on its way out; publishes `data-exiting` for an exit transition. */
    isExiting?: boolean | undefined;
    /** Render as phrasing content (`<span>`s) for a message set inside running text. */
    inline?: boolean | undefined;
    /** Move focus to the banner when it first renders, so keyboard users land on a critical message. */
    autoFocus?: boolean | undefined;
    /** The root element, for example for `useEnterExit`. */
    ref?: Ref<HTMLElement> | undefined;
}
/** The built-in glyph that introduces a message of `tone`; none for `neutral`. */
export declare function getToneGlyph(tone: Tone): GlyphName | null;
/**
 * An inline message about the state of a surface, with optional actions and dismissal.
 * Danger banners are assertive alerts; every other tone is a polite status.
 */
export declare function Banner({ tone, title, description, actions, icon, onDismiss, dismissLabel, isPending, isEntering, isExiting, inline, autoFocus, className, ref, ...rest }: BannerProps): import("react").JSX.Element;
//# sourceMappingURL=banner.d.ts.map