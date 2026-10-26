import { type DragEvent } from 'react';
export interface FileDrop {
    /** A drag carrying files is over the composer. */
    isDropTarget: boolean;
    /** Handlers for the composer's root. */
    dropProps: {
        onDragEnter: (event: DragEvent) => void;
        onDragOver: (event: DragEvent) => void;
        onDragLeave: (event: DragEvent) => void;
        onDrop: (event: DragEvent) => void;
    };
}
/** The files chosen in the system file chooser, handed to `onAttach` when there are any. */
export declare function attachChosenFiles(list: FileList | null, onAttach: (files: File[]) => void): void;
/** The files a paste carries, handed to `onAttach` instead of pasting; whether there were any. */
export declare function attachPastedFiles(event: {
    clipboardData: DataTransfer | null;
    preventDefault: () => void;
}, onAttach: ((files: File[]) => void) | undefined): boolean;
/**
 * Files dragged onto the composer: while a drag that carries files is over it, it is a drop
 * target, and dropping hands the files to `onAttach`. Drags of text are left to the text box.
 * React Aria's drop hooks cannot tell a file drag from a text drag before the drop, so this
 * follows the native drag events, counting entries into the composer's children.
 */
export declare function useFileDrop(onAttach: ((files: File[]) => void) | undefined): FileDrop;
//# sourceMappingURL=use-file-drop.d.ts.map