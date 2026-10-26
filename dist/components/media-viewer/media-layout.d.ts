export interface MediaSize {
    width: number;
    height: number;
}
export interface MediaLayoutInput {
    /** The image's own size, in pixels. */
    natural: MediaSize;
    /** The space the stage offers, in pixels. */
    stage: MediaSize;
    /** In percent of the fitted size. */
    zoom: number;
    /** Clockwise, in degrees: a multiple of 90. */
    rotation: number;
}
export interface MediaLayout {
    /** The image element's size before it turns. */
    image: MediaSize;
    /** The box the turned image fills, which the stage scrolls when it is larger. */
    canvas: MediaSize;
}
/**
 * The image and canvas sizes: at 100% the turned image fits inside the stage, never larger than
 * its own size; the zoom scales that fit.
 */
export declare function layoutMedia({ natural, stage, zoom, rotation }: MediaLayoutInput): MediaLayout;
/** What a key press asks of a media viewer, if anything. */
export type MediaKeyCommand = 'previous' | 'next' | 'zoom-in' | 'zoom-out';
/**
 * The command of a key press: Page Up and Page Down move to the previous or next item, and so do the
 * arrow keys (mirrored right to left) unless `isPanning`, when they scroll a zoomed image instead;
 * `+` and `-` zoom. Presses with a modifier, or inside an element that uses keys itself, ask nothing.
 */
export declare function resolveMediaKey(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'target'>, direction: 'ltr' | 'rtl', isPanning?: boolean): MediaKeyCommand | null;
//# sourceMappingURL=media-layout.d.ts.map