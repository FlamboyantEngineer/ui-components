/** Built-in text every component draws from. Hosts override any entry through `UiProvider`. */
export interface UiStrings {
  close: string;
  dismiss: string;
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
  itemCount: (count: number) => string;
  /** Stands in for a person or group whose name is blank. */
  unnamed: string;
  /** Accessible name of a person shown with a status (`Maria Santos, Away`). */
  nameWithStatus: (name: string, status: string) => string;
  /** Accessible name of an overflow count, with the names it hides when known. */
  morePeople: (count: number, names: readonly string[]) => string;
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
  itemCount: (count) => (count === 1 ? '1 item' : `${count} items`),
  unnamed: 'Unnamed',
  nameWithStatus: (name, status) => `${name}, ${status}`,
  morePeople: (count, names) =>
    `${count === 1 ? '1 more person' : `${count} more people`}${names.length > 0 ? `: ${names.join(', ')}` : ''}`,
  shortcutKeyName: (key) => spokenKeyNames[key] ?? key,
};
