import { createElement, Fragment, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { UiLink } from '../../core/provider.js';
import { TextMatch } from '../text-match/text-match.js';
import {
  defaultHtmlPolicy,
  sanitizeHtml,
  type HtmlElementNode,
  type HtmlNode,
  type HtmlPolicy,
} from './sanitize-html.js';

export interface HtmlMarkupProps extends BaseProps {
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
  return createElement(element.tag, props, ...(element.children.length > 0 ? [children] : []));
}

type ElementRenderer = HtmlMarkupProps['renderElement'];

function renderNodes(nodes: readonly HtmlNode[], renderElement: ElementRenderer): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === 'text') return <TextMatch key={index}>{node.text}</TextMatch>;
    const children = renderNodes(node.children, renderElement);
    const custom = renderElement?.(node, children);
    return (
      <Fragment key={index}>
        {custom === undefined ? renderDefaultElement(node, children) : custom}
      </Fragment>
    );
  });
}

/**
 * Renders an HTML fragment through an allowlist sanitizer as React elements, never through
 * innerHTML. Links render through the provider's link renderer; text through `TextMatch`.
 */
export function HtmlMarkup({
  markup,
  policy = defaultHtmlPolicy,
  renderElement,
  className,
  ...rest
}: HtmlMarkupProps) {
  const nodes = useMemo(() => sanitizeHtml(markup, policy), [markup, policy]);
  return (
    <div {...rest} {...hooks.root({ className })}>
      {renderNodes(nodes, renderElement)}
    </div>
  );
}
