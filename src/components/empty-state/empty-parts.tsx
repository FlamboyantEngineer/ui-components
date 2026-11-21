import type { ReactNode } from 'react';
import type { BaseProps, NativeProps, RefProps, Size } from '../../core/props.js';
import type { HeadingLevel } from '../section-header/section-header.js';
import { emptyStateHooks as hooks } from './empty-state-hooks.js';

export type EmptySize = Extract<Size, 'sm' | 'md'>;
export type EmptyMediaVariant = 'default' | 'icon';

export interface EmptyProps
  extends BaseProps, RefProps<HTMLElement>, Pick<NativeProps<'section'>, 'hidden'> {
  /** Defaults to `md`. */
  size?: EmptySize | undefined;
  children?: ReactNode;
}

export interface EmptyHeaderProps extends BaseProps, RefProps<HTMLDivElement> {
  children?: ReactNode;
}

export interface EmptyMediaProps extends BaseProps, RefProps<HTMLDivElement> {
  /** `icon` for a small glyph, `default` for an illustration. */
  variant?: EmptyMediaVariant | undefined;
  children?: ReactNode;
}

export interface EmptyTitleProps extends BaseProps, RefProps<HTMLHeadingElement> {
  /** Defaults to 3. */
  headingLevel?: HeadingLevel | undefined;
  children?: ReactNode;
}

export interface EmptyDescriptionProps extends BaseProps, RefProps<HTMLParagraphElement> {
  children?: ReactNode;
}

export interface EmptyContentProps extends BaseProps, RefProps<HTMLDivElement> {
  children?: ReactNode;
}

/** A notice whose text, decorative media and calls to action the caller composes. */
export function Empty({ size = 'md', className, ...rest }: EmptyProps) {
  return <section {...rest} {...hooks.root({ className, data: { size, variant: 'empty' } })} />;
}

/** Groups the media, heading and description. */
export function EmptyHeader({ className, ...rest }: EmptyHeaderProps) {
  return <div {...rest} {...hooks.slot('header', undefined, className)} />;
}

/** A decorative illustration or glyph. */
export function EmptyMedia({ className, variant = 'default', ...rest }: EmptyMediaProps) {
  return (
    <div {...rest} {...hooks.slot('media', { variant }, className)} aria-hidden="true" inert />
  );
}

/** The notice's heading. */
export function EmptyTitle({ className, headingLevel = 3, ...rest }: EmptyTitleProps) {
  const Heading = `h${headingLevel}` as const;
  return <Heading {...rest} {...hooks.slot('title', undefined, className)} />;
}

/** Explains what is missing or what the reader can do next. */
export function EmptyDescription({ className, ...rest }: EmptyDescriptionProps) {
  return <p {...rest} {...hooks.slot('description', undefined, className)} />;
}

/** Additional content or calls to action. */
export function EmptyContent({ className, ...rest }: EmptyContentProps) {
  return <div {...rest} {...hooks.slot('content', undefined, className)} />;
}
