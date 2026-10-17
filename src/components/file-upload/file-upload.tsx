import { useId, useState, type ReactElement, type ReactNode } from 'react';
import {
  DropZone,
  FileTrigger,
  isFileDropItem,
  useLocale,
  type DropItem,
  type FileTriggerProps,
  type Key,
} from 'react-aria-components';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import { formatMetaLine } from '../meta-line/meta-line.js';
import { partitionFiles, type FileRejection, type FileRules } from './file-rules.js';
import {
  FileUploadFiles,
  fileUploadHooks as hooks,
  type FileUploadItem,
} from './file-upload-files.js';

/** `button` is one command among others; `dropzone` is a drop target that also offers Browse. */
export type FileUploadVariant = 'button' | 'dropzone';

export interface FileUploadProps
  extends BaseProps, FileRules, Pick<FileTriggerProps, 'allowsMultiple'> {
  /** The command's text: the button label, or the drop zone's title. */
  label: string;
  /** Help below the command. Defaults to the accepted types and the size limit. */
  description?: ReactNode;
  /** Defaults to `button`. */
  variant?: FileUploadVariant | undefined;
  /** Receives the chosen or dropped files that pass the type and size rules. */
  onSelect: (files: File[]) => void;
  /** Receives the chosen or dropped files that were refused, and why. */
  onReject?: ((rejections: FileRejection[]) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Files to list below the command, with their upload progress or error. */
  files?: readonly FileUploadItem[] | undefined;
  /** Shows a remove button on each listed file. */
  onRemove?: ((id: Key) => void) | undefined;
}

type IntakeOptions = FileRules & Pick<FileUploadProps, 'allowsMultiple' | 'onSelect' | 'onReject'>;

interface CommandProps {
  label: string;
  /** The description element, if any. */
  hint: ReactNode;
  hintId: string | undefined;
  isDisabled: boolean;
  /** Wraps a button so pressing it opens the system file chooser. */
  withChooser: (button: ReactElement) => ReactElement;
  receive: (files: readonly File[]) => void;
}

function defaultDescription(rules: FileRules, strings: UiStrings, locale: string): string {
  const size = rules.maxSize ? strings.fileSizeLimit(formatBytes(rules.maxSize, locale)) : '';
  return formatMetaLine([rules.acceptedFileTypes?.join(', '), size]);
}

function rejectionMessage(rejections: readonly FileRejection[], strings: UiStrings): string {
  const types = rejections.filter(({ reason }) => reason === 'type').length;
  const sizes = rejections.length - types;
  return [types && strings.rejectedFileType(types), sizes && strings.rejectedFileSize(sizes)]
    .filter(Boolean)
    .join(' ');
}

async function readDroppedFiles(items: readonly DropItem[]): Promise<File[]> {
  return Promise.all(items.filter(isFileDropItem).map((item) => item.getFile()));
}

/** Checks offered files, reports the refusals and hands on the accepted ones. */
function useFileIntake({ allowsMultiple, onSelect, onReject, ...rules }: IntakeOptions) {
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const receive = (chosen: readonly File[]) => {
    const result = partitionFiles(allowsMultiple ? chosen : chosen.slice(0, 1), rules);
    setRejections(result.rejections);
    if (result.rejections.length > 0) onReject?.(result.rejections);
    if (result.accepted.length > 0) onSelect(result.accepted);
  };
  return { rejections, receive };
}

function ButtonCommand({ label, hint, hintId, isDisabled, withChooser }: CommandProps) {
  return (
    <>
      {withChooser(
        <Button startIcon="upload" isDisabled={isDisabled} aria-describedby={hintId}>
          {label}
        </Button>,
      )}
      {hint}
    </>
  );
}

function DropZoneCommand({ label, hint, isDisabled, withChooser, receive }: CommandProps) {
  const strings = useUiStrings();
  const labelId = useId();
  return (
    <DropZone
      className={hooks.slotClass('dropzone')}
      isDisabled={isDisabled}
      aria-labelledby={labelId}
      onDrop={(event) => void readDroppedFiles(event.items).then(receive)}
    >
      <Icon glyph="upload" className={hooks.slotClass('icon')} />
      <span {...hooks.slot('label')} id={labelId}>
        {label}
      </span>
      {hint}
      {withChooser(
        <Button
          className={hooks.slotClass('browse')}
          size="sm"
          isDisabled={isDisabled}
          aria-describedby={labelId}
        >
          {strings.browse}
        </Button>,
      )}
    </DropZone>
  );
}

/**
 * Chooses files from the system file chooser or by drag and drop, checks them against the accepted
 * types and the size limit, and hands the accepted ones to `onSelect`. Refusals are reported below
 * the command and to `onReject`. Listed files show the upload progress and errors the host reports.
 */
export function FileUpload({
  label,
  description,
  variant = 'button',
  acceptedFileTypes,
  allowsMultiple = false,
  maxSize,
  onSelect,
  onReject,
  isDisabled = false,
  files = [],
  onRemove,
  className,
  id,
  ...rest
}: FileUploadProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const hintId = useId();
  const intake = useFileIntake({ acceptedFileTypes, maxSize, allowsMultiple, onSelect, onReject });
  const hint = description ?? defaultDescription({ acceptedFileTypes, maxSize }, strings, locale);
  const command: CommandProps = {
    label,
    hint: hint ? (
      <span {...hooks.slot('description')} id={hintId}>
        {hint}
      </span>
    ) : null,
    hintId: hint ? hintId : undefined,
    isDisabled,
    withChooser: (button) => (
      <FileTrigger
        acceptedFileTypes={acceptedFileTypes}
        allowsMultiple={allowsMultiple}
        onSelect={(list) => intake.receive(list ? Array.from(list) : [])}
      >
        {button}
      </FileTrigger>
    ),
    receive: intake.receive,
  };
  const data = { variant, disabled: isDisabled };
  return (
    <div {...hooks.root({ className, props: rest, data })} id={id}>
      {variant === 'button' ? <ButtonCommand {...command} /> : <DropZoneCommand {...command} />}
      {intake.rejections.length > 0 ? (
        <InlineError className={hooks.slotClass('rejections')}>
          {rejectionMessage(intake.rejections, strings)}
        </InlineError>
      ) : null}
      {files.length > 0 ? (
        <FileUploadFiles label={label} files={files} locale={locale} onRemove={onRemove} />
      ) : null}
    </div>
  );
}

export type { FileRejection, FileRejectionReason } from './file-rules.js';

export type { FileUploadItem } from './file-upload-files.js';
