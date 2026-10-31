'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { RemovalFocus } from '../../utils/use-removal-focus.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import { ProgressBar } from '../progress-bar/progress-bar.js';

/** How a listed file differs from a list the owner compares against: `added` by an edit. */
export type FileUploadChange = 'added';

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
  /** The MIME type, for a file that has no `file` here; it picks the glyph of a file without a thumbnail. */
  type?: string | undefined;
  /** Marks a file an edit added to a list the owner compares against. */
  change?: FileUploadChange | undefined;
}

/** What each listed file draws besides its name, size, progress and error. */
interface FileUploadRowOptions {
  locale: string;
  onRemove: ((id: Key) => void) | undefined;
  removalFocus: RemovalFocus;
  /** Disables the remove buttons. */
  isDisabled: boolean;
  renderFileActions: ((file: FileUploadItem) => ReactNode) | undefined;
  renderFilePreview: ((file: FileUploadItem) => ReactNode) | undefined;
}

interface FileUploadFilesProps extends FileUploadRowOptions {
  /** Names the list. */
  label: string;
  files: readonly FileUploadItem[];
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
  'file-media',
  'file-icon',
  'file-name',
  'file-size',
  'file-progress',
  'file-error',
  'file-actions',
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
  const url = useMemo(
    () =>
      file?.type.startsWith('image/') && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(file)
        : undefined,
    [file],
  );
  // Revoked a microtask after cleanup: a remount of the same URL (Strict Mode) cancels it.
  const revoking = useRef<string | null>(null);
  useEffect(() => {
    if (url === undefined) return undefined;
    if (revoking.current === url) revoking.current = null;
    return () => {
      revoking.current = url;
      queueMicrotask(() => {
        if (revoking.current === url) URL.revokeObjectURL(url);
      });
    };
  }, [url]);
  return url;
}

/**
 * The caller's preview, else the thumbnail of an image file, else the glyph of the file's type. All
 * of them sit beside the file's name, so the built-in ones are decorative.
 */
function FilePreview({
  item,
  renderFilePreview,
}: {
  item: FileUploadItem;
  renderFilePreview: FileUploadRowOptions['renderFilePreview'];
}) {
  const url = useImageUrl(item.file) ?? item.previewUrl;
  const custom = renderFilePreview?.(item);
  if (!isEmptyNode(custom)) return <div {...hooks.slot('file-media')}>{custom}</div>;
  if (url) return <img {...hooks.slot('file-preview')} src={url} alt="" />;
  return (
    <Icon
      icon={getFileGlyph(item.type ?? item.file?.type)}
      className={hooks.slotClass('file-icon')}
    />
  );
}

function FileRow({ item, options }: { item: FileUploadItem; options: FileUploadRowOptions }) {
  const strings = useUiStrings();
  const { locale, onRemove, renderFileActions } = options;
  const status = getFileUploadStatus(item);
  const actions = renderFileActions?.(item);
  return (
    <li {...hooks.slot('file', { status, change: item.change })}>
      <FilePreview item={item} renderFilePreview={options.renderFilePreview} />
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
      {isEmptyNode(actions) ? null : <span {...hooks.slot('file-actions')}>{actions}</span>}
      {onRemove ? (
        <Button
          className={hooks.slotClass('file-remove')}
          icon={CloseGlyph}
          label={strings.removeItem(item.name)}
          size="sm"
          isDisabled={options.isDisabled}
          ref={(button) => options.removalFocus.register(item.id, button)}
          onPress={() => {
            options.removalFocus.willRemove(item.id);
            onRemove(item.id);
          }}
        />
      ) : null}
    </li>
  );
}

/** The listed files, each with its preview, size, upload progress or error, actions and remove button. */
export function FileUploadFiles({ label, files, ...options }: FileUploadFilesProps) {
  return (
    <ul {...hooks.slot('files')} aria-label={label}>
      {files.map((item) => (
        <FileRow key={toKeyIdentity(item.id)} item={item} options={options} />
      ))}
    </ul>
  );
}
