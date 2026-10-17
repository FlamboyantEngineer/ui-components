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
  restore: string;
  undo: string;
  redo: string;
  help: string;
  required: string;
  expand: string;
  collapse: string;
  search: string;
  noResults: string;
  previous: string;
  next: string;
  copy: string;
  copied: string;
  sortAscending: string;
  sortDescending: string;
  resize: string;
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
  scrollBackward: string;
  scrollForward: string;
  itemCount: (count: number) => string;
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

export const defaultStrings: UiStrings = {
  close: 'Close',
  dismiss: 'Dismiss',
  confirm: 'Confirm',
  actionFailed: 'The action could not be completed.',
  more: 'More',
  contextMenu: 'Context menu',
  loading: 'Loading',
  clear: 'Clear',
  restore: 'Restore',
  undo: 'Undo',
  redo: 'Redo',
  help: 'Help',
  required: 'Required',
  expand: 'Expand',
  collapse: 'Collapse',
  search: 'Search',
  noResults: 'No results',
  previous: 'Previous',
  next: 'Next',
  copy: 'Copy',
  copied: 'Copied',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  resize: 'Resize',
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
  scrollBackward: 'Scroll backward',
  scrollForward: 'Scroll forward',
  itemCount: (count) => (count === 1 ? '1 item' : `${count} items`),
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
};
