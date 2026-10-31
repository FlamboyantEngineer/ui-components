import { defineStrings } from '../message-format.js';
/** Strings of grid size pickers, character grids, transfer lists and tree select fields. */
export interface PickerStrings {
  /** Names a grid size picker that has no label of its own. */
  gridSizePicker: string;
  /** A grid size picker's readout of the previewed size (`3 × 4`). */
  gridSize: (rows: number, columns: number) => string;
  /** Names a grid size picker's cell from the size it chooses (`3 rows by 4 columns`). */
  gridSizeCell: (rows: number, columns: number) => string;
  /** Names a character grid that has no label of its own. */
  characterGrid: string;
  /** Names a character grid's search field. */
  searchCharacters: string;
  /** Heads a character grid's recently chosen characters. */
  recentCharacters: string;
  /** Heads a transfer list's items that are not chosen. */
  availableItems: string;
  /** Heads a transfer list's chosen items. */
  chosenItems: string;
  /** Shown in a transfer list's side that holds no item. */
  noItems: string;
  /** Moves a transfer list's selected items to a side, from the side's label. */
  moveSelectedTo: (label: string) => string;
  /** Moves every item a transfer list's side shows to the other side, from that side's label. */
  moveAllTo: (label: string) => string;
}

/** The module's text, with the message values each text function reads its arguments as. */
export const pickerStrings = defineStrings<PickerStrings>({
  gridSize: (rows, columns) => ({ rows, columns }),
  gridSizeCell: (rows, columns) => ({ rows, columns }),
  moveSelectedTo: (label) => ({ label: label.toLocaleLowerCase() }),
  moveAllTo: (label) => ({ label: label.toLocaleLowerCase() }),
});
