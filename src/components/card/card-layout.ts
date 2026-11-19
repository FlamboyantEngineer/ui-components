import { Children, cloneElement, Fragment, isValidElement, type ReactNode } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { CardProps } from './card.js';
import {
  CardContent,
  type CardContentProps,
  CardFooter,
  type CardFooterProps,
  CardHeader,
  type CardHeaderProps,
} from './card-parts.js';

interface CardParts {
  header?: CardHeaderProps;
  content?: CardContentProps;
  footer?: CardFooterProps;
}

function takeCardParts(children: ReactNode, parts: CardParts): ReactNode {
  return Children.map(children, (child): ReactNode => {
    if (!isValidElement(child)) return child;
    if (child.type === Fragment && isValidElement<{ children?: ReactNode }>(child)) {
      return cloneElement(child, undefined, takeCardParts(child.props.children, parts));
    }
    if (child.type === CardHeader && isValidElement<CardHeaderProps>(child)) {
      parts.header ??= child.props;
      return null;
    }
    if (child.type === CardContent && isValidElement<CardContentProps>(child)) {
      parts.content ??= child.props;
      return null;
    }
    if (child.type === CardFooter && isValidElement<CardFooterProps>(child)) {
      parts.footer ??= child.props;
      return null;
    }
    return child;
  });
}

/** Resolves the caller's parts and the equivalent managed card regions in one place. */
export function resolveCardLayout({
  children,
  header,
  footer,
}: Pick<CardProps, 'children' | 'header' | 'footer'>) {
  const parts: CardParts = {};
  const body = takeCardParts(children, parts);
  const { children: headerChildren, ...headerAttributes } = parts.header ?? {};
  return {
    header: parts.header ? headerChildren : header,
    headerProps: parts.header ? headerAttributes : undefined,
    hasCustomHeader: parts.header !== undefined || !isEmptyNode(header),
    content: parts.content ?? { children: parts.header || parts.footer ? body : children },
    footer: parts.footer ?? (isEmptyNode(footer) ? undefined : { children: footer }),
  };
}
