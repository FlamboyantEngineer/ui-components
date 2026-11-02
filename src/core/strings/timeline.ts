import { defineStrings } from '../message-format.js';
/** Strings of timelines: their default name, item descriptions, scale labels and table headings. */
export interface TimelineStrings {
  /** Default accessible name of a timeline. */
  timeline: string;
  /** Describes a bar's dates, from its formatted first and last days. */
  timelineDates: (dates: { start: string; end: string }) => string;
  /** Describes a milestone's date, from the formatted date. */
  timelineMilestone: (date: string) => string;
  /** Describes how far a bar has come, from a formatted percentage such as `40%`. */
  timelineProgress: (percent: string) => string;
  /** Names the items an item depends on. */
  timelineDependsOn: (names: readonly string[]) => string;
  /** Warns that an item starts before an item it depends on ends. */
  timelineConflict: string;
  /** Tells how to move a movable item by keyboard: bars also resize. */
  timelineKeyboardHint: (kind: 'bar' | 'milestone') => string;
  /** A quarter on the time scale, from its number (1 to 4). */
  timelineQuarter: (quarter: number) => string;
  /** Heads the table view's column of item names. */
  timelineItemColumn: string;
  /** Heads the table view's column of row names. */
  timelineRowColumn: string;
  /** Heads the table view's column of first days. */
  timelineStartColumn: string;
  /** Heads the table view's column of last days. */
  timelineEndColumn: string;
  /** Heads the table view's column of progress. */
  timelineProgressColumn: string;
  /** Names an item's context menu, from the item's name. */
  timelineItemActions: (item: string) => string;
  /** Titles the item editor, from the item's name. */
  timelineEditItem: (item: string) => string;
  /** Labels the item editor's name field. */
  timelineNameField: string;
  /** Labels the item editor's dates field, for a bar. */
  timelineDatesField: string;
  /** Labels the item editor's day field, for a milestone. */
  timelineDayField: string;
  /** Names the people an item is assigned to. */
  timelineAssignedTo: (names: readonly string[]) => string;
  /** Tells that an item is assigned to nobody. */
  timelineUnassigned: string;
  /** Heads the table view's column of assignees, and labels the item editor's assignees field. */
  timelineAssigneesColumn: string;
  /** Names the link to an item's own page, from the item's name. */
  timelineOpenItem: (item: string) => string;
  /** Heads the row list's duration column. */
  timelineDurationColumn: string;
  /** Heads the row list's dependencies column. */
  timelineDependenciesColumn: string;
  /** An item's length in days, counting both ends; 0 for a milestone. */
  timelineDuration: (days: number) => string;
  /** How many items a row holds, when it holds several. */
  timelineItemCount: (count: number) => string;
  /** Tells that an item depends on nothing. */
  timelineNone: string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const timelineStrings = defineStrings<TimelineStrings>({
  timelineDates: (dates) => ({ ...dates }),
  timelineMilestone: (date) => ({ date }),
  timelineProgress: (percent) => ({ percent }),
  timelineDependsOn: (names) => ({ names }),
  timelineKeyboardHint: (kind) => ({ kind }),
  timelineQuarter: (quarter) => ({ quarter }),
  timelineItemActions: (item) => ({ item }),
  timelineEditItem: (item) => ({ item }),
  timelineAssignedTo: (names) => ({ names }),
  timelineOpenItem: (item) => ({ item }),
  timelineDuration: (days) => ({ days }),
  timelineItemCount: (count) => ({ count }),
});
