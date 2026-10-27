import { toSelectKey, type MessageArguments } from './message-format.js';
/** The formatted parts of a segmented progress bar's value text. */
export interface SegmentProgressText {
  /** Completed units. */
  completed: string;
  /** All units. */
  total: string;
  /** Completed units as a percentage of all units. */
  percent: string;
  /** The label of the unit under way, when there is one. */
  current?: string | undefined;
}

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
  /** Names the toolbar of a docked panel's pane launchers, from the panel's label. */
  panelPanes: (panel: string) => string;
  /** Names the button that collapses a docked panel to its launchers, from the panel's label. */
  collapsePanel: (panel: string) => string;
  /** Names the button that expands a collapsed docked panel, from the panel's label. */
  expandPanel: (panel: string) => string;
  /** Names the separator that resizes a docked panel, from the panel's label. */
  resizePanel: (panel: string) => string;
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
  /**
   * Spoken name of a keyboard key or modifier (`↑` → `Up Arrow`, `Command`); other keys are read as
   * written.
   */
  shortcutKeyName: (key: string) => string;
  /** Joins the readable chords of a key sequence, one step at a time (`G, then I`). */
  shortcutThen: (previous: string, next: string) => string;
  retry: string;
  loadMore: string;
  remainingCount: (count: number) => string;
  countOrMore: (count: number) => string;
  /** A step counter such as `2 of 5`. */
  stepOfTotal: (current: number, total: number) => string;
  /** A segmented progress bar's visible value (`1/7 · 14%`), from its formatted parts. */
  segmentCount: (progress: SegmentProgressText) => string;
  /** A segmented progress bar's spoken value, naming the unit under way when there is one. */
  segmentProgress: (progress: SegmentProgressText) => string;
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
  /** Titles the question asked before leaving unsaved changes. */
  unsavedChanges: string;
  /** Asks to save unsaved changes before leaving. */
  saveBeforeLeaving: string;
  /** Asks to leave unsaved changes that cannot be saved from here. */
  discardBeforeLeaving: string;
  /** Throws unsaved changes away. */
  discard: string;
  /** Keeps the reader where they are, with their changes. */
  stay: string;
  /** The link that moves focus past an application frame's bars to its main content. */
  skipToMainContent: string;
  /** Names a side or bottom panel of an application frame. */
  appFramePanel: (panel: 'start' | 'end' | 'bottom') => string;
  /** Names a strip of tools. */
  tools: string;
  /** Names a group of actions. */
  actions: string;
  /** The button that collapses a navigation rail to icons, or expands it again. */
  toggleNavigation: (isCollapsed: boolean) => string;
  /** Names the handle that resizes a navigation rail. */
  resizeNavigation: string;
  /** Returns to the previous step of a multi-step task. */
  back: string;
  /** Completes the last step of a multi-step task. */
  finish: string;
  /** Passes over an optional step. */
  skip: string;
  /** Marks a step or entry the reader may leave out. */
  optional: string;
  /** Default accessible name of a list of steps. */
  steps: string;
  /** Read after a settled step's label (`Upload, Completed`). */
  stepStatus: (status: 'complete' | 'error' | 'skipped') => string;
}

const spokenKeys: Readonly<Record<string, string>> = {
  '↑': 'up',
  '↓': 'down',
  '←': 'left',
  '→': 'right',
  '.': 'period',
  ',': 'comma',
  '\\': 'backslash',
  '+': 'plus',
  ' ': 'space',
  Control: 'control',
  Option: 'option',
  Alt: 'alt',
  Shift: 'shift',
  Command: 'command',
  Meta: 'meta',
};

/** The message values each text function reads its arguments as. */
export const commonArguments: MessageArguments<CommonStrings> = {
  moreItems: (count) => ({ count }),
  panelPanes: (panel) => ({ panel }),
  collapsePanel: (panel) => ({ panel }),
  expandPanel: (panel) => ({ panel }),
  resizePanel: (panel) => ({ panel }),
  moveItem: (direction) => ({ direction }),
  selectedCount: (count) => ({ count }),
  placesBeside: (name) => ({ name }),
  removeItem: (name) => ({ name }),
  itemCount: (count) => ({ count }),
  labelWithCount: (label, count) => ({ label, count }),
  nameWithStatus: (name, status) => ({ name, status }),
  presenceStatus: (status) => ({ status }),
  morePeople: (count, names) => ({ count, names, hasNames: names.length > 0 }),
  shortcutKeyName: (key) => ({ key: spokenKeys[key] ?? 'other', name: key }),
  shortcutThen: (previous, next) => ({ previous, next }),
  remainingCount: (count) => ({ count }),
  countOrMore: (count) => ({ count }),
  stepOfTotal: (current, total) => ({ current, total }),
  segmentCount: (progress) => ({ ...progress }),
  segmentProgress: (progress) => ({ ...progress, hasCurrent: progress.current !== undefined }),
  totalCount: (total) => ({ total }),
  filterLabel: (label) => ({ label: label.toLocaleLowerCase() }),
  noPropertyMatches: (query) => ({ query }),
  boxSide: (side) => ({ side }),
  logicalBoxSide: (side) => ({ side: toSelectKey(side) }),
  linkSides: (link) => ({ link }),
  signingAs: (userName) => ({ userName }),
  appFramePanel: (panel) => ({ panel }),
  toggleNavigation: (isCollapsed) => ({ isCollapsed }),
  stepStatus: (status) => ({ status }),
};
