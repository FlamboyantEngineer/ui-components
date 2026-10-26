export const timelineStrings = {
    timeline: 'Timeline',
    timelineDates: ({ start, end }) => `${start} to ${end}`,
    timelineMilestone: (date) => `Milestone on ${date}`,
    timelineProgress: (percent) => `${percent} complete`,
    timelineDependsOn: (names) => `Depends on ${names.join(', ')}`,
    timelineConflict: 'Starts before an item it depends on ends',
    timelineKeyboardHint: (kind) => kind === 'bar'
        ? 'Arrow keys move it; Shift and arrow keys change its end'
        : 'Arrow keys move it',
    timelineQuarter: (quarter) => `Q${quarter}`,
    timelineItemColumn: 'Item',
    timelineRowColumn: 'Row',
    timelineStartColumn: 'Start',
    timelineEndColumn: 'End',
    timelineProgressColumn: 'Progress',
};
//# sourceMappingURL=timeline-strings.js.map