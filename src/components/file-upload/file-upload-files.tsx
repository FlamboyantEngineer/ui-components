import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { IconButton } from '../icon-button/icon-button.js';
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

/** Keeps keyboard focus in the upload when the row of a pressed remove button leaves the list. */
export interface RemovalFocus {
  /** Records a file's remove button, or its removal with `null`. */
  register: (id: Key, button: HTMLElement | null) => void;
  /** Records a press on a file's remove button, before `onRemove` runs. */
  willRemove: (id: Key) => void;
}

/** What each listed file draws besides its name, size, progress and error. */
export interface FileUploadRowOptions {
  locale: string;
  onRemove: ((id: Key) => void) | undefined;
  removalFocus: RemovalFocus;
  /** Disables the remove buttons. */
  isDisabled: boolean;
  renderFileActions: ((file: FileUploadItem) => ReactNode) | undefined;
  renderFilePreview: ((file: FileUploadItem) => ReactNode) | undefined;
}

export interface FileUploadFilesProps extends FileUploadRowOptions {
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
      glyph={getFileGlyph(item.type ?? item.file?.type)}
      className={hooks.slotClass('file-icon')}
    />
  );
}

/** The listed file the focus moves to when `removed` leaves the list: the next one, else the previous one. */
function findNeighbour(order: readonly string[], removed: string, listed: ReadonlySet<string>) {
  const at = order.indexOf(removed);
  const next = order.slice(at + 1).find((id) => listed.has(id));
  return next ?? order.slice(0, at).findLast((id) => listed.has(id));
}

/**
 * After the row of a pressed remove button leaves `files`, and the focus left with it, focuses the
 * next file's remove button, else the previous one's, else the command, so a keyboard or screen
 * reader user keeps their place.
 */
export function useRemovalFocus(
  files: readonly FileUploadItem[],
  commandRef: RefObject<HTMLElement | null>,
): RemovalFocus {
  const buttons = useRef(new Map<string, HTMLElement>());
  const removal = useRef<{ id: string; order: string[] } | null>(null);
  useLayoutEffect(() => {
    const pending = removal.current;
    const listed = new Set(files.map((item) => toKeyIdentity(item.id)));
    if (!pending || listed.has(pending.id)) return;
    removal.current = null;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const neighbour = findNeighbour(pending.order, pending.id, listed);
    (neighbour === undefined ? commandRef.current : buttons.current.get(neighbour))?.focus();
  }, [files, commandRef]);
  return {
    register(id, button) {
      if (button) buttons.current.set(toKeyIdentity(id), button);
      else buttons.current.delete(toKeyIdentity(id));
    },
    willRemove(id) {
      removal.current = {
        id: toKeyIdentity(id),
        order: files.map((item) => toKeyIdentity(item.id)),
      };
    },
  };
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
        <IconButton
          className={hooks.slotClass('file-remove')}
          icon="close"
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
