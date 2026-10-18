/** Strings shared by actions, navigation, overlays, collections and people. */
export interface CommonStrings {
  close: string;
  dismiss: string;
  confirm: string;
  /** Acknowledges an alert. */
  ok: string;
  /** Shown when an action fails without a message of its own. */
  actionFailed: string;
  more: string;
  /** Names the menu half of a split button. */
  moreOptions: string;
  /** Default accessible name of a context menu. */
  contextMenu: string;
  /** Default accessible name of a command palette. */
  commandPalette: string;
  /** Names and hints the search field of a command palette. */
  searchCommands: string;
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
  /** Announces that a copy reached the clipboard. */
  copied: string;
  /** Announces that a copy did not reach the clipboard. */
  copyFailed: string;
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
  /** Names the menu button that holds the items of a row that do not fit. */
  moreItems: (count: number) => string;
  /** Names the button that adds a tab. */
  addTab: string;
  /** Makes a copy of an item beside it, such as a tab. */
  duplicate: string;
  /** Moves an item one place in a direction, such as a tab along its list. */
  moveItem: (direction: 'left' | 'right' | 'up' | 'down') => string;
  /** Tells a reader that a link opens in a new tab or window. */
  opensInNewTab: string;
  /** Names a collection's selected count (`3 selected`). */
  selectedCount: (count: number) => string;
  /** Clears a collection's selection. */
  clearSelection: string;
  /** Names a button that opens a menu of the places beside one, from its name. */
  placesBeside: (name: string) => string;
  /** Names a button that removes a listed item, from the item's name. */
  removeItem: (name: string) => string;
  itemCount: (count: number) => string;
  /** Accessible name of a labelled item with a count (`Open, 3`), from the label and the shown count. */
  labelWithCount: (label: string, count: string) => string;
  /** Stands in for a person or group whose name is blank. */
  unnamed: string;
  /** Accessible name of a person shown with a status (`Maria Santos, Away`). */
  nameWithStatus: (name: string, status: string) => string;
  /** The label of a presence state on its own (`Away`). */
  presenceStatus: (status: 'active' | 'away' | 'busy' | 'idle') => string;
  /** Accessible name of an overflow count, with the names it hides when known. */
  morePeople: (count: number, names: readonly string[]) => string;
  /** Spoken name of a keyboard key or modifier (`↑` → `Up Arrow`); other keys are read as written. */
  shortcutKeyName: (key: string) => string;
  /** Joins the readable chords of a key sequence (`G, then I`). */
  shortcutSequence: (steps: readonly string[]) => string;
  retry: string;
  loadMore: string;
  remainingCount: (count: number) => string;
  countOrMore: (count: number) => string;
  /** A step counter such as `2 of 5`. */
  stepOfTotal: (current: number, total: number) => string;
  /** A total beside the parts it sums, from the formatted total (`30 total`). */
  totalCount: (total: string) => string;
  /** Names the mark of a group holding a value that overrides an inherited one. */
  containsOverrides: string;
  /** Names a search box that filters a panel, from the panel's label. */
  filterLabel: (label: string) => string;
  /** The message of a filter no property matches, from the trimmed query. */
  noPropertyMatches: (query: string) => string;
  clearFilter: string;
  /** The name of one side of a box, such as a margin. */
  boxSide: (side: 'top' | 'right' | 'bottom' | 'left') => string;
  /** The name of one flow-relative side of a box, which follows the writing direction. */
  logicalBoxSide: (side: 'block-start' | 'block-end' | 'inline-start' | 'inline-end') => string;
  /** The toggle that links a box's sides, so one edit sets all four or each opposite pair. */
  linkSides: (link: 'all' | 'pairs') => string;
  /** The action that signs, in a signature dialog. */
  sign: string;
  /** Says who signs, from the signer's user name. */
  signingAs: (userName: string) => string;
  /** Names the meaning a signature gives its signer's assent: approval, review, authorship. */
  signatureMeaning: string;
  /** Names the field for the reason of a signature. */
  signatureReason: string;
  /** Names the field for a signer's drawn or typed signature. */
  signature: string;
  /** Names the field for a user name. */
  userName: string;
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

const presenceStatusNames = { active: 'Active', away: 'Away', busy: 'Busy', idle: 'Idle' } as const;

const boxSideNames = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' } as const;
const logicalBoxSideNames = {
  'block-start': 'Top',
  'block-end': 'Bottom',
  'inline-start': 'Start',
  'inline-end': 'End',
} as const;

export const commonStrings: CommonStrings = {
  close: 'Close',
  dismiss: 'Dismiss',
  confirm: 'Confirm',
  ok: 'OK',
  actionFailed: 'The action could not be completed.',
  more: 'More',
  moreOptions: 'More options',
  contextMenu: 'Context menu',
  commandPalette: 'Command palette',
  searchCommands: 'Search commands',
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
  copied: 'Copied',
  copyFailed: 'Copy failed',
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
  moreItems: (count) => (count === 1 ? '1 more item' : `${count} more items`),
  addTab: 'Add tab',
  duplicate: 'Duplicate',
  moveItem: (direction) => `Move ${direction}`,
  opensInNewTab: '(opens in a new tab)',
  selectedCount: (count) => `${count} selected`,
  clearSelection: 'Clear selection',
  placesBeside: (name) => `Places beside ${name}`,
  removeItem: (name) => `Remove ${name}`,
  itemCount: (count) => (count === 1 ? '1 item' : `${count} items`),
  labelWithCount: (label, count) => `${label}, ${count}`,
  unnamed: 'Unnamed',
  nameWithStatus: (name, status) => `${name}, ${status}`,
  presenceStatus: (status) => presenceStatusNames[status],
  morePeople: (count, names) =>
    `${count === 1 ? '1 more person' : `${count} more people`}${names.length > 0 ? `: ${names.join(', ')}` : ''}`,
  shortcutKeyName: (key) => spokenKeyNames[key] ?? key,
  shortcutSequence: (steps) => steps.join(', then '),
  retry: 'Retry',
  loadMore: 'Load more',
  remainingCount: (count) => `${count} remaining`,
  countOrMore: (count) => `${count} or more`,
  stepOfTotal: (current, total) => `${current} of ${total}`,
  totalCount: (total) => `${total} total`,
  containsOverrides: 'Contains overridden values',
  filterLabel: (label) => `Filter ${label.toLocaleLowerCase()}`,
  noPropertyMatches: (query) => `No properties match “${query}”.`,
  clearFilter: 'Clear filter',
  boxSide: (side) => boxSideNames[side],
  logicalBoxSide: (side) => logicalBoxSideNames[side],
  linkSides: (link) => (link === 'all' ? 'Link all sides' : 'Link opposite sides'),
  sign: 'Sign',
  signingAs: (userName) => `Signing as ${userName}`,
  signatureMeaning: 'Meaning of signature',
  signatureReason: 'Reason',
  signature: 'Signature',
  userName: 'User name',
};
