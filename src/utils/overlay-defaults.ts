// The distances and delays the library's overlays share, in pixels and milliseconds. Specs cite
// these names; change a value here and every overlay that uses it follows.

/** Space kept between an overlay and the boundary edges (React Aria's `containerPadding`). */
export const DEFAULT_OVERLAY_GUTTER = 8;
/** Space between an anchor and an overlay the library positions itself, such as a toolbar. */
export const DEFAULT_OVERLAY_GAP = 6;
/** How far a submenu the library positions itself overlaps its parent menu. */
export const DEFAULT_SUBMENU_OVERLAP = 6;

/** Space between a field or trigger and its dropdown list, menu or panel. */
export const DEFAULT_DROPDOWN_OFFSET = 4;
/** Space between a point, a caret or a compact inline control and the list it opens. */
export const DEFAULT_POINT_OFFSET = 2;
/** How far a submenu moves toward its parent menu, overlapping its edge. */
export const SUBMENU_OFFSET = -2;
/** How far a submenu moves along its parent menu, aligning its first item with the parent item. */
export const SUBMENU_CROSS_OFFSET = -4;
/** Space between a trigger and its tooltip; the reference arrow is drawn in this gap. */
export const TOOLTIP_OFFSET = 8;
/** Space between a trigger and its popover dialog. */
export const POPOVER_OFFSET = 8;
/** Space between a trigger and a popover dialog with an arrow, which the arrow spans. */
export const POPOVER_ARROW_OFFSET = 7;

/** The hover delay before a tooltip opens. */
export const TOOLTIP_DELAY = 500;
/** How long the pointer or focus rests on a trigger before its hover card opens. */
export const HOVER_CARD_DELAY = 600;
/** How long after the pointer and focus leave a hover card and its trigger before it closes. */
export const HOVER_CARD_CLOSE_DELAY = 200;
/** How long a touch must be held to count as a long press, such as to open a context menu. */
export const LONG_PRESS_DELAY = 500;
