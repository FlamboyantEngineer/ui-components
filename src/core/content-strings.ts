/**
 * Strings of the folder manager, code and JSON editors, emoji picker, PDF viewer, data tables,
 * timestamps, save status, record labels, outlines, state histories, comments and reactions.
 * timestamps, save status, record labels, state histories, notifications and approvals.
 */
export interface ContentStrings {
  newFolder: string;
  /** Names the field that names a new folder. */
  newFolderName: string;
  rename: string;
  /** Names the field that renames an item, from its current name. */
  renameItem: (name: string) => string;
  /** Why a folder takes no new folder: it is at the deepest level allowed. */
  folderDepthLimit: (depth: number) => string;
  /** Opens the list of places the selected items can move to. */
  moveTo: string;
  /** The top level of a tree, as a place items can move to. */
  topLevel: string;
  /** Names a code editor's list of completions. */
  suggestions: string;
  /** Names a find box. */
  find: string;
  /** Names a find bar's replacement box. */
  replaceWith: string;
  /** Replaces the current match. */
  replace: string;
  /** Replaces every match. */
  replaceAll: string;
  /** Rewrites a value, such as JSON text, with standard indentation. */
  /** Shows cut text whole, in place. */
  showMore: string;
  /** Cuts text that was shown whole again. */
  showLess: string;
  format: string;
  /** The message of text that is not valid JSON. */
  invalidJson: string;
  /** The message of text that is not valid JSON, with where the problem starts. */
  invalidJsonAt: (line: number, column: number) => string;
  /** A JSON value of a type its schema does not allow, given the allowed types. */
  jsonTypeMismatch: (types: readonly string[]) => string;
  /** A JSON value its schema does not list, given the allowed values as JSON. */
  jsonValueMismatch: (values: readonly string[]) => string;
  /** A JSON object without a property its schema requires. */
  jsonMissingProperty: (name: string) => string;
  /** A JSON property its schema does not allow. */
  jsonUnknownProperty: (name: string) => string;
  /** A JSON array with fewer items than its schema asks for. */
  jsonTooFewItems: (count: number) => string;
  /** A JSON array with more items than its schema allows. */
  jsonTooManyItems: (count: number) => string;
  /** A problem in JSON text, with where it is. */
  jsonProblemAt: (line: number, column: number, message: string) => string;
  emojiPicker: string;
  searchEmoji: string;
  emojiCategories: string;
  /** Name of an emoji category (`smileys`, `flags`, …), recently used (`recent`), custom emoji or search results. */
  emojiCategory: (category: string) => string;
  emojiLoadFailed: string;
  skinTone: string;
  /** Name of a skin tone (`default`, `light`, `medium-light`, …). */
  skinToneName: (tone: string) => string;
  /** Default name of a document view. */
  document: string;
  /** Name of the toolbar for a named view (`Report.pdf controls`). */
  controlsFor: (name: string) => string;
  fitWidth: string;
  fitPage: string;
  page: string;
  /** The total after a page field (`of 12`). */
  ofTotal: (total: number) => string;
  previousPage: string;
  nextPage: string;
  findInDocument: string;
  searching: string;
  previousMatch: string;
  nextMatch: string;
  /** How many matches a find found, while none is current (`12 matches`). */
  matchTotal: (total: number) => string;
  documentFailed: string;
  /** Names a document view's panel of page thumbnails and outline, and its toggle. */
  sidebar: string;
  /** Names a document's page thumbnails. */
  pages: string;
  /** Names a document's outline (its bookmarks or headings). */
  outline: string;
  /** Names the toggle that shows or hides the entries under an outline entry, from its label. */
  sectionsIn: (label: string) => string;
  /** Names one page of a document or a page navigation (`Page 3`). */
  pageNumber: (pageNumber: number) => string;
  rotateClockwise: string;
  rotateCounterclockwise: string;
  print: string;
  download: string;
  findOptions: string;
  highlightAll: string;
  matchCase: string;
  ignoreAccents: string;
  wholeWords: string;
  password: string;
  /** Asks for the password of a protected document. */
  passwordRequired: string;
  passwordIncorrect: string;
  /** Opens a protected document with the password typed. */
  openDocument: string;
  /** Default name of a page navigation. */
  pagination: string;
  /** Names the page navigation of a named view (`Fruit pagination`). */
  paginationOf: (name: string) => string;
  /** Opens the menu that shows and hides a table's columns. */
  columns: string;
  /** Names the text a column filter keeps rows containing. */
  contains: string;
  /** Names the lower bound of a range filter. */
  rangeFrom: string;
  /** Names the upper bound of a range filter. */
  rangeTo: string;
  /** Names a table's summary row. */
  summary: string;
  /** Describes a drawing of no values. */
  noData: string;
  /** Describes a series of values by its formatted lowest, highest and last values. */
  seriesSummary: (values: { low: string; high: string; last: string }) => string;
  /** Stands in for a timestamp that is missing or unreadable, mid-sentence. */
  unknownTime: string;
  /** Who did something and when, with `{time}` and `{person}` tokens. */
  attribution: string;
  /** An editor's save status (`Saving…`). */
  saveStatus: (phase: 'dirty' | 'saving' | 'saved' | 'error' | 'offline') => string;
  /** Stands in for a record the reader may not see, or that no longer exists. */
  recordUnavailable: (reason: 'restricted' | 'missing') => string;
  /** Default accessible name of a history of state changes. */
  stateHistory: string;
  /** Marks the state something is in now, in a history of states. */
  currentState: string;
  /** Marks a state not reached yet, in a history of states. */
  upcomingState: string;
  /** Default name of a comment thread. */
  commentThread: string;
  /** Names the menu of one comment's actions. */
  commentActions: string;
  /** Names the box that starts a comment thread. */
  addComment: string;
  /** Posts a new comment. */
  comment: string;
  /** Names the box that answers a thread, and posts the answer. */
  reply: string;
  /** Names the box that edits a comment. */
  editComment: string;
  /** Marks a comment changed after it was posted. */
  edited: string;
  resolve: string;
  reopen: string;
  /** Marks a thread whose discussion is closed. */
  resolved: string;
  /** Reveals the replies a long thread hides. */
  showMoreReplies: (count: number) => string;
  /** The title and message of the confirmation before a comment is deleted. */
  deleteComment: string;
  deleteCommentMessage: string;
  /** Default name of a row of reactions. */
  reactions: string;
  /** Opens the emoji picker that adds a reaction. */
  addReaction: string;
  /** Names a reaction from its emoji, its count and some of the people who reacted. */
  reactionLabel: (emoji: string, count: number, names: readonly string[]) => string;
  /** Names a notification list and the bell that opens it. */
  notifications: string;
  /** Names the notification bell with the unread count. */
  notificationsWithCount: (unread: number) => string;
  /** Names the choice between all and unread notifications. */
  notificationFilter: string;
  /** Shows every notification. */
  allNotifications: string;
  /** Marks an unread notification, and shows only those. */
  unread: string;
  markAllRead: string;
  markRead: string;
  markUnread: string;
  /** The title of an empty notification list. */
  noNotifications: string;
  /** The title of a notification list showing only unread ones, with none left. */
  noUnreadNotifications: string;
  /** Under the title of an empty notification list. */
  notificationsEmpty: string;
  /** Under the title of an unread notification list with none left. */
  unreadNotificationsEmpty: string;
  /** Announces notifications that arrived: one by its title, several by their count. */
  newNotifications: (count: number, title: string) => string;
  /** Groups items whose day is unknown. */
  earlier: string;
  /** Names an approval panel. */
  approvals: string;
  /** The approvals given against those required (`2 of 3 approvals`). */
  approvalProgress: (approved: number, required: number) => string;
  /** An approver's decision, or the outcome of all of them. */
  approvalDecision: (decision: 'pending' | 'approved' | 'rejected' | 'abstained') => string;
  /** Names the list of people and groups whose decision is asked. */
  approvers: string;
  /** Marks the reader among the approvers. */
  you: string;
  /** Reminds a pending approver of the request, by name. */
  remindApprover: (name: string) => string;
  /** Asks an approver who decided to decide again, by name. */
  requestApprovalAgain: (name: string) => string;
  /** Names the reader's own decision. */
  yourDecision: string;
  approve: string;
  reject: string;
  /** Submits a decision. */
  submitDecision: string;
  /** Titles the dialog that signs a decision. */
  signDecision: string;
  /** Shown when submitting a decision failed without a message of its own. */
  decisionFailed: string;
}

const emojiCategoryNames: Readonly<Record<string, string>> = {
  recent: 'Recently used',
  custom: 'Custom',
  search: 'Search results',
  smileys: 'Smileys & Emotion',
  people: 'People & Body',
  nature: 'Animals & Nature',
  food: 'Food & Drink',
  travel: 'Travel & Places',
  activities: 'Activities',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
};

/** `A`, `A and B`, `A, B and C`. */
function joinNames(names: readonly string[]): string {
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

function describeReaction(emoji: string, count: number, names: readonly string[]): string {
  if (names.length === 0) return `${emoji} ${count}`;
  const others = count - names.length;
  const more = others === 1 ? ['1 other'] : others > 1 ? [`${others} others`] : [];
  return `${emoji} ${count}, reacted by ${joinNames([...names, ...more])}`;
}

const saveStatusNames = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved',
  offline: 'Offline',
} as const;

const approvalDecisionNames = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  abstained: 'Abstained',
} as const;

export const contentStrings: ContentStrings = {
  newFolder: 'New folder',
  newFolderName: 'New folder name',
  rename: 'Rename',
  renameItem: (name) => `Rename ${name}`,
  folderDepthLimit: (depth) =>
    depth === 1 ? 'Folders cannot be nested.' : `Folders nest at most ${depth} levels deep.`,
  moveTo: 'Move to',
  topLevel: 'Top level',
  suggestions: 'Suggestions',
  find: 'Find',
  replaceWith: 'Replace with',
  replace: 'Replace',
  replaceAll: 'Replace all',
  showMore: 'Show more',
  showLess: 'Show less',
  format: 'Format',
  invalidJson: 'Enter valid JSON.',
  invalidJsonAt: (line, column) => `Enter valid JSON: check line ${line}, column ${column}.`,
  jsonTypeMismatch: (types) => `Expected ${types.join(' or ')}.`,
  jsonValueMismatch: (values) =>
    values.length === 1 ? `Expected ${values[0]}.` : `Expected one of ${values.join(', ')}.`,
  jsonMissingProperty: (name) => `Missing property "${name}".`,
  jsonUnknownProperty: (name) => `Property "${name}" is not allowed.`,
  jsonTooFewItems: (count) =>
    count === 1 ? 'Use at least 1 item.' : `Use at least ${count} items.`,
  jsonTooManyItems: (count) =>
    count === 1 ? 'Use 1 item or fewer.' : `Use ${count} items or fewer.`,
  jsonProblemAt: (line, column, message) => `Line ${line}, column ${column}: ${message}`,
  emojiPicker: 'Emoji picker',
  searchEmoji: 'Search emoji',
  emojiCategories: 'Emoji categories',
  emojiCategory: (category) => emojiCategoryNames[category] ?? category,
  emojiLoadFailed: 'Emoji could not be loaded.',
  skinTone: 'Skin tone',
  skinToneName: (tone) => `${tone.charAt(0).toUpperCase()}${tone.slice(1)}`,
  document: 'Document',
  controlsFor: (name) => `${name} controls`,
  fitWidth: 'Fit page width',
  fitPage: 'Fit whole page',
  page: 'Page',
  ofTotal: (total) => `of ${total}`,
  previousPage: 'Previous page',
  nextPage: 'Next page',
  findInDocument: 'Find in document',
  searching: 'Searching…',
  previousMatch: 'Previous match',
  nextMatch: 'Next match',
  matchTotal: (total) => (total === 1 ? '1 match' : `${total} matches`),
  documentFailed: 'The document could not be opened.',
  sidebar: 'Sidebar',
  pages: 'Pages',
  outline: 'Outline',
  sectionsIn: (label) => `Sections in ${label}`,
  pageNumber: (pageNumber) => `Page ${pageNumber}`,
  rotateClockwise: 'Rotate clockwise',
  rotateCounterclockwise: 'Rotate counterclockwise',
  print: 'Print',
  download: 'Download',
  findOptions: 'Find options',
  highlightAll: 'Highlight all',
  matchCase: 'Match case',
  ignoreAccents: 'Ignore accents',
  wholeWords: 'Whole words',
  password: 'Password',
  passwordRequired: 'This document is protected. Enter its password to open it.',
  passwordIncorrect: 'The password is incorrect. Try again.',
  openDocument: 'Open',
  pagination: 'Pagination',
  paginationOf: (name) => `${name} pagination`,
  columns: 'Columns',
  contains: 'Contains',
  rangeFrom: 'From',
  rangeTo: 'To',
  summary: 'Summary',
  noData: 'No data',
  seriesSummary: ({ low, high, last }) => `Low ${low}, high ${high}, last ${last}`,
  unknownTime: 'unknown time',
  attribution: '{time} by {person}',
  saveStatus: (phase) => saveStatusNames[phase],
  stateHistory: 'State history',
  currentState: 'Current',
  upcomingState: 'Upcoming',
  commentThread: 'Comment thread',
  commentActions: 'Comment actions',
  addComment: 'Add a comment',
  comment: 'Comment',
  reply: 'Reply',
  editComment: 'Edit comment',
  edited: 'Edited',
  resolve: 'Resolve',
  reopen: 'Reopen',
  resolved: 'Resolved',
  showMoreReplies: (count) => (count === 1 ? 'Show 1 more reply' : `Show ${count} more replies`),
  deleteComment: 'Delete comment',
  deleteCommentMessage: 'The comment will be removed from the thread.',
  reactions: 'Reactions',
  addReaction: 'Add reaction',
  reactionLabel: describeReaction,
  notifications: 'Notifications',
  notificationsWithCount: (unread) =>
    unread > 0 ? `Notifications, ${unread} unread` : 'Notifications',
  notificationFilter: 'Show',
  allNotifications: 'All',
  unread: 'Unread',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  markUnread: 'Mark as unread',
  noNotifications: 'No notifications',
  noUnreadNotifications: 'Nothing unread',
  notificationsEmpty: 'New notifications appear here.',
  unreadNotificationsEmpty: 'You are all caught up.',
  newNotifications: (count, title) =>
    count === 1 ? `New notification: ${title}` : `${count} new notifications`,
  earlier: 'Earlier',
  approvals: 'Approvals',
  approvalProgress: (approved, required) =>
    required === 1 ? `${approved} of 1 approval` : `${approved} of ${required} approvals`,
  approvalDecision: (decision) => approvalDecisionNames[decision],
  approvers: 'Approvers',
  you: 'You',
  remindApprover: (name) => `Remind ${name}`,
  requestApprovalAgain: (name) => `Request again from ${name}`,
  yourDecision: 'Your decision',
  approve: 'Approve',
  reject: 'Reject',
  submitDecision: 'Submit',
  signDecision: 'Sign your decision',
  decisionFailed: 'The decision could not be submitted.',
  recordUnavailable: (reason) => (reason === 'restricted' ? 'Restricted item' : 'Missing item'),
};
