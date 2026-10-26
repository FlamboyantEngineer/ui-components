import type { Key } from '../../core/props.js';
import { type TimelineItemChange, type TimelineScale } from './timeline-geometry.js';
import type { ItemPredecessors, PlacedItem } from './timeline-layout.js';
export interface TimelineItemSelection {
    isSelectable: boolean;
    isSelected: boolean;
    onToggle: (id: Key) => void;
}
export interface TimelineItemButtonProps {
    placed: PlacedItem;
    predecessors: ItemPredecessors | undefined;
    scale: TimelineScale;
    dayWidth: number;
    isEditable: boolean;
    selection: TimelineItemSelection;
    onDraft: (change: TimelineItemChange | null) => void;
    onCommit: (change: TimelineItemChange) => void;
}
/**
 * A bar or milestone: a button named by the item's label and described by its days, which moves by
 * pointer drag and arrow keys and, for a bar, resizes from its handles and with Shift and arrows.
 */
export declare function TimelineItemButton({ placed, predecessors, scale, dayWidth, isEditable, selection, onDraft, onCommit, }: TimelineItemButtonProps): import("react").JSX.Element;
//# sourceMappingURL=timeline-item.d.ts.map