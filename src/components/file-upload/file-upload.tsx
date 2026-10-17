import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { FileTrigger, useLocale, type FileTriggerProps, type Key } from 'react-aria-components';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { formatMetaLine } from '../meta-line/meta-line.js';
import {
  canAcceptDrag,
  partitionFiles,
  type FilePartition,
  type FileRejection,
  type FileRules,
} from './file-rules.js';
import { DropZoneCommand, readDraggedItems, type CommandProps } from './file-upload-drop.js';
import {
  FileUploadFiles,
  fileUploadHooks as hooks,
  type FileUploadItem,
} from './file-upload-files.js';
import { useFileForm } from './file-upload-form.js';

/** `button` is one command among others; `dropzone` is a drop target that also offers Browse. */
export type FileUploadVariant = 'button' | 'dropzone';

export interface FileUploadProps
  extends BaseProps, FileRules, Pick<FileTriggerProps, 'allowsMultiple' | 'acceptDirectory'> {
  /** The command's text: the button label, or the drop zone's title. */
  label: string;
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
  ];
  const reasons = rejections.flatMap(({ file, reason, message }) =>
    reason === 'invalid' ? [strings.rejectedFileReason(file.name, message ?? '')] : [],
  );
  return [...counts, ...reasons].filter(Boolean).join(' ');
}

/**
 * Checks offered files, reports the refusals and hands on the accepted ones, and judges a drag
 * before the drop. `held` files are listed already.
 */
function useFileIntake(props: FileUploadProps, held: number) {
  const { allowsMultiple, acceptDirectory, onSelect, onReject } = props;
  const { acceptedFileTypes, maxSize, minSize, maxFiles, validate } = props;
  const rules: FileRules = { acceptedFileTypes, maxSize, minSize, maxFiles, validate };
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [isDragAcceptable, setDragAcceptable] = useState(true);
  const isMultiple = Boolean(allowsMultiple || acceptDirectory);
  const report = (result: FilePartition) => {
    setRejections(result.rejections);
    if (result.rejections.length > 0) onReject?.(result.rejections);
    if (result.accepted.length > 0) onSelect(result.accepted);
  };
  return {
    rejections,
    isDragAcceptable,
    receive(offered: readonly File[]) {
      const outcome = partitionFiles(isMultiple ? offered : offered.slice(0, 1), rules, held);
      if (outcome instanceof Promise) void outcome.then(report);
      else report(outcome);
    },
    onDragEnter(event: DragEvent) {
      const items = readDraggedItems(event);
      setDragAcceptable(canAcceptDrag(isMultiple ? items : items.slice(0, 1), rules, held));
    },
  };
}

function ButtonCommand({
  label,
  hint,
  describedBy,
  isDisabled,
  withChooser,
  commandRef,
}: CommandProps) {
  return (
    <>
      {withChooser(
        <Button
          ref={commandRef}
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

/**
 * Chooses files or folders from the system file chooser or by drag and drop, checks them against
 * the accepted types, the size and count limits and the caller's own check, and hands the accepted
 * ones to `onSelect`. Refusals are reported below the command and to `onReject`; a drag says
 * whether it would be accepted. Listed files show image thumbnails and the upload progress and
 * errors the host reports, and can take part in a form under `name`.
 */
export function FileUpload(props: FileUploadProps) {
  const { label, description, variant = 'button', files = [], className, id } = props;
  const { allowsMultiple, acceptDirectory = false, isDisabled = false } = props;
  const strings = useUiStrings();
  const { locale } = useLocale();
  const hintId = useId();
  const commandRef = useRef<HTMLButtonElement>(null);
  const intake = useFileIntake(props, files.length);
  const form = useFileForm({ ...props, files, commandRef });
  const hint = description ?? defaultDescription(props, strings, locale);
  const command: CommandProps = {
    label,
    hint: hint ? (
      <span {...hooks.slot('description')} id={hintId}>
        {hint}
      </span>
    ) : null,
    describedBy:
      [hint && hintId, form.error && form.errorId].filter(Boolean).join(' ') || undefined,
    isDisabled,
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
    commandRef,
  };
  const data = {
    variant,
    disabled: isDisabled,
    required: props.isRequired,
    invalid: form.isInvalid,
  };
  return (
    <div
      {...hooks.root({ className, props, data })}
      id={id}
      onDragEnterCapture={intake.onDragEnter}
    >
      {variant === 'button' ? <ButtonCommand {...command} /> : <DropZoneCommand {...command} />}
      {form.message}
      {intake.rejections.length > 0 ? (
        <InlineError className={hooks.slotClass('rejections')}>
          {rejectionMessage(intake.rejections, strings)}
        </InlineError>
      ) : null}
      {files.length > 0 ? (
        <FileUploadFiles label={label} files={files} locale={locale} onRemove={props.onRemove} />
      ) : null}
      {form.input}
    </div>
  );
}

export type { FileRejection, FileRejectionReason, FileValidator } from './file-rules.js';

export type { FileUploadItem } from './file-upload-files.js';
