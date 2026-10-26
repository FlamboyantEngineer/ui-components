import type { RichTextCommand } from './rich-text-command.js';
/** The editor's state at the selection, and the commands that change the document. */
export interface RichTextController {
    /** The reader may change the document: it is neither read-only nor disabled. */
    isEditable: boolean;
    /** The selection is a caret. */
    isSelectionEmpty: boolean;
    /** The address of the link at the selection, if any. */
    link: string | null;
    /** Whether the schema has the node or mark types the command needs. */
    supports(command: RichTextCommand): boolean;
    /** Whether the command would change the document at the selection now. */
    can(command: RichTextCommand): boolean;
    /** Whether the command's effect holds at the selection, for a toggle's pressed state. */
    isActive(command: RichTextCommand): boolean;
    /** Runs the command at the selection; returns whether it ran. */
    run(command: RichTextCommand): boolean;
    /** Moves focus into the document, keeping its selection. */
    focus(): void;
}
/**
 * The controller of the enclosing `RichTextEditor`, for chrome rendered inside it (its toolbar or
 * children). The component renders again whenever the editor's state changes.
 */
export declare function useRichTextController(): RichTextController;
//# sourceMappingURL=rich-text-controller.d.ts.map