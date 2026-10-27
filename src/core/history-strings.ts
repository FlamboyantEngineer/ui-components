import type { MessageArguments } from './message-format.js';
/** Strings of activity feeds, change lists and version histories. */
export interface HistoryStrings {
  /** Default accessible name of an activity feed. */
  activity: string;
  /** What an activity feed with no entries shows. */
  noActivity: string;
  /** What a change list with no changes shows. */
  noChanges: string;
  /** Read between a change's old and new values, in place of the arrow drawn between them. */
  changedTo: string;
  /** Captions a change's old value. */
  valueBefore: string;
  /** Captions a change's new value. */
  valueAfter: string;
  /** Stands in for a value that was not set. */
  emptyValue: string;
  /** Default accessible name of a version history. */
  versionHistory: string;
  /** Marks the current version in a version history. */
  currentVersion: string;
  /** Compares the two selected versions. */
  compareVersions: string;
  /** The filter that keeps only the versions that have a name. */
  namedVersionsOnly: string;
  /** The filter that keeps one person's versions, from the person's name; `null` keeps everyone's. */
  versionsBy: (name: string | null) => string;
  /** The person filter's choice that keeps every person's versions. */
  anyone: string;
  /** Names a version's menu of actions, from the version's name. */
  versionActions: (name: string) => string;
  /** Asks to bring an earlier version back as the current one. */
  restoreVersion: string;
  /** Titles the confirmation of a restore, from the version's name. */
  restoreVersionTitle: (name: string) => string;
  /** Says what restoring a version does. */
  restoreVersionMessage: string;
  /** Confirms a restore. */
  restore: string;
  /** Gives a version without a name its first name. */
  nameVersion: string;
  /** Changes the name of a named version. */
  renameVersion: string;
  /** Names the field that names a version. */
  versionName: string;
  /** What a version history with no versions shows. */
  noVersions: string;
  /** What a version history shows when its filters leave no version. */
  noMatchingVersions: string;
}

/** The message values each text function reads its arguments as. */
export const historyArguments: MessageArguments<HistoryStrings> = {
  versionsBy: (name) => ({ name, hasName: name !== null }),
  versionActions: (name) => ({ name }),
  restoreVersionTitle: (name) => ({ name }),
};
