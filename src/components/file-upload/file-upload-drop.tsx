import {
  useId,
  useState,
  type DragEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { DropZone } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import type { DraggedItem } from './file-rules.js';
import { fileUploadHooks as hooks } from './file-upload-files.js';

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

/**
 * The command's accessible name: the owner's labelling elements or label, then the command's own
 * text, so the name keeps what the command shows.
 */
function nameCommand(naming: CommandNaming, id: string, text: string) {
  if (naming['aria-labelledby']) return { 'aria-labelledby': `${naming['aria-labelledby']} ${id}` };
  return naming['aria-label'] ? { 'aria-label': `${naming['aria-label']} ${text}` } : {};
}

async function readDirectory(item: DroppedDirectory): Promise<File[]> {
  const files: File[] = [];
  for await (const entry of item.getEntries()) {
    files.push(...(entry.kind === 'file' ? [await entry.getFile()] : await readDirectory(entry)));
  }
  return files;
}

/** The dropped files, in order, with every file inside dropped folders when they are accepted. */
export async function readDroppedFiles(
  items: readonly DroppedItem[],
  acceptDirectory: boolean,
): Promise<File[]> {
  const files: File[] = [];
  for (const item of items) {
    if (item.kind === 'file') files.push(await item.getFile());
    else if (acceptDirectory && item.kind === 'directory')
      files.push(...(await readDirectory(item)));
  }
  return files;
}

/** The kind and MIME type of each item of a native drag, all a drag tells before the drop. */
export function readDraggedItems(event: DragEvent): DraggedItem[] {
  return Array.from(event.dataTransfer?.items ?? [], ({ kind, type }) => ({ kind, type }));
}

/**
 * The drop zone: a React Aria `DropZone` with the upload glyph, the title, the description and a
 * Browse button. While a drag is over it, it says whether the dragged files would be accepted.
 */
export function DropZoneCommand(props: CommandProps) {
  const { label, hint, isDisabled, withChooser, receive, isDragAcceptable, acceptDirectory } =
    props;
  const strings = useUiStrings();
  const labelId = useId();
  const browseId = useId();
  const [isOver, setOver] = useState(false);
  return (
    <DropZone
      className={hooks.slotClass('dropzone')}
      isDisabled={isDisabled}
      aria-labelledby={labelId}
      onDropEnter={() => setOver(true)}
      onDropExit={() => setOver(false)}
      onDrop={(event) => {
        setOver(false);
        void readDroppedFiles(event.items, acceptDirectory).then(receive);
      }}
      data-drop-accept={(isOver && isDragAcceptable) || undefined}
      data-drop-reject={(isOver && !isDragAcceptable) || undefined}
    >
      <Icon glyph="upload" className={hooks.slotClass('icon')} />
      <span {...hooks.slot('label')} id={labelId}>
        {label}
      </span>
      {hint}
      {withChooser(
        <Button
          {...nameCommand(props.naming, browseId, strings.browse)}
          ref={props.commandRef}
          id={browseId}
          className={hooks.slotClass('browse')}
          size="sm"
          isDisabled={isDisabled}
          aria-describedby={[labelId, props.describedBy].filter(Boolean).join(' ')}
        >
          {strings.browse}
        </Button>,
      )}
    </DropZone>
  );
}

/** The `button` command: a Button with the upload glyph that opens the chooser, then the help. */
export function ButtonCommand(props: CommandProps) {
  const { label, hint, describedBy, isDisabled, withChooser, commandRef } = props;
  const id = useId();
  return (
    <>
      {withChooser(
        <Button
          {...nameCommand(props.naming, id, label)}
          ref={commandRef}
          id={id}
          startIcon="upload"
          isDisabled={isDisabled}
          aria-describedby={describedBy}
        >
          {label}
        </Button>,
      )}
      {hint}
    </>
  );
}
