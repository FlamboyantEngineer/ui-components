import { type RefObject } from 'react';
/** What the platform draws, as far as a canvas can tell. */
export interface EmojiSupport {
    /** The newest Emoji version the platform draws, or `undefined` when it cannot tell. */
    version: number | undefined;
    /** Whether it draws country flags rather than their letters. */
    countryFlags: boolean;
}
/** What the platform draws in a font, measured once per font family on a canvas. */
export declare function detectEmojiSupport(fontFamily: string): EmojiSupport;
/**
 * What the platform draws in the font of the element in `ref`, measured before the first paint, or
 * `null` until then. Without `isEnabled` nothing is measured and nothing is left out.
 */
export declare function useEmojiSupport(ref: RefObject<HTMLElement | null>, isEnabled: boolean): EmojiSupport | null;
//# sourceMappingURL=emoji-support.d.ts.map