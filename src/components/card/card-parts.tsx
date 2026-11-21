'use client';

import { createContext, type ReactNode, type RefCallback, useContext } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { composedDataSlot, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps, NativeProps, RefProps } from '../../core/props.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { type HeadingLevel, useHeadingLevel } from '../section-header/section-header.js';
import { type CardActionOptions, CardActionTitle } from './card-action.js';
import { cardHooks as hooks } from './card-hooks.js';

export interface CardHeaderProps extends BaseProps, RefProps<HTMLElement> {
  children?: ReactNode;
}

export interface CardDescriptionProps extends BaseProps, RefProps<HTMLDivElement> {
  children?: ReactNode;
}

export interface CardActionProps extends BaseProps, RefProps<HTMLDivElement> {
  children?: ReactNode;
}

export interface CardContentProps
  extends BaseProps, RefProps<HTMLDivElement>, Pick<NativeProps<'div'>, 'hidden'> {
  children?: ReactNode;
}

export interface CardFooterProps
  extends BaseProps, RefProps<HTMLElement>, Pick<NativeProps<'footer'>, 'hidden'> {
  children?: ReactNode;
}

export interface CardTitleProps extends RefProps<HTMLHeadingElement>, Omit<BaseProps, 'id'> {
  /** The title's content, which names the card. */
  children?: ReactNode;
}

export interface CardTitleActionProps extends Omit<BaseProps, 'id'>, AriaLabellingProps {
  /** The action's content, usually the title text. */
  children?: ReactNode;
}

/** What a card hands the title and action parts of its custom header. */
export interface CardHeaderParts {
  title: {
    id: string;
    className: string;
    level: HeadingLevel;
    /** Tells the card that its custom header drew a title. */
    ref: RefCallback<HTMLElement>;
  };
  action: {
    options: CardActionOptions;
    isActionable: boolean;
    className: string;
    ref: RefCallback<HTMLElement>;
  };
}

/** The parts of the card whose custom header is being drawn; `null` outside one. */
export const CardHeaderContext = createContext<CardHeaderParts | null>(null);

/**
 * The title of a card's custom header: a heading at the card's level with the card's title id and
 * hook class, which names the card. Outside a custom header it is a plain heading.
 */
export function CardTitle({ ref, children, className, ...rest }: CardTitleProps) {
  const parts = useContext(CardHeaderContext);
  const titleRef = useMergedRefs(parts?.title.ref, ref);
  const automaticLevel = useHeadingLevel(undefined);
  const Heading = `h${parts?.title.level ?? automaticLevel}` as const;
  return (
    <Heading
      {...rest}
      id={parts?.title.id}
      ref={titleRef}
      className={mergeClassNames(parts?.title.className, className) || undefined}
      data-slot={composedDataSlot(parts?.title.className)}
    >
      {children}
    </Heading>
  );
}

/**
 * The whole-card action in a card's custom header: the card's link (`href`) or button (`onAction`)
 * with the action hook class, which clicks anywhere on the card activate. Without a card action it
 * renders its children as they are.
 */
export function CardTitleAction({ children, className, ...rest }: CardTitleActionProps) {
  const parts = useContext(CardHeaderContext);
  if (!parts?.action.isActionable) return <>{children}</>;
  const { action } = parts;
  return (
    <CardActionTitle
      {...rest}
      options={action.options}
      actionRef={action.ref}
      className={mergeClassNames(action.className, className)}
      data-slot={composedDataSlot(action.className)}
    >
      {children}
    </CardActionTitle>
  );
}

/** A custom header with a title, a description and contextual actions. */
export function CardHeader({ className, ...rest }: CardHeaderProps) {
  return <header {...rest} {...hooks.slot('header', undefined, className)} />;
}

/** Supporting text under the title. */
export function CardDescription({ className, ...rest }: CardDescriptionProps) {
  return <div {...rest} {...hooks.slot('description', undefined, className)} />;
}

/** Contextual controls in the header, independent of the whole-card action. */
export function CardAction({ className, ...rest }: CardActionProps) {
  return <div {...rest} {...hooks.slot('actions', undefined, className)} />;
}

/** The main content, subject to the card's loading and expanded state. */
export function CardContent({ className, ...rest }: CardContentProps) {
  return <div {...rest} {...hooks.slot('body', undefined, className)} />;
}

/** Closing content such as secondary actions or metadata. */
export function CardFooter({ className, ...rest }: CardFooterProps) {
  return <footer {...rest} {...hooks.slot('footer', undefined, className)} />;
}
