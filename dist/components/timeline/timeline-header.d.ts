import { type TimelineAxis, type TimelineScale } from './timeline-geometry.js';
export interface TimelineHeaderProps {
    axis: TimelineAxis;
    scale: TimelineScale;
}
/**
 * The time scale above the rows, pinned to the top of the viewport while the rows scroll: a row of
 * the larger unit (months or years) over a row of the scale's unit.
 */
export declare function TimelineHeader({ axis, scale }: TimelineHeaderProps): import("react").JSX.Element;
//# sourceMappingURL=timeline-header.d.ts.map