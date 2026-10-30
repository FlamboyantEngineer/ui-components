import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { CopyButton } from '../copy-button/copy-button.js';
import type { IconSource } from '../icon/icon.js';
import { InlineEdit } from '../inline-edit/inline-edit.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { RecordLabel } from '../record-label/record-label.js';
import { useHeadingLevel, type HeadingLevel } from '../section-header/section-header.js';

export interface RecordHeaderProps extends BaseProps {
  /** The record's identifier, such as `REQ-12`, shown with a button that copies it. */
  identifier: string;
  /** A icon component or rendered element for the record's kind, before the identifier. Decorative. */
  icon?: IconSource;
  /** The record's title. */
  title: string;
  /**
   * Makes the title editable in place and saves a changed title. A returned promise keeps the
   * editor pending until it settles; a rejection keeps it open with the rejection's message.
   */
  onTitleChange?: ((title: string) => void | Promise<unknown>) | undefined;
  /** Shown while the editable title is empty. */
  titlePlaceholder?: ReactNode;
  /** The title's heading level. Defaults to one below the enclosing section's, else 3. */
  headingLevel?: HeadingLevel | undefined;
  /** The record's state, such as a `Badge`, a `StatusLight` or a `TransitionMenu`. */
  status?: ReactNode;
  /** Metadata entries, such as an `Attribution`, joined into one `MetaLine`. */
  meta?: readonly ReactNode[] | undefined;
  /** The record's actions, such as an `ActionRow`. */
  actions?: ReactNode;
}

const hooks = createHooks('record-header', [
  'identity',
  'label',
  'copy',
  'title',
  'status',
  'meta',
  'actions',
]);

/**
 * A record's title row: its kind icon and identifier with a copy button, its title, editable in
 * place, its state, a line of metadata and its actions.
 */
export function RecordHeader({
  identifier,
  icon,
  title,
  onTitleChange,
  titlePlaceholder,
  headingLevel,
  status,
  meta,
  actions,
  className,
  id,
  ...rest
}: RecordHeaderProps) {
  const strings = useUiStrings();
  const level = useHeadingLevel(headingLevel);
  const Heading = `h${level}` as const;
  return (
    <div id={id} {...hooks.root({ className, props: rest, data: { editable: !!onTitleChange } })}>
      <div {...hooks.slot('identity')}>
        <RecordLabel
          identifier={identifier}
          icon={icon}
          size="sm"
          className={hooks.slotClass('label')}
        />
        <CopyButton
          value={identifier}
          label={strings.copyIdentifier(identifier)}
          size="sm"
          className={hooks.slotClass('copy')}
        />
      </div>
      {onTitleChange ? (
        // An editor is not phrasing content, so an editable title is a heading by role. It is named
        // by the title alone, not by the edit button's instruction it holds.
        <div
          role="heading"
          aria-level={level}
          aria-label={title === '' ? undefined : title}
          {...hooks.slot('title')}
        >
          <InlineEdit
            label={strings.recordTitle}
            value={title}
            onSave={onTitleChange}
            placeholder={titlePlaceholder}
          />
        </div>
      ) : (
        <Heading {...hooks.slot('title')}>{title}</Heading>
      )}
      {isEmptyNode(status) ? null : <div {...hooks.slot('status')}>{status}</div>}
      {meta ? <MetaLine items={meta} className={hooks.slotClass('meta')} /> : null}
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </div>
  );
}
