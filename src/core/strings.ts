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
};
