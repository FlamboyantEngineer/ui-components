// The parts a custom card header composes: the title that names the card and the whole-card action.

import { createContext, useContext, type ReactNode, type RefCallback } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useHeadingLevel, type HeadingLevel } from '../section-header/section-header.js';
import { CardActionTitle, type CardActionOptions } from './card-action.js';

export interface CardTitleProps extends Omit<BaseProps, 'id'> {
  /** The title's content, which names the card. */
  children?: ReactNode;
}

export interface CardActionProps extends Omit<BaseProps, 'id'>, AriaLabellingProps {
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
export function CardTitle({ children, className, ...rest }: CardTitleProps) {
  const parts = useContext(CardHeaderContext);
  const automaticLevel = useHeadingLevel(undefined);
  const Heading = `h${parts?.title.level ?? automaticLevel}` as const;
  return (
    <Heading
      {...rest}
      id={parts?.title.id}
      ref={parts?.title.ref}
      className={mergeClassNames(parts?.title.className, className) || undefined}
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
export function CardAction({ children, className, ...rest }: CardActionProps) {
  const parts = useContext(CardHeaderContext);
  if (!parts?.action.isActionable) return <>{children}</>;
  const { action } = parts;
  return (
    <CardActionTitle
      {...rest}
      options={action.options}
      actionRef={action.ref}
      className={mergeClassNames(action.className, className)}
    >
      {children}
    </CardActionTitle>
  );
}
