'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { Fragment, useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Button } from '../button/button.js';
import { RecordLabelText, type RecordLabelProps } from './record-label.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

const hooks = createHooks('record-label', [
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
}: Pick<RecordLabelProps, 'preview' | 'href' | 'unavailable'> & { label: ReactNode }) {
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
}: Pick<RecordLabelProps, 'version' | 'type' | 'state'>) {
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
}: Pick<RecordLabelProps, 'identifier' | 'unavailable'> & { onRemove: () => void }) {
  const strings = useUiStrings();
  const name = unavailable ? strings.recordUnavailable(unavailable) : identifier;
  return (
    <Button
      icon={CloseGlyph}
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
export function RecordChipParts({
  identifier,
  name,
  icon,
  size = 'md',
  truncate,
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
}: RecordLabelProps) {
  const nameId = useId();
  const isStacked = layout === 'stacked' && !unavailable;
  const text = name?.trim();
  const label = (
    <RecordLabelText
      isChipLabel
      identifier={identifier}
      icon={icon}
      size={size}
      truncate={truncate}
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
  const data = { mode: 'chip', layout: isStacked ? 'stacked' : 'inline', size, unavailable };
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
