/** Strings of boards and calendar views. */
export interface PlanningStrings {
    /** The command that adds a card to a board column. */
    addCard: string;
    /** Fills a board cell that holds no card. */
    noCards: string;
    /** A board column's or lane's card count, with the column's limit when it has one. */
    cardCount: (count: number, limit?: number) => string;
    /** Names the handle that moves a board column, by the column's title. */
    moveColumn: (column: string) => string;
    /** The month view of a calendar. */
    month: string;
    /** The week view of a calendar. */
    week: string;
    /** Names the choice between a calendar's views. */
    calendarViews: string;
    /** Goes back one month or one week. */
    previousRange: (unit: 'month' | 'week') => string;
    /** Goes forward one month or one week. */
    nextRange: (unit: 'month' | 'week') => string;
    /** Marks the events that last whole days. */
    allDay: string;
    /** Opens the events of a day that do not fit in its cell, by their count. */
    moreEvents: (count: number) => string;
    /** Names a calendar event by its title and when it happens. */
    calendarEvent: (title: string, when: string) => string;
}
export declare const planningStrings: PlanningStrings;
//# sourceMappingURL=planning-strings.d.ts.map