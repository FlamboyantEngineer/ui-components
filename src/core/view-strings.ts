/** Strings of view switchers, display options, inline edits, record headers and transition menus. */
export interface ViewStrings {
  /** Names a view switcher's list of saved views. */
  views: string;
  /** Names the menu of a view's actions, from the view's name. */
  viewActions: (name: string) => string;
  /** Marks a view whose current settings differ from its saved ones. */
  viewModified: string;
  /** Marks the view that opens first. */
  defaultView: string;
  /** Saves the current settings as a new view. */
  saveViewAs: string;
  /** Puts a modified view's saved settings back. */
  resetView: string;
  /** Makes a view the one that opens first. */
  setDefaultView: string;
  /** Titles the dialog that names a new view. */
  newView: string;
  /** Titles the dialog that renames a view. */
  renameView: string;
  /** Names the field that names a view. */
  viewName: string;
  /** Titles the confirmation of a view's deletion, from its name. */
  deleteViewTitle: (name: string) => string;
  /** Says what deleting a view does. */
  deleteViewMessage: string;
  /** Labels the button that opens display options. */
  display: string;
  /** Titles the display options popover. */
  displayOptions: string;
  /** Names the property rows are grouped by. */
  groupBy: string;
  /** The choice that groups no rows. */
  noGrouping: string;
  /** Names the property rows are sorted by. */
  sortBy: string;
  /** The choice that keeps the rows in their own order. */
  noSorting: string;
  /** Names the choice between ascending and descending order. */
  sortDirection: string;
  /** A sort direction's name. */
  sortDirectionName: (direction: 'ascending' | 'descending') => string;
  /** Heads the list of properties to show, in order. */
  shownProperties: string;
  /** Names the checkbox that shows a property, from the property's label. */
  showProperty: (label: string) => string;
  /** Names the choice of row spacing. */
  density: string;
  /** A row spacing's name. */
  densityName: (density: 'compact' | 'default' | 'comfortable') => string;
  /** Names the button that turns a value into its editor, from the value's label. */
  editValue: (label: string) => string;
  /** Shown when saving a value failed without a message of its own. */
  saveFailed: string;
  /** Names a record's title where it is edited. */
  recordTitle: string;
  /** Names the button that copies a record's identifier, from the identifier. */
  copyIdentifier: (identifier: string) => string;
  /** Names a record's state. */
  status: string;
  /** Names the button showing a state, from the state's label and the state. */
  stateTrigger: (label: string, state: string) => string;
  /** Titles the dialog of a transition and labels its action, from the target state. */
  transitionTo: (state: string) => string;
}

const sortDirectionNames = { ascending: 'Ascending', descending: 'Descending' } as const;

const densityNames = {
  compact: 'Compact',
  default: 'Default',
  comfortable: 'Comfortable',
} as const;

export const viewStrings: ViewStrings = {
  views: 'Views',
  viewActions: (name) => `Actions for ${name}`,
  viewModified: 'Modified',
  defaultView: 'Default view',
  saveViewAs: 'Save as new view',
  resetView: 'Reset changes',
  setDefaultView: 'Set as default view',
  newView: 'New view',
  renameView: 'Rename view',
  viewName: 'View name',
  deleteViewTitle: (name) => `Delete ${name}?`,
  deleteViewMessage: 'The view and its saved settings are removed.',
  display: 'Display',
  displayOptions: 'Display options',
  groupBy: 'Group by',
  noGrouping: 'No grouping',
  sortBy: 'Sort by',
  noSorting: 'Default order',
  sortDirection: 'Sort direction',
  sortDirectionName: (direction) => sortDirectionNames[direction],
  shownProperties: 'Shown properties',
  showProperty: (label) => `Show ${label}`,
  density: 'Density',
  densityName: (density) => densityNames[density],
  editValue: (label) => `Edit ${label}`,
  saveFailed: 'The change could not be saved.',
  recordTitle: 'Title',
  copyIdentifier: (identifier) => `Copy ${identifier}`,
  status: 'Status',
  stateTrigger: (label, state) => `${label}: ${state}`,
  transitionTo: (state) => `Move to ${state}`,
};
