import { type ReactNode, type RefObject } from 'react';
import { type MediaViewerItem } from './media-viewer-parts.js';
export interface MediaStageProps {
    item: MediaViewerItem;
    zoom: number;
    rotation: number;
    /** The scrolling viewport, which takes focus when the viewer opens. */
    viewportRef: RefObject<HTMLDivElement | null>;
    /** Moves to the previous item; `undefined` at the first. */
    onPrevious: (() => void) | undefined;
    /** Moves to the next item; `undefined` at the last. */
    onNext: (() => void) | undefined;
    /** Several items: the stage shows the previous and next buttons. */
    hasSiblings: boolean;
    renderItem: ((item: MediaViewerItem) => ReactNode) | undefined;
}
/**
 * The stage: the previous button, the viewport with the image (or the caller's rendering of another
 * file, or a fallback) and the next button.
 */
export declare function MediaStage(props: MediaStageProps): import("react").JSX.Element;
//# sourceMappingURL=media-stage.d.ts.map