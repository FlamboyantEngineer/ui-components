/** Built-in text every component draws from. Hosts override any entry through `UiProvider`. */
export interface UiStrings {
  close: string;
  dismiss: string;
  confirm: string;
  /** Shown when an action fails without a message of its own. */
  actionFailed: string;
  more: string;
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

export const defaultStrings: UiStrings = {
  close: 'Close',
  dismiss: 'Dismiss',
  confirm: 'Confirm',
  actionFailed: 'The action could not be completed.',
  more: 'More',
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
