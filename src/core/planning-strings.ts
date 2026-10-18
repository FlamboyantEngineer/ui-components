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

const cardsText = (count: number) => (count === 1 ? '1 card' : `${count} cards`);

export const planningStrings: PlanningStrings = {
  addCard: 'Add card',
  noCards: 'No cards',
  cardCount: (count, limit) => {
    if (limit === undefined) return cardsText(count);
    if (count > limit) return `${cardsText(count)}, over the limit of ${limit}`;
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
