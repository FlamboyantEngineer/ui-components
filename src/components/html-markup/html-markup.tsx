'use client';

import { createElement, Fragment, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { mapTreeToDepth } from '../../utils/map-tree.js';
import { maxMarkupDepth } from '../../utils/markup.js';
import { untrustedImageProps } from '../../utils/safe-url.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  defaultHtmlPolicy,
  sanitizeHtml,
  type HtmlElementNode,
  type HtmlNode,
  type HtmlPolicy,
} from './sanitize-html.js';

export interface HtmlMarkupProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The HTML fragment to show, for example stored rich text. It is sanitized before rendering. */
  markup: string;
  /** What the sanitizer keeps. Defaults to `defaultHtmlPolicy`. */
  policy?: HtmlPolicy | undefined;
  /**
   * Replaces a kept element: receives the sanitized element and its rendered children. Return
   * `undefined` to keep the default element, `null` to render nothing.
   */
  renderElement?: ((element: HtmlElementNode, children: ReactNode) => ReactNode) | undefined;
}

const hooks = createHooks('html-markup');

const reactPropNames: Readonly<Record<string, string>> = {
  accesskey: 'accessKey',
  class: 'className',
  colspan: 'colSpan',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  hreflang: 'hrefLang',
  referrerpolicy: 'referrerPolicy',
  rowspan: 'rowSpan',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
  usemap: 'useMap',
};

const booleanAttributes = new Set(['checked', 'disabled', 'hidden', 'open', 'reversed']);

function toElementProps(attributes: Readonly<Record<string, string>>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    props[reactPropNames[name] ?? name] = booleanAttributes.has(name) ? true : value;
  }
  return props;
}

function renderDefaultElement(element: HtmlElementNode, children: ReactNode): ReactNode {
  const props = toElementProps(element.attributes);
  const { href } = element.attributes;
  if (element.tag === 'a' && href !== undefined) {
    return (
      <UiLink {...props} href={href}>
        {children}
      </UiLink>
    );
  }
  // Content attributes a host's policy keeps (`referrerpolicy`, `loading`) override the defaults.
  const elementProps = element.tag === 'img' ? { ...untrustedImageProps, ...props } : props;
  return createElement(
    element.tag,
    elementProps,
    ...(element.children.length > 0 ? [children] : []),
  );
}

type ElementRenderer = HtmlMarkupProps['renderElement'];

function renderNodes(nodes: readonly HtmlNode[], renderElement: ElementRenderer): ReactNode[] {
  return mapTreeToDepth<HtmlNode, ReactNode>(nodes, {
    getChildren: (node) => (node.type === 'element' ? node.children : undefined),
    transform: (node, children, index) => {
      if (node.type === 'text') return <TextMatch key={index}>{node.text}</TextMatch>;
      const custom = renderElement?.(node, children);
      return (
        <Fragment key={index}>
          {custom === undefined ? renderDefaultElement(node, children) : custom}
        </Fragment>
      );
    },
    maxDepth: maxMarkupDepth,
  });
}

/**
 * Renders an HTML fragment through an allowlist sanitizer as React elements, never through
 * innerHTML. Links render through the provider's link renderer; text through `TextMatch`.
 */
export function HtmlMarkup({
  ref,
  markup,
  policy = defaultHtmlPolicy,
  renderElement,
  className,
  id,
  ...rest
}: HtmlMarkupProps) {
  const nodes = useMemo(() => sanitizeHtml(markup, policy), [markup, policy]);
  return (
    <div ref={ref} {...hooks.root({ className, props: rest })} id={id}>
      {renderNodes(nodes, renderElement)}
    </div>
  );
}
