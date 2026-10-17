/** Built-in text every component draws from. Hosts override any entry through `UiProvider`. */
export interface UiStrings {
  close: string;
  dismiss: string;
  confirm: string;
  /** Shown when an action fails without a message of its own. */
  actionFailed: string;
  more: string;
  /** Default accessible name of a context menu. */
  contextMenu: string;
  loading: string;
  clear: string;
  help: string;
  expand: string;
  collapse: string;
  search: string;
  noResults: string;
  previous: string;
  next: string;
  copy: string;
  resize: string;
  /** Names the search box that narrows a table's rows. */
  filterRows: string;
  /** Names a table's row actions column. */
  rowActions: string;
  scrollVertically: string;
  scrollHorizontally: string;
  add: string;
  refresh: string;
  edit: string;
  delete: string;
  save: string;
  saving: string;
  cancel: string;
  zoom: string;
  zoomLevel: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  /** Names the button that opens a zoom control's preset menu. */
  zoomPresets: string;
  scrollBackward: string;
  scrollForward: string;
  /** Opens a file chooser. */
  browse: string;
  /** Names a button that removes a listed item, from the item's name. */
  removeItem: (name: string) => string;
  /** States a size limit, from the formatted size. */
  fileSizeLimit: (size: string) => string;
  /** Counts chosen files refused because their type is not accepted. */
  rejectedFileType: (count: number) => string;
  /** Counts chosen files refused because they are larger than the size limit. */
  rejectedFileSize: (count: number) => string;
  newFolder: string;
  /** Names the field that names a new folder. */
  newFolderName: string;
  rename: string;
  /** Names the field that renames an item, from its current name. */
  renameItem: (name: string) => string;
  /** Why a folder takes no new folder: it is at the deepest level allowed. */
  folderDepthLimit: (depth: number) => string;
  /** Names a code editor's list of completions. */
  suggestions: string;
  /** Rewrites a value, such as JSON text, with standard indentation. */
  format: string;
  /** The message of text that is not valid JSON. */
  invalidJson: string;
  /** The message of text that is not valid JSON, with where the problem starts. */
  invalidJsonAt: (line: number, column: number) => string;
  itemCount: (count: number) => string;
  /** Stands in for a person or group whose name is blank. */
  unnamed: string;
  /** Accessible name of a person shown with a status (`Maria Santos, Away`). */
  nameWithStatus: (name: string, status: string) => string;
  /** Accessible name of an overflow count, with the names it hides when known. */
  morePeople: (count: number, names: readonly string[]) => string;
  /** Spoken name of a keyboard key or modifier (`↑` → `Up Arrow`); other keys are read as written. */
  shortcutKeyName: (key: string) => string;
  retry: string;
  loadMore: string;
  remainingCount: (count: number) => string;
  countOrMore: (count: number) => string;
  /** A step counter such as `2 of 5`. */
  stepOfTotal: (current: number, total: number) => string;
  /** A field menu action that puts the field's default value back. */
  setDefault: string;
  /** The message of a required field left empty. */
  valueRequired: string;
  /** The message of a field whose value is being checked. */
  validating: string;
  /** The message of a text shorter than its minimum length. */
  tooShort: (minLength: number) => string;
  /** The message of a text longer than its maximum length. */
  tooLong: (maxLength: number) => string;
  /** The message of a text that does not match its expected format. */
  patternMismatch: string;
  /** Names a button that puts a field's committed value back, from the field's label. */
  restoreValue: (label: string) => string;
  /** Names a field's help button, from the field's label. */
  fieldHelp: (label: string) => string;
  /** Names a field's menu, from the field's label. */
  fieldActions: (label: string) => string;
  /** The message of a number below its minimum, given the formatted minimum. */
  rangeUnderflow: (minimum: string) => string;
  /** The message of a number above its maximum, given the formatted maximum. */
  rangeOverflow: (maximum: string) => string;
  /** The message of a number off its step, given the formatted step. */
  stepMismatch: (step: string) => string;
  /** Names a search box's clear button. */
  clearSearch: string;
  /** Names the toggle button that shows a masked text field's value, from the field's label. */
  revealValue: (label: string) => string;
  /** A text's length, against its maximum length when it has one (`12/100`). */
  characterCount: (count: number, maxLength?: number) => string;
  /** The default label of a true value. */
  valueTrue: string;
  /** The default label of a false value. */
  valueFalse: string;
  /** The default label of a value that is not set. */
  valueUnset: string;
  /** Stands for an empty colour value. */
  noColor: string;
  /** Names the hexadecimal input of a colour picker. */
  hexColor: string;
  /** Names the button that removes a chosen value, read with the value it removes. */
  remove: string;
  /** The text of a select that has no value and no placeholder of its own. */
  selectPlaceholder: string;
  /** Names the group of a multiple select's chosen values, from the field's label. */
  selectedValues: (label: string) => string;
  /** The message of a search that needs a longer query before it runs. */
  typeToSearch: (minLength: number) => string;
  /** The message of a search that failed. */
  searchFailed: string;
  /** A date field action that picks the current date. */
  today: string;
  /** A date field action that picks the current date and time. */
  now: string;
  /** The message of a date or time earlier than the field allows. */
  dateTooEarly: (minValue: string) => string;
  /** The message of a date or time later than the field allows. */
  dateTooLate: (maxValue: string) => string;
  /** Names the mark of a group holding a value that overrides an inherited one. */
  containsOverrides: string;
  /** Names a search box that filters a panel, from the panel's label. */
  filterLabel: (label: string) => string;
  /** The message of a filter no property matches, from the trimmed query. */
  noPropertyMatches: (query: string) => string;
  clearFilter: string;
  /** The name of one side of a box, such as a margin. */
  boxSide: (side: 'top' | 'right' | 'bottom' | 'left') => string;
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
  documentFailed: string;
}

const spokenKeyNames: Readonly<Record<string, string>> = {
  '↑': 'Up Arrow',
  '↓': 'Down Arrow',
  '←': 'Left Arrow',
  '→': 'Right Arrow',
  '.': 'Period',
  ',': 'Comma',
  '\\': 'Backslash',
  '+': 'Plus',
  ' ': 'Space',
};

const boxSideNames = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' } as const;
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

export const defaultStrings: UiStrings = {
  close: 'Close',
  dismiss: 'Dismiss',
  confirm: 'Confirm',
  actionFailed: 'The action could not be completed.',
  more: 'More',
  contextMenu: 'Context menu',
  loading: 'Loading',
  clear: 'Clear',
  help: 'Help',
  expand: 'Expand',
  collapse: 'Collapse',
  search: 'Search',
  noResults: 'No results',
  previous: 'Previous',
  next: 'Next',
  copy: 'Copy',
  resize: 'Resize',
  filterRows: 'Filter rows',
  rowActions: 'Actions',
  scrollVertically: 'Scroll vertically',
  scrollHorizontally: 'Scroll horizontally',
  add: 'Add',
  refresh: 'Refresh',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  saving: 'Saving',
  cancel: 'Cancel',
  zoom: 'Zoom',
  zoomLevel: 'Zoom level',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetZoom: 'Reset zoom',
  zoomPresets: 'Zoom presets',
  scrollBackward: 'Scroll backward',
  scrollForward: 'Scroll forward',
  browse: 'Browse',
  removeItem: (name) => `Remove ${name}`,
  fileSizeLimit: (size) => `Up to ${size}`,
  rejectedFileType: (count) =>
    count === 1 ? '1 file is not an accepted type.' : `${count} files are not an accepted type.`,
  rejectedFileSize: (count) =>
    count === 1 ? '1 file is too large.' : `${count} files are too large.`,
  newFolder: 'New folder',
  newFolderName: 'New folder name',
  rename: 'Rename',
  renameItem: (name) => `Rename ${name}`,
  folderDepthLimit: (depth) =>
    depth === 1 ? 'Folders cannot be nested.' : `Folders nest at most ${depth} levels deep.`,
  suggestions: 'Suggestions',
  format: 'Format',
  invalidJson: 'Enter valid JSON.',
  invalidJsonAt: (line, column) => `Enter valid JSON: check line ${line}, column ${column}.`,
  itemCount: (count) => (count === 1 ? '1 item' : `${count} items`),
  unnamed: 'Unnamed',
  nameWithStatus: (name, status) => `${name}, ${status}`,
  morePeople: (count, names) =>
    `${count === 1 ? '1 more person' : `${count} more people`}${names.length > 0 ? `: ${names.join(', ')}` : ''}`,
  shortcutKeyName: (key) => spokenKeyNames[key] ?? key,
  retry: 'Retry',
  loadMore: 'Load more',
  remainingCount: (count) => `${count} remaining`,
  countOrMore: (count) => `${count} or more`,
  stepOfTotal: (current, total) => `${current} of ${total}`,
  setDefault: 'Set to default',
  valueRequired: 'A value is required.',
  validating: 'Validating',
  tooShort: (minLength) =>
    minLength === 1 ? 'Use at least 1 character.' : `Use at least ${minLength} characters.`,
  tooLong: (maxLength) =>
    maxLength === 1 ? 'Use 1 character or fewer.' : `Use ${maxLength} characters or fewer.`,
  patternMismatch: 'Enter a value in the expected format.',
  restoreValue: (label) => `Restore ${label}`,
  fieldHelp: (label) => `Help for ${label}`,
  fieldActions: (label) => `${label} actions`,
  rangeUnderflow: (minimum) => `Enter ${minimum} or more.`,
  rangeOverflow: (maximum) => `Enter ${maximum} or less.`,
  stepMismatch: (step) => `Enter a value in steps of ${step}.`,
  clearSearch: 'Clear search',
  revealValue: (label) => `Show ${label}`,
  characterCount: (count, maxLength) =>
    maxLength === undefined ? String(count) : `${count}/${maxLength}`,
  valueTrue: 'True',
  valueFalse: 'False',
  valueUnset: 'Unset',
  noColor: 'No color',
  hexColor: 'Hex color',
  remove: 'Remove',
  selectPlaceholder: 'Select an option',
  selectedValues: (label) => `${label} selected values`,
  typeToSearch: (minLength) =>
    minLength === 1 ? 'Type to search.' : `Type at least ${minLength} characters to search.`,
  searchFailed: 'Search is unavailable.',
  today: 'Today',
  now: 'Now',
  dateTooEarly: (minValue) => `Choose a value on or after ${minValue}.`,
  dateTooLate: (maxValue) => `Choose a value on or before ${maxValue}.`,
  containsOverrides: 'Contains overridden values',
  filterLabel: (label) => `Filter ${label.toLocaleLowerCase()}`,
  noPropertyMatches: (query) => `No properties match “${query}”.`,
  clearFilter: 'Clear filter',
  boxSide: (side) => boxSideNames[side],
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
  documentFailed: 'The document could not be opened.',
};
