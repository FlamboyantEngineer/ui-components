export interface TourSpotlightProps {
    /** The element the step points at; without one the spotlight is an empty point at the centre. */
    target: Element | null;
    /** The spotlight element once rendered, which anchors the popover of a step without a target. */
    element: HTMLDivElement | null;
    /** Receives the spotlight element. */
    spotlightRef: (element: HTMLDivElement | null) => void;
}
/**
 * A decorative box over the step's target, fixed to its place in the viewport, that the host
 * stylesheet draws as a spotlight (for example a ring with a wide shadow dimming the page). It
 * never takes pointer events, so the target stays reachable in a non-modal tour.
 */
export declare function TourSpotlight({ target, spotlightRef, element }: TourSpotlightProps): import("react").JSX.Element;
//# sourceMappingURL=tour-spotlight.d.ts.map