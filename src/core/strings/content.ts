import { defineStrings, toSelectKey } from '../message-format.js';
/**
 * Strings of the folder manager, code and JSON editors, completions, conversations, emoji picker,
 * PDF viewer, data tables, timestamps, save status, record labels, outlines, state histories,
 * comments and reactions.
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
  /** Names a list of completions. */
  suggestions: string;
  /** Names a message composer's text box. */
  message: string;
  /** Sends a composed message. */
  send: string;
  /** Stops a reply while it streams. */
  stop: string;
  /** Names a conversation log. */
  conversation: string;
  /** Scrolls a conversation to its latest message. */
  jumpToLatest: string;
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
  /** A document page whose drawing failed, from its page number (`Page 3 could not be drawn.`). */
  pageFailed: (pageNumber: number) => string;
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
}

/** The module's text, with the message values each text function reads its arguments as. */
export const contentStrings = defineStrings<ContentStrings>({
  renameItem: (name) => ({ name }),
  folderDepthLimit: (depth) => ({ depth }),
  invalidJsonAt: (line, column) => ({ line: String(line), column: String(column) }),
  jsonTypeMismatch: (types) => ({ types: { items: types, type: 'or' } }),
  jsonValueMismatch: (values) => ({ values: { items: values, type: 'or' }, count: values.length }),
  jsonMissingProperty: (name) => ({ name }),
  jsonUnknownProperty: (name) => ({ name }),
  jsonTooFewItems: (count) => ({ count }),
  jsonTooManyItems: (count) => ({ count }),
  jsonProblemAt: (line, column, message) => ({
    line: String(line),
    column: String(column),
    message,
  }),
  emojiCategory: (category) => ({ category }),
  skinToneName: (tone) => ({ tone: toSelectKey(tone), name: tone }),
  controlsFor: (name) => ({ name }),
  ofTotal: (total) => ({ total }),
  matchTotal: (total) => ({ total }),
  sectionsIn: (label) => ({ label }),
  pageNumber: (pageNumber) => ({ pageNumber }),
  pageFailed: (pageNumber) => ({ pageNumber }),
  paginationOf: (name) => ({ name }),
  seriesSummary: (values) => ({ ...values }),
  saveStatus: (phase) => ({ phase }),
  recordUnavailable: (reason) => ({ reason }),
  showMoreReplies: (count) => ({ count }),
  reactionLabel: (emoji, count, names) => ({
    emoji,
    count,
    names,
    nameList: { items: names, type: 'unit' },
    named: names.length,
    others: Math.max(0, count - names.length),
  }),
});
