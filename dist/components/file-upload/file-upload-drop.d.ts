import { type DragEvent, type ReactElement, type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { DraggedItem } from './file-rules.js';
/** How the owner names a command: the names it gives come before the command's own text. */
export type CommandNaming = Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>;
/** What both commands draw from: the label, the help and error ids, the chooser and the intake. */
export interface CommandProps {
    label: string;
    /** The owner's names for the command. */
    naming: CommandNaming;
    /** The description element, if any. */
    hint: ReactNode;
    /** The ids that describe the command: the description and the error message. */
    describedBy: string | undefined;
    isDisabled: boolean;
    /** Wraps a button so pressing it opens the system file chooser. */
    withChooser: (button: ReactElement) => ReactElement;
    receive: (files: readonly File[]) => void;
    /** Whether the files of the drag in progress would be accepted, as far as a drag can tell. */
    isDragAcceptable: boolean;
    /** Dropped folders are read for their files. */
    acceptDirectory: boolean;
    /** The button that opens the chooser, focused when a form finds the upload empty. */
    commandRef: Ref<HTMLButtonElement>;
}
/** A file dropped on the upload, read on demand. */
export interface DroppedFile {
    kind: 'file';
    /** The MIME type. */
    type: string;
    name: string;
    getFile(): Promise<File>;
}
/** A folder dropped on the upload, whose entries are files and folders. */
export interface DroppedDirectory {
    kind: 'directory';
    name: string;
    getEntries(): AsyncIterable<DroppedFile | DroppedDirectory>;
}
/** Something else dropped, such as text, which the upload ignores. */
export interface DroppedText {
    kind: 'text';
}
/** One item of a drop on the upload. */
export type DroppedItem = DroppedFile | DroppedDirectory | DroppedText;
/** The dropped files, in order, with every file inside dropped folders when they are accepted. */
export declare function readDroppedFiles(items: readonly DroppedItem[], acceptDirectory: boolean): Promise<File[]>;
/** The kind and MIME type of each item of a native drag, all a drag tells before the drop. */
export declare function readDraggedItems(event: DragEvent): DraggedItem[];
/**
 * The drop zone: a React Aria `DropZone` with the upload glyph, the title, the description and a
 * Browse button. While a drag is over it, it says whether the dragged files would be accepted.
 */
export declare function DropZoneCommand(props: CommandProps): import("react").JSX.Element;
/** The `button` command: a Button with the upload glyph that opens the chooser, then the help. */
export declare function ButtonCommand(props: CommandProps): import("react").JSX.Element;
//# sourceMappingURL=file-upload-drop.d.ts.map