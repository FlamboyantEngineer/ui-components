/** Built-in text every component draws from. Hosts override any entry through `UiProvider`. */
export interface UiStrings {
  close: string;
  dismiss: string;
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
  itemCount: (count: number) => string;
  /** Spoken name of a keyboard key or modifier (`↑` → `Up Arrow`); other keys are read as written. */
  shortcutKeyName: (key: string) => string;
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
  itemCount: (count) => (count === 1 ? '1 item' : `${count} items`),
  shortcutKeyName: (key) => spokenKeyNames[key] ?? key,
};
