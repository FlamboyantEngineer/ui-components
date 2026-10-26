const cardsText = (count) => (count === 1 ? '1 card' : `${count} cards`);
export const planningStrings = {
    addCard: 'Add card',
    noCards: 'No cards',
    cardCount: (count, limit) => {
        if (limit === undefined)
            return cardsText(count);
        if (count > limit)
            return `${cardsText(count)}, over the limit of ${limit}`;
        return `${cardsText(count)}, limit ${limit}`;
    },
    moveColumn: (column) => `Move column ${column}`,
    month: 'Month',
    week: 'Week',
    calendarViews: 'View',
    previousRange: (unit) => `Previous ${unit}`,
    nextRange: (unit) => `Next ${unit}`,
    allDay: 'All day',
    moreEvents: (count) => `+${count} more`,
    calendarEvent: (title, when) => `${title}, ${when}`,
};
//# sourceMappingURL=planning-strings.js.map