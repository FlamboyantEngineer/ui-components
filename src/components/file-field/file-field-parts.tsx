'use client';

import { DownloadGlyph } from '../../core/glyphs.js';
import { useId, type ReactNode } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { FieldPreviousValue } from '../field/field.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
import type { FileFieldItem } from './file-field-changes.js';

export const fileFieldHooks = createHooks('file-field', [
  'upload',
  'download',
  'removed-files',
  'removed-label',
  'removed',
]);

const hooks = fileFieldHooks;

/** A link that downloads a held file under its name. */
function FileDownloadLink({ item, href }: { item: FileFieldItem; href: string }) {
  const strings = useUiStrings();
  return (
    <Link
      className={hooks.slotClass('download')}
      href={href}
      download={item.name}
      aria-label={strings.downloadFile(item.name)}
      isStandalone
    >
      <Icon icon={DownloadGlyph} />
    </Link>
  );
}

/**
 * A held file's actions: its download link, then the caller's. With neither it returns nothing, so
 * the upload draws no actions part.
 */
export function renderFileFieldActions(
  item: FileFieldItem,
  renderFileActions: ((file: FileFieldItem) => ReactNode) | undefined,
): ReactNode {
  const custom = renderFileActions?.(item);
  if (!item.downloadUrl && isEmptyNode(custom)) return null;
  return (
    <>
      {item.downloadUrl ? <FileDownloadLink item={item} href={item.downloadUrl} /> : null}
      {custom}
    </>
  );
}

/**
 * The committed files an edit removed, in a titled group below the held files, each with a button
 * that puts it back. Without removed files it renders nothing.
 */
export function RemovedFiles({
  removed,
  isDisabled,
  onRestore,
}: {
  removed: readonly FileFieldItem[];
  /** The field is locked or full: removed files cannot go back. */
  isDisabled: boolean;
  onRestore: (item: FileFieldItem) => void;
}) {
  const strings = useUiStrings();
  const labelId = useId();
  if (removed.length === 0) return null;
  return (
    <div {...hooks.slot('removed-files')} role="group" aria-labelledby={labelId}>
      <span {...hooks.slot('removed-label')} id={labelId}>
        {strings.removedFiles}
      </span>
      {removed.map((item) => (
        <FieldPreviousValue
          key={toKeyIdentity(item.id)}
          className={hooks.slotClass('removed')}
          restoreLabel={item.name}
          isDisabled={isDisabled}
          onRestore={() => onRestore(item)}
        >
          {item.name}
        </FieldPreviousValue>
      ))}
    </div>
  );
}
