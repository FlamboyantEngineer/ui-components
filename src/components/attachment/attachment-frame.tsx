'use client';

import type { ReactNode } from 'react';
import type { PressEventProps } from '../../core/events.js';
import type { GlyphComponent } from '../../core/glyphs.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, ContainerProps, Orientation, RefProps, Size } from '../../core/props.js';
import { Button } from '../button/button.js';
import type { AttachmentStatus } from './attachment-model.js';
import { attachmentHooks as hooks } from './attachment-parts.js';

/** How large a composed attachment draws. */
export type AttachmentSize = Extract<Size, 'xs' | 'sm' | 'md'>;

/** `icon` holds a file's glyph, `image` a preview that fills the media box. */
export type AttachmentMediaVariant = 'icon' | 'image';

/** A composed attachment: its parts come from the caller, as in shadcn/ui's attachment. */
export interface AttachmentFrameProps extends ContainerProps<'div'>, BaseProps {
  /** Composes the attachment from parts; set only on a data attachment. */
  name?: undefined;
  /** Where its upload stands, published as `data-status`. Defaults to `complete`. */
  status?: AttachmentStatus | undefined;
  /** Defaults to `md`. */
  size?: AttachmentSize | undefined;
  /** `horizontal` (the default) sets the media beside the content, `vertical` above it. */
  orientation?: Orientation | undefined;
  /** An `AttachmentMedia`, an `AttachmentContent` and `AttachmentActions`. */
  children?: ReactNode;
}

export interface AttachmentGroupProps extends ContainerProps<'div'>, BaseProps {}

export interface AttachmentMediaProps extends ContainerProps<'div'>, BaseProps {
  /** Defaults to `icon`. */
  variant?: AttachmentMediaVariant | undefined;
}

export interface AttachmentContentProps extends ContainerProps<'div'>, BaseProps {}

export interface AttachmentTitleProps extends ContainerProps<'span'>, BaseProps {}

export interface AttachmentDescriptionProps extends ContainerProps<'span'>, BaseProps {}

export interface AttachmentActionsProps extends ContainerProps<'div'>, BaseProps {}

export interface AttachmentActionProps
  extends RefProps<HTMLButtonElement>, BaseProps, Pick<PressEventProps, 'onPress'> {
  /** Names the icon-only button. */
  label: string;
  icon: GlyphComponent;
}

const groupHooks = createHooks('attachment-group');

/** The root of a composed attachment. */
export function AttachmentFrame({
  status = 'complete',
  size = 'md',
  orientation = 'horizontal',
  className,
  ...rest
}: AttachmentFrameProps) {
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { status, size, orientation, display: 'parts' } })}
    />
  );
}

/** A row of attachments that scrolls sideways when they do not fit. */
export function AttachmentGroup({ className, ...rest }: AttachmentGroupProps) {
  return <div {...rest} {...groupHooks.root({ className })} />;
}

/** The file's glyph or an image preview. */
export function AttachmentMedia({ variant = 'icon', className, ...rest }: AttachmentMediaProps) {
  return <div {...rest} {...hooks.slot('media', { variant }, className)} />;
}

/** The title and description, beside or below the media. */
export function AttachmentContent({ className, ...rest }: AttachmentContentProps) {
  return <div {...rest} {...hooks.slot('content', undefined, className)} />;
}

/** The file's name. */
export function AttachmentTitle({ className, ...rest }: AttachmentTitleProps) {
  return <span {...rest} {...hooks.slot('title', undefined, className)} />;
}

/** A detail, such as the file's size or why its upload failed. */
export function AttachmentDescription({ className, ...rest }: AttachmentDescriptionProps) {
  return <span {...rest} {...hooks.slot('description', undefined, className)} />;
}

/** The attachment's commands, at its end. */
export function AttachmentActions({ className, ...rest }: AttachmentActionsProps) {
  return <div {...rest} {...hooks.slot('actions', undefined, className)} />;
}

/** One small ghost icon-only command, such as Remove or Download. */
export function AttachmentAction({ className, ...rest }: AttachmentActionProps) {
  return (
    <Button
      {...rest}
      className={mergeClassNames(hooks.slotClass('action'), className)}
      size="sm"
      variant="ghost"
    />
  );
}
