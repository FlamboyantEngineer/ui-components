import { type ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
/** A region around the frame's main content that `AppFrameContent` can fill from anywhere below. */
export type AppFrameRegion = 'top-bar' | 'navigation' | 'start-panel' | 'end-panel' | 'bottom-panel' | 'status-bar';
/** A part of the band that `AppFrameBandContent` can fill from anywhere below the frame. */
export type AppFrameBandSlot = 'leading' | 'status' | 'tools' | 'actions';
/** The regions a frame names for assistive technology. */
export type AppFrameLabelledRegion = 'main' | 'start-panel' | 'end-panel' | 'bottom-panel';
export interface AppFrameProps extends BaseProps {
    /** The main content. */
    children?: ReactNode;
    /** The bar along the top, such as an `AppFrameBand`: the banner. */
    topBar?: ReactNode;
    /** The side navigation at the inline start, such as a `NavigationRail`. */
    navigation?: ReactNode;
    /** A panel between the navigation and the main content. */
    startPanel?: ReactNode;
    /** A panel at the inline end. */
    endPanel?: ReactNode;
    /** A panel below the main content. */
    bottomPanel?: ReactNode;
    /** The bar along the bottom, such as a `StatusBar`'s items: the content information. */
    statusBar?: ReactNode;
    /** Names for the main region and the panels, replacing the provider's panel names. */
    labels?: Partial<Record<AppFrameLabelledRegion, string>> | undefined;
    /**
     * The frame sits inside a page or another frame instead of being the page: its regions are
     * plain containers rather than landmarks, and the root is a group named by `label`.
     */
    isEmbedded?: boolean | undefined;
    /** Names an embedded frame. */
    label?: string | undefined;
}
export interface AppFrameContentProps {
    /** The region of the nearest `AppFrame` to fill. */
    region: AppFrameRegion;
    /** The content, which replaces the region's own while mounted. */
    children?: ReactNode;
}
/** The projection slot of a frame region or of a band slot, private to the frame's provider. */
export declare function toAppFrameSlot(name: string): string;
/**
 * The frame of an application: a top bar, side navigation, panels around the main content and a
 * status bar, each a landmark, with a skip link to the main content. Descendants fill its regions
 * through `AppFrameContent` and its band through `AppFrameBandContent`.
 */
export declare function AppFrame({ topBar, navigation, startPanel, endPanel, bottomPanel, statusBar, ...rest }: AppFrameProps): import("react").JSX.Element;
/**
 * Whether an `AppFrame` is above, so frame content projects into it. Without one, frame content
 * renders in place, even below a projection provider of the host's own.
 */
export declare function useIsInsideAppFrame(): boolean;
/**
 * Fills a region of the nearest `AppFrame` from anywhere below it, in place of the region's own.
 * Without a frame above, it renders its children in place.
 */
export declare function AppFrameContent({ region, children }: AppFrameContentProps): import("react").JSX.Element;
//# sourceMappingURL=app-frame.d.ts.map