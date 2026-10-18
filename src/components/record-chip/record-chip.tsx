import { Fragment, useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { IconButton } from '../icon-button/icon-button.js';
import { RecordLabel, type RecordLabelProps } from '../record-label/record-label.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

/** `inline` keeps the chip on one line in running text; `stacked` puts the name on a second line. */
export type RecordChipLayout = 'inline' | 'stacked';

export interface RecordChipProps
  extends
    BaseProps,
    Pick<
      RecordLabelProps,
      'identifier' | 'name' | 'icon' | 'size' | 'href' | 'isExternal' | 'unavailable'
    > {
  /** The record's kind, such as `Requirement`. */
  type?: string | undefined;
  /** The version the reference points at, such as `v3`. */
  version?: string | undefined;
  /** The record's state, usually a `Badge` or `StatusLight`. */
  state?: ReactNode;
  /** Defaults to `inline`. */
  layout?: RecordChipLayout | undefined;
  /** Content of a `HoverCard` that previews a linked record on hover and keyboard focus of its link. */
  preview?: ReactNode;
  /** Draws a remove button that calls this. */
  onRemove?: (() => void) | undefined;
}

const hooks = createHooks('record-chip', [
  'label',
  'preview',
  'header',
  'version',
  'type',
  'state',
  'name',
  'remove',
]);

/** The label, opening the preview from the link of an available record. */
function ChipLabel({
  preview,
  href,
  unavailable,
  label,
}: Pick<RecordChipProps, 'preview' | 'href' | 'unavailable'> & { label: ReactNode }) {
  if (preview === undefined || preview === null || href === undefined || unavailable) return label;
  return (
    <HoverCardTrigger>
      {label}
      <HoverCard className={hooks.slotClass('preview')}>{preview}</HoverCard>
    </HoverCardTrigger>
  );
}

/** The parts after the label that describe an available record, each after a space. */
function ChipDetails({
  version,
  type,
  state,
}: Pick<RecordChipProps, 'version' | 'type' | 'state'>) {
  const details = [
    ['version', version],
    ['type', type],
    ['state', state],
  ] as const;
  return details.map(([slot, content]) =>
    content ? (
      <Fragment key={slot}>
        {' '}
        <span {...hooks.slot(slot)}>{content}</span>
      </Fragment>
    ) : null,
  );
}

/** The remove button, named by the record it removes. */
function ChipRemove({
  identifier,
  unavailable,
  onRemove,
}: Pick<RecordChipProps, 'identifier' | 'unavailable'> & { onRemove: () => void }) {
  const strings = useUiStrings();
  const name = unavailable ? strings.recordUnavailable(unavailable) : identifier;
  return (
    <IconButton
      icon="close"
      size="xs"
      label={strings.removeItem(name)}
      className={hooks.slotClass('remove')}
      onPress={onRemove}
    />
  );
}

/**
 * An inline reference to a record: its label (icon, identifier and name), then the parts the caller
 * gives (version, kind, state), an optional remove button, and a preview on hover and focus. An
 * unavailable record shows only its label and the remove button.
 */
export function RecordChip({
  identifier,
  name,
  icon,
  size = 'md',
  href,
  isExternal,
  unavailable,
  type,
  version,
  state,
  layout = 'inline',
  preview,
  onRemove,
  className,
  ...rest
}: RecordChipProps) {
  const nameId = useId();
  const isStacked = layout === 'stacked' && !unavailable;
  const text = name?.trim();
  const label = (
    <RecordLabel
      identifier={identifier}
      icon={icon}
      size={size}
      href={href}
      isExternal={isExternal}
      unavailable={unavailable}
      name={isStacked ? undefined : text}
      aria-describedby={isStacked && text ? nameId : undefined}
      className={hooks.slotClass('label')}
    />
  );
  const parts = (
    <>
      <ChipLabel preview={preview} href={href} unavailable={unavailable} label={label} />
      {unavailable ? null : <ChipDetails version={version} type={type} state={state} />}
      {onRemove ? (
        <ChipRemove identifier={identifier} unavailable={unavailable} onRemove={onRemove} />
      ) : null}
    </>
  );
  const data = { layout: isStacked ? 'stacked' : 'inline', size, unavailable };
  return (
    <span {...rest} {...hooks.root({ className, data })}>
      {isStacked ? <span {...hooks.slot('header')}>{parts}</span> : parts}
      {isStacked && text ? (
        <TruncationTooltip id={nameId} className={hooks.slotClass('name')}>
          {text}
        </TruncationTooltip>
      ) : null}
    </span>
  );
}
