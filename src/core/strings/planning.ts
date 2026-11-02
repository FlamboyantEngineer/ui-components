import { defineStrings } from '../message-format.js';
/** Strings of boards and calendar views. */
export interface PlanningStrings {
  /** The command that adds a card to a board column. */
  addCard: string;
  /** Fills a board cell that holds no card. */
  noCards: string;
  /** A board column's or lane's card count, with the column's limit when it has one. */
  cardCount: (count: number, limit?: number) => string;
  /** A board column's visible count against its limit, such as `3/5`. */
  cardCountOfLimit: (count: number, limit: number) => string;
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
  /** Names a calendar event's context menu, by the event's title. */
  eventActions: (title: string) => string;
  /** Titles the dialog that edits a calendar event. */
  editEvent: string;
  /** Labels the title field of the calendar event editor. */
  eventTitle: string;
  /** Labels the start and end field of the calendar event editor. */
  eventWhen: string;
  /** Names the edge that changes a calendar event's start, by the event's title. */
  changeEventStart: (title: string) => string;
  /** Names the edge that changes a calendar event's end, by the event's title. */
  changeEventEnd: (title: string) => string;
}

/** Whether a count is over its limit, within it, or has none. */
function getLimitState(count: number, limit: number | undefined) {
  if (limit === undefined) return 'none';
  return count > limit ? 'over' : 'within';
}

/** The module's text, with the message values each text function reads its arguments as. */
export const planningStrings = defineStrings<PlanningStrings>({
  cardCount: (count, limit) => ({ count, limit, state: getLimitState(count, limit) }),
  cardCountOfLimit: (count, limit) => ({ count, limit }),
  moveColumn: (column) => ({ column }),
  previousRange: (unit) => ({ unit }),
  nextRange: (unit) => ({ unit }),
  moreEvents: (count) => ({ count }),
  calendarEvent: (title, when) => ({ title, when }),
  eventActions: (title) => ({ title }),
  changeEventStart: (title) => ({ title }),
  changeEventEnd: (title) => ({ title }),
});
