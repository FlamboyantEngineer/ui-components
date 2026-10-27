import type { MessageArguments } from './message-format.js';
/** Strings of the rich-text editor and its toolbars and menus. */
export interface RichTextStrings {
  /** Names a rich-text editor's formatting toolbar. */
  textFormatting: string;
  /** Names the toolbar that floats over selected text. */
  selectionFormatting: string;
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  /** The inline code mark. */
  inlineCode: string;
  link: string;
  /** Labels the address field of a link editor. */
  linkAddress: string;
  removeLink: string;
  /** Labels the select that turns the current block into another type. */
  blockType: string;
  /** The plain text block type. */
  paragraph: string;
  /** A heading block type, from its level. */
  heading: (level: number) => string;
  codeBlock: string;
  quote: string;
  bulletList: string;
  numberedList: string;
  taskList: string;
  /** The horizontal rule between blocks. */
  divider: string;
  undo: string;
  redo: string;
  /** Labels the button that opens the menu of blocks to insert. */
  insert: string;
  /** Names the list of insert commands the slash key opens. */
  insertCommands: string;
  /** Labels a block's menu button. */
  blockActions: string;
  /** The submenu that changes a block's type. */
  turnInto: string;
  moveUp: string;
  moveDown: string;
  /** Names the checkbox of a task list item. */
  taskDone: string;
}

/** The message values each text function reads its arguments as. */
export const richTextArguments: MessageArguments<RichTextStrings> = {
  heading: (level) => ({ level }),
};
