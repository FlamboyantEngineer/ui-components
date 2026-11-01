'use client';

import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { FileTrigger, useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useLatest } from '../../utils/use-latest.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { InlineError } from '../inline-error/inline-error.js';
import { formatMetaLine } from '../meta-line/meta-line.js';
import {
  canAcceptDrag,
  partitionFiles,
  type FilePartition,
  type FileRejection,
  type FileRules,
} from './file-rules.js';
import {
  ButtonCommand,
  DropZoneCommand,
  readDraggedItems,
  type CommandProps,
} from './file-upload-drop.js';
import {
  FileUploadFiles,
  fileUploadHooks as hooks,
  type FileUploadItem,
} from './file-upload-files.js';
import { useFileForm } from './file-upload-form.js';

/** `button` is one command among others; `dropzone` is a drop target that also offers Browse. */
export type FileUploadVariant = 'button' | 'dropzone';

export interface FileUploadProps
  extends
    BaseProps,
    FileRules,
    Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby' | 'aria-describedby'> {
  /** The command's text: the button label, or the drop zone's title. */
  label: string;
  /** Takes several files at once from the chooser and a drop. */
  allowsMultiple?: boolean | undefined;
  /** The chooser picks a folder, and a dropped folder is read for its files; implies several files. */
  acceptDirectory?: boolean | undefined;
  /** Help below the command. Defaults to the accepted types and the size and count limits. */
  description?: ReactNode;
  /** Defaults to `button`. */
  variant?: FileUploadVariant | undefined;
  /** Receives the chosen or dropped files that pass the rules. */
  onSelect: (files: File[]) => void;
  /** Receives the chosen or dropped files that were refused, and why. */
  onReject?: ((rejections: FileRejection[]) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Files to list below the command, with their upload progress or error. */
  files?: readonly FileUploadItem[] | undefined;
  /** Shows a remove button on each listed file. */
  onRemove?: ((id: Key) => void) | undefined;
  /** Submits the listed files' `file`s with a form under this name. */
  name?: string | undefined;
  /** A form submit is refused while no file is listed. */
  isRequired?: boolean | undefined;
  /** Shows `errorMessage` and marks the upload invalid. */
  isInvalid?: boolean | undefined;
  /** Why the upload is invalid, shown while `isInvalid`. */
  errorMessage?: ReactNode;
  /** Lists the files without the command and remove buttons, keeping their previews and actions. */
  isReadOnly?: boolean | undefined;
  /** The button that opens the chooser (the drop zone's Browse button), for an owner that focuses it. */
  commandRef?: Ref<HTMLButtonElement> | undefined;
  /** The id of that button, for an owner's label that names it. `id` is the root's. */
  commandId?: string | undefined;
  /** Trailing actions of a listed file, such as open or download links. */
  renderFileActions?: ((file: FileUploadItem) => ReactNode) | undefined;
  /** Replaces the thumbnail of a listed file, such as with an audio or video player; nothing keeps it. */
  renderFilePreview?: ((file: FileUploadItem) => ReactNode) | undefined;
}

function defaultDescription(rules: FileRules, strings: UiStrings, locale: string): string {
  const size = rules.maxSize ? strings.fileSizeLimit(formatBytes(rules.maxSize, locale)) : '';
  const count = rules.maxFiles ? strings.fileCountLimit(rules.maxFiles) : '';
  return formatMetaLine([rules.acceptedFileTypes?.join(', '), size, count]);
}

function rejectionMessage(rejections: readonly FileRejection[], strings: UiStrings): string {
  const counted = (reason: FileRejection['reason']) =>
    rejections.filter((rejection) => rejection.reason === reason).length;
  const counts = [
    counted('type') && strings.rejectedFileType(counted('type')),
    counted('size') && strings.rejectedFileSize(counted('size')),
    counted('min-size') && strings.rejectedFileSmall(counted('min-size')),
    counted('count') && strings.rejectedFileCount(counted('count')),
    counted('unchecked') && strings.rejectedFileUnchecked(counted('unchecked')),
  ];
  const reasons = rejections.flatMap(({ file, reason, message }) =>
    reason === 'invalid' ? [strings.rejectedFileReason(file.name, message ?? '')] : [],
  );
  return [...counts, ...reasons].filter(Boolean).join(' ');
}

/**
 * Checks offered files, reports the refusals and hands on the accepted ones, and judges a drag
 * before the drop. `listed` are the owner's files. Files handed on stay counted against `maxFiles`
 * until the owner gives a new `files` list, however often the upload renders itself, so offers
 * made before the owner lists them never pass the limit together. An offer made while an earlier
 * one still waits for `validate` is checked once the earlier one is handed on, and the latest
 * offer's refusals are the ones shown. Offers still waiting when the upload unmounts or becomes
 * disabled or read-only are abandoned: they call nothing and show nothing.
 */
function useFileIntake(props: FileUploadProps, listed: readonly FileUploadItem[]) {
  const held = listed.length;
  const { allowsMultiple, acceptDirectory, isDisabled, isReadOnly } = props;
  const { acceptedFileTypes, maxSize, minSize, maxFiles, validate } = props;
  const rules: FileRules = { acceptedFileTypes, maxSize, minSize, maxFiles, validate };
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [isDragAcceptable, setDragAcceptable] = useState(true);
  const count = useRef({ held, accepted: 0 });
  const queue = useRef<Promise<void> | null>(null);
  // The intake's current lifetime; offers made in an earlier one are abandoned.
  const lifetime = useRef({});
  const callbacks = useLatest({ onSelect: props.onSelect, onReject: props.onReject });
  const isLocked = Boolean(isDisabled || isReadOnly);
  // A new list is the owner's answer to the files handed on: listed, refused or removed.
  useLayoutEffect(() => {
    count.current = { held, accepted: 0 };
  }, [listed, held]);
  useLayoutEffect(() => {
    if (!isLocked) return undefined;
    lifetime.current = {};
    queue.current = null;
    return undefined;
  }, [isLocked]);
  useLayoutEffect(
    () => () => {
      lifetime.current = {};
      queue.current = null;
    },
    [],
  );
  const isMultiple = Boolean(allowsMultiple || acceptDirectory);
  const report = (result: FilePartition) => {
    count.current.accepted += result.accepted.length;
    setRejections(result.rejections);
    if (result.rejections.length > 0) callbacks.current.onReject?.(result.rejections);
    if (result.accepted.length > 0) callbacks.current.onSelect(result.accepted);
  };
  const judge = (offered: readonly File[], owner: object): Promise<void> | undefined => {
    if (owner !== lifetime.current) return undefined;
    const outcome = partitionFiles(offered, rules, count.current.held + count.current.accepted);
    if (!(outcome instanceof Promise)) {
      report(outcome);
      return undefined;
    }
    return outcome.then((result) => {
      if (owner === lifetime.current) report(result);
    });
  };
  return {
    rejections,
    isDragAcceptable,
    receive(offered: readonly File[]) {
      if (isLocked) return;
      const files = isMultiple ? offered : offered.slice(0, 1);
      const owner = lifetime.current;
      const run = () => judge(files, owner);
      const outcome = queue.current ? queue.current.then(run, run) : run();
      if (!outcome) return;
      const settled: Promise<void> = outcome.finally(() => {
        if (queue.current === settled) queue.current = null;
      });
      queue.current = settled;
    },
    onDragEnter(event: DragEvent) {
      const items = readDraggedItems(event);
      setDragAcceptable(canAcceptDrag(isMultiple ? items : items.slice(0, 1), rules, held));
    },
  };
}

/**
 * The command's props: its label and naming, its description (by default the accepted types and
 * limits) and error, the chooser and the intake, and its button ref, shared with the owner's.
 */
function useFileCommand(
  props: FileUploadProps,
  intake: ReturnType<typeof useFileIntake>,
  form: { error: boolean; errorId: string; commandRef: RefObject<HTMLButtonElement | null> },
): CommandProps {
  const { label, description, allowsMultiple, acceptDirectory = false } = props;
  const strings = useUiStrings();
  const { locale } = useLocale();
  const hintId = useId();
  const ownerRef = props.commandRef;
  const { commandRef } = form;
  const mergedRef = useMemo(() => mergeRefs(commandRef, ownerRef), [commandRef, ownerRef]);
  const hint = description ?? defaultDescription(props, strings, locale);
  return {
    label,
    naming: { 'aria-label': props['aria-label'], 'aria-labelledby': props['aria-labelledby'] },
    hint: hint ? (
      <span {...hooks.slot('description')} id={hintId}>
        {hint}
      </span>
    ) : null,
    describedBy:
      [hint && hintId, form.error && form.errorId, props['aria-describedby']]
        .filter(Boolean)
        .join(' ') || undefined,
    isDisabled: props.isDisabled ?? false,
    withChooser: (button) => (
      <FileTrigger
        acceptedFileTypes={props.acceptedFileTypes}
        allowsMultiple={allowsMultiple || acceptDirectory}
        acceptDirectory={acceptDirectory}
        onSelect={(list) => intake.receive(list ? Array.from(list) : [])}
      >
        {button}
      </FileTrigger>
    ),
    receive: intake.receive,
    isDragAcceptable: intake.isDragAcceptable,
    acceptDirectory,
    commandRef: mergedRef,
    commandId: props.commandId,
  };
}

const noFiles: readonly FileUploadItem[] = [];

/**
 * Chooses files or folders from the system file chooser or by drag and drop, checks them against
 * the accepted types, the size and count limits and the caller's own check, and hands the accepted
 * ones to `onSelect`. Refusals are reported below the command and to `onReject`; a drag says
 * whether it would be accepted. Listed files show image thumbnails or type glyphs, the upload
 * progress and errors the host reports and the owner's actions, and can take part in a form under
 * `name`.
 */
export function FileUpload(props: FileUploadProps) {
  const { variant = 'button', files = noFiles, className, id, isReadOnly } = props;
  const strings = useUiStrings();
  const { locale } = useLocale();
  const commandRef = useRef<HTMLButtonElement>(null);
  const intake = useFileIntake(props, files);
  const form = useFileForm({ ...props, files, commandRef });
  const command = useFileCommand(props, intake, { ...form, commandRef });
  const removalFocus = useRemovalFocus(files, commandRef);
  const data = {
    variant,
    disabled: props.isDisabled,
    readonly: isReadOnly,
    required: props.isRequired,
    invalid: form.isInvalid,
  };
  const Command = variant === 'button' ? ButtonCommand : DropZoneCommand;
  return (
    <div
      {...hooks.root({ className, props, data })}
      id={id}
      onDragEnterCapture={intake.onDragEnter}
    >
      {isReadOnly ? null : <Command {...command} />}
      {form.message}
      {intake.rejections.length > 0 && !isReadOnly ? (
        <InlineError className={hooks.slotClass('rejections')}>
          {rejectionMessage(intake.rejections, strings)}
        </InlineError>
      ) : null}
      {files.length > 0 ? (
        <FileUploadFiles
          label={props.label}
          files={files}
          locale={locale}
          onRemove={isReadOnly ? undefined : props.onRemove}
          isDisabled={props.isDisabled ?? false}
          removalFocus={removalFocus}
          renderFileActions={props.renderFileActions}
          renderFilePreview={props.renderFilePreview}
        />
      ) : null}
      {form.input}
    </div>
  );
}

export type { FileRejection, FileRejectionReason, FileValidator } from './file-rules.js';

export type { FileUploadChange, FileUploadItem } from './file-upload-files.js';
