'use client';

import type { ReactNode } from 'react';
import { CloseGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import type { IconSource } from '../icon/icon.js';
import { Label } from '../label/label.js';
import { Link } from '../link/link.js';

/** An opaque reference carried by a message token. */
export interface MessageReferenceData {
  id: string;
  label: string;
  /** Host-defined scope; the library does not interpret it. */
  recordType?: string | undefined;
}

/** Host-owned content and navigation for an inline reference. */
export interface MessageReferencePresentation {
  /** Replaces the token label, for example when its target is unavailable. */
  label?: string | undefined;
  name?: string | undefined;
  icon?: IconSource;
  href?: string | undefined;
  isExternal?: boolean | undefined;
  /** Optional neutral supporting content. */
  description?: ReactNode;
  preview?: ReactNode;
}

export type MessageReferenceResolver = (
  reference: MessageReferenceData,
) => MessageReferencePresentation | undefined;

export interface MessageReferenceProps
  extends BaseProps, RefProps<HTMLSpanElement>, MessageReferencePresentation {
  label: string;
  onRemove?: (() => void) | undefined;
}

const hooks = createHooks('message-reference', ['content', 'description', 'remove', 'preview']);

/** A message reference with host content, optional navigation, preview and removal. */
export function MessageReference({
  label,
  name,
  icon,
  href,
  isExternal,
  description,
  preview,
  onRemove,
  className,
  ...rest
}: MessageReferenceProps) {
  const strings = useUiStrings();
  const content = <Label icon={icon} label={name ? `${label} ${name}` : label} />;
  const link = href ? (
    <Link href={href} isExternal={isExternal}>
      {content}
    </Link>
  ) : (
    content
  );
  return (
    <span {...hooks.root({ className, props: rest })}>
      <HoverCardTrigger isDisabled={!href || !preview}>
        <span {...hooks.slot('content')}>{link}</span>
        {href && preview ? (
          <HoverCard className={hooks.slotClass('preview')}>{preview}</HoverCard>
        ) : null}
      </HoverCardTrigger>
      {description ? (
        <>
          {' '}
          <span {...hooks.slot('description')}>{description}</span>
        </>
      ) : null}
      {onRemove ? (
        <Button
          className={hooks.slotClass('remove')}
          icon={CloseGlyph}
          size="xs"
          label={strings.removeItem(label)}
          onPress={onRemove}
        />
      ) : null}
    </span>
  );
}
