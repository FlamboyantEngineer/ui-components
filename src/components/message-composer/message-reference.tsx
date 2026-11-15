'use client';

import type { ReactNode } from 'react';
import { CloseGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { HoverCard, HoverCardTrigger, PreviewTrigger } from '../hover-card/hover-card.js';
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
  /**
   * Content shown on hover and keyboard focus: from the link, or, without `href`, from the label,
   * which becomes a button.
   */
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
  const hasPreview = preview !== undefined && preview !== null && preview !== false;
  // A link opens the preview on hover and focus; without one the label is a button that does.
  const target = href ? (
    <HoverCardTrigger isDisabled={!hasPreview}>
      <span {...hooks.slot('content')}>
        <Link href={href} isExternal={isExternal}>
          {content}
        </Link>
      </span>
      {hasPreview ? <HoverCard className={hooks.slotClass('preview')}>{preview}</HoverCard> : null}
    </HoverCardTrigger>
  ) : (
    <span {...hooks.slot('content')}>
      {hasPreview ? (
        <PreviewTrigger trigger="hover" preview={preview}>
          {content}
        </PreviewTrigger>
      ) : (
        content
      )}
    </span>
  );
  return (
    <span {...hooks.root({ className, props: rest })}>
      {target}
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
