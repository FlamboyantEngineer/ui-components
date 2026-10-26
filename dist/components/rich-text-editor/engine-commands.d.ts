import type { Command, EditorState } from 'prosemirror-state';
import type { RichTextCommand } from './rich-text-command.js';
/** The engine command that runs a library command. */
export declare function toEngineCommand(command: RichTextCommand): Command;
/** Whether a command's effect already holds at the selection, for a toggle's pressed state. */
export declare function isCommandActive(command: RichTextCommand, state: EditorState): boolean;
/** Whether the schema has the types a command needs. */
export declare function isCommandSupported(command: RichTextCommand, state: EditorState): boolean;
/** The address of the link at the selection's start, if any. */
export declare function getLinkAt(state: EditorState): string | null;
//# sourceMappingURL=engine-commands.d.ts.map