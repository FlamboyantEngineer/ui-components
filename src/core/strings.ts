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
}

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
};
