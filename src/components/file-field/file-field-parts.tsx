import type { ReactNode } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { FieldPreviousValue } from '../field/field.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
import type { FileFieldItem } from './file-field-changes.js';

export const fileFieldHooks = createHooks('file-field', ['upload', 'download', 'removed']);

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
      <Icon glyph="download" />
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

/** The committed files an edit removed, each with a button that puts it back. */
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
  return removed.map((item) => (
    <FieldPreviousValue
      key={toKeyIdentity(item.id)}
      className={hooks.slotClass('removed')}
      restoreLabel={item.name}
      isDisabled={isDisabled}
      onRestore={() => onRestore(item)}
    >
      {item.name}
    </FieldPreviousValue>
  ));
}

/** Hidden inputs that submit each held file's id under the form name; a disabled field submits none. */
export function FileFieldInputs({
  name,
  value,
  isDisabled,
}: {
  name: string;
  value: readonly FileFieldItem[];
  isDisabled: boolean;
}) {
  return value.map((item) => (
    <input
      key={toKeyIdentity(item.id)}
      type="hidden"
      name={name}
      value={item.id}
      disabled={isDisabled}
    />
  ));
}
