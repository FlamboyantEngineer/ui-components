import { useEffect, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
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
  /** The chosen file: an image shows as a thumbnail, and a form submits it under the upload's `name`. */
  file?: File | undefined;
  /** A thumbnail for a file that has no `file` here, such as one uploaded earlier. */
  previewUrl?: string | undefined;
}

export interface FileUploadFilesProps {
  /** Names the list. */
  label: string;
  files: readonly FileUploadItem[];
  locale: string;
  onRemove: ((id: Key) => void) | undefined;
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
  'error',
  'files',
  'file',
  'file-preview',
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

/** A temporary URL for an image file, revoked when the file changes or the row goes. */
function useImageUrl(file: File | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!file?.type.startsWith('image/') || typeof URL.createObjectURL !== 'function') {
      setUrl(undefined);
      return undefined;
    }
    const created = URL.createObjectURL(file);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [file]);
  return url;
}

/** The thumbnail of an image file, beside its name, so it is decorative. */
function FilePreview({ item }: { item: FileUploadItem }) {
  const url = useImageUrl(item.file) ?? item.previewUrl;
  return url ? <img {...hooks.slot('file-preview')} src={url} alt="" /> : null;
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
      <FilePreview item={item} />
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
