import type { Key } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { IconButton } from '../icon-button/icon-button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { ProgressBar } from '../progress-bar/progress-bar.js';

/** A file the upload lists. The host performs the upload and reports its progress and error. */
export interface FileUploadItem {
  /** Unique among the listed files. */
  id: Key;
  name: string;
  /** In bytes. */
  size?: number | undefined;
  /** Percent uploaded, from 0 to 100, while the host uploads the file. */
  progress?: number | undefined;
  /** Why the upload failed. */
  error?: string | undefined;
}

/** Where a listed file stands, from its progress and error. */
type FileUploadStatus = 'selected' | 'uploading' | 'complete' | 'error';

export const fileUploadHooks = createHooks('file-upload', [
  'dropzone',
  'icon',
  'label',
  'description',
  'browse',
  'rejections',
  'files',
  'file',
  'file-name',
  'file-size',
  'file-progress',
  'file-error',
  'file-remove',
]);

const hooks = fileUploadHooks;

/** A listed file's status: failed, uploading, uploaded or only chosen. */
function getFileUploadStatus({ progress, error }: FileUploadItem): FileUploadStatus {
  if (error) return 'error';
  if (progress === undefined) return 'selected';
  return progress >= 100 ? 'complete' : 'uploading';
}

function FileRow({
  item,
  locale,
  onRemove,
}: {
  item: FileUploadItem;
  locale: string;
  onRemove: ((id: Key) => void) | undefined;
}) {
  const strings = useUiStrings();
  const status = getFileUploadStatus(item);
  return (
    <li {...hooks.slot('file', { status })}>
      <span {...hooks.slot('file-name')}>{item.name}</span>
      {item.size === undefined ? null : (
        <span {...hooks.slot('file-size')}>{formatBytes(item.size, locale)}</span>
      )}
      {status === 'uploading' ? (
        <ProgressBar
          className={hooks.slotClass('file-progress')}
          aria-label={item.name}
          value={item.progress}
          size="sm"
        />
      ) : null}
      {item.error ? (
        <InlineError className={hooks.slotClass('file-error')}>{item.error}</InlineError>
      ) : null}
      {onRemove ? (
        <IconButton
          className={hooks.slotClass('file-remove')}
          icon="close"
          label={strings.removeItem(item.name)}
          size="sm"
          onPress={() => onRemove(item.id)}
        />
      ) : null}
    </li>
  );
}

export interface FileUploadFilesProps {
  /** Names the list. */
  label: string;
  files: readonly FileUploadItem[];
  locale: string;
  onRemove: ((id: Key) => void) | undefined;
}

/** The listed files, each with its size, upload progress or error, and a remove button. */
export function FileUploadFiles({ label, files, locale, onRemove }: FileUploadFilesProps) {
  return (
    <ul {...hooks.slot('files')} aria-label={label}>
      {files.map((item) => (
        <FileRow key={item.id} item={item} locale={locale} onRemove={onRemove} />
      ))}
    </ul>
  );
}
