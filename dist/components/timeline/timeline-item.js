import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useDateFormatter, useNumberFormatter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { resolveKeyboardChange, } from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';
import { useTimelineDrag } from './use-timeline-drag.js';
/** The item's progress as a share from 0 to 1, or `undefined` for none. */
function readProgress({ item, read }) {
    const { progress } = item;
    if (read.kind !== 'bar' || typeof progress !== 'number' || !Number.isFinite(progress)) {
        return undefined;
    }
    return clamp(progress, 0, 1);
}
/** The text that describes an item: its days, progress, predecessors and how to move it. */
function useItemDescription(placed, predecessors, isEditable) {
    const strings = useUiStrings();
    const days = useDateFormatter({ dateStyle: 'medium', timeZone: 'UTC' });
    const percent = useNumberFormatter({ style: 'percent' });
    const formatDay = (date) => days.format(new Date(date));
    const { read } = placed;
    const progress = readProgress(placed);
    const parts = [
        read.kind === 'milestone'
            ? strings.timelineMilestone(formatDay(read.start))
            : strings.timelineDates({ start: formatDay(read.start), end: formatDay(read.end) }),
        progress === undefined ? '' : strings.timelineProgress(percent.format(progress)),
        predecessors ? strings.timelineDependsOn(predecessors.names) : '',
        predecessors?.hasConflict ? strings.timelineConflict : '',
        isEditable ? strings.timelineKeyboardHint(read.kind) : '',
    ];
    return parts.filter(Boolean).join('. ');
}
/**
 * A bar or milestone: a button named by the item's label and described by its days, which moves by
 * pointer drag and arrow keys and, for a bar, resizes from its handles and with Shift and arrows.
 */
export function TimelineItemButton({ placed, predecessors, scale, dayWidth, isEditable, selection, onDraft, onCommit, }) {
    const descriptionId = useId();
    const { item, read, left, right } = placed;
    const description = useItemDescription(placed, predecessors, isEditable);
    const drag = useTimelineDrag({ read, dayWidth, isEditable, onDraft, onCommit });
    const progress = readProgress(placed);
    const isBar = read.kind === 'bar';
    const onKeyDown = (event) => {
        const change = isEditable ? resolveKeyboardChange(read, event, scale) : null;
        if (!change)
            return;
        event.preventDefault();
        if (change.start !== read.start || change.end !== read.end)
            onCommit(change);
    };
    return (_jsxs("button", { type: "button", ...hooks.slot('item', {
            kind: read.kind,
            tone: item.tone ?? 'neutral',
            selected: selection.isSelectable && selection.isSelected,
            dragging: drag.isDragging,
            readonly: !isEditable,
            conflict: predecessors?.hasConflict,
        }), style: {
            position: 'absolute',
            left,
            width: isBar ? right - left : undefined,
            touchAction: isEditable ? 'none' : undefined,
        }, "aria-label": item.label, "aria-describedby": descriptionId, "aria-pressed": selection.isSelectable ? selection.isSelected : undefined, onClick: () => {
            if (!drag.consumeDrag() && selection.isSelectable)
                selection.onToggle(item.id);
        }, onKeyDown: onKeyDown, ...drag.handlers, children: [progress === undefined ? null : (_jsx("span", { ...hooks.slot('progress'), style: { width: `${progress * 100}%` } })), _jsx("span", { ...hooks.slot('item-label'), children: item.label }), isBar && isEditable ? (_jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('handle', { edge: 'start' }) }), _jsx("span", { ...hooks.slot('handle', { edge: 'end' }) })] })) : null, _jsx("span", { id: descriptionId, hidden: true, children: description })] }));
}
//# sourceMappingURL=timeline-item.js.map