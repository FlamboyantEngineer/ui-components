/**
 * Strings of the folder manager, code and JSON editors, emoji picker, PDF viewer, data tables,
 * timestamps, save status and record labels.
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
  /** Names a document's outline (its bookmarks). */
  outline: string;
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

const saveStatusNames = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved',
  offline: 'Offline',
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
  recordUnavailable: (reason) => (reason === 'restricted' ? 'Restricted item' : 'Missing item'),
};
