import { type ReactNode, type Ref } from 'react';
import type { BaseProps } from '../../core/props.js';
export interface DashboardTileProps extends BaseProps {
    /** Names the tile and its handles, such as the title of the card it holds. */
    label: string;
    /** The tile's content. */
    children?: ReactNode;
    /** The fewest columns a resize leaves the tile. Defaults to 1. */
    minColumnSpan?: number | undefined;
    /** The fewest rows a resize leaves the tile. Defaults to 1. */
    minRowSpan?: number | undefined;
    /** The tile element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * One tile of a `DashboardGrid`: a named group placed on the grid's cells from its layout item.
 * In edit mode it shows a move handle before its content and a resize handle after it.
 */
export declare function DashboardTile({ label, children, minColumnSpan, minRowSpan, className, ...rest }: DashboardTileProps): import("react").JSX.Element;
//# sourceMappingURL=dashboard-tile.d.ts.map