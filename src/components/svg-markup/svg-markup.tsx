import { createElement, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { parseSvgMarkup, type SvgElementNode, type SvgNode } from './parse-svg-markup.js';

export interface SvgMarkupProps {
  /** SVG markup with a root `<svg>` element, for example an entry of a host icon registry. */
  markup: string;
  /** Accessible name. Without one the drawing is decorative and hidden from assistive technology. */
  label?: string | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('svg-markup');

const PROP_NAMES: Readonly<Record<string, string>> = {
  class: 'className',
  tabindex: 'tabIndex',
  crossorigin: 'crossOrigin',
  'xmlns:xlink': 'xmlnsXlink',
};

/** Root attributes the component and its caller own; the markup's values are dropped. */
const OWNED_ROOT_ATTRIBUTE =
  /^(class|style|width|height|role|focusable|tabindex|id|aria-.+|data-.+)$/i;

function camelCase(name: string): string {
  return name.replace(/[-:]([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/** The React prop for an SVG attribute: `stroke-width` → `strokeWidth`, `xlink:href` → `xlinkHref`. */
function propName(attribute: string): string {
  const mapped = PROP_NAMES[attribute];
  if (mapped) return mapped;
  if (attribute.startsWith('data-') || attribute.startsWith('aria-')) return attribute;
  return camelCase(attribute);
}

/** A CSS declaration list as a React style object. */
function styleObject(css: string): Record<string, string> {
  const style: Record<string, string> = {};
  for (const declaration of css.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property || !value) continue;
    if (property.startsWith('--')) {
      style[property] = value;
      continue;
    }
    const lower = property.toLowerCase();
    const name = lower.startsWith('-ms-') ? lower.slice(1) : lower;
    style[name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value;
  }
  return style;
}

function elementProps(
  attributes: Readonly<Record<string, string>>,
  keep: (name: string) => boolean = () => true,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (!keep(name)) continue;
    props[propName(name)] = name === 'style' ? styleObject(value) : value;
  }
  return props;
}

function renderChildren(node: SvgElementNode): ReactNode[] {
  return node.children.map((child, index) => renderNode(child, index));
}

function renderNode(node: SvgNode, key: number): ReactNode {
  if (node.type === 'text') return node.text;
  return createElement(
    node.tag,
    { ...elementProps(node.attributes), key },
    ...renderChildren(node),
  );
}

function tryParse(markup: string): SvgElementNode | null {
  try {
    return parseSvgMarkup(markup);
  } catch {
    return null;
  }
}

/**
 * Renders SVG markup as React elements, without innerHTML. The root keeps the markup's drawing
 * attributes (`viewBox`, `fill`, `stroke`, …); the stylesheet sizes it. Decorative unless labelled.
 * Renders nothing when the markup has no `<svg>` root.
 */
export function SvgMarkup({ markup, label, className, id, ...rest }: SvgMarkupProps) {
  const tree = tryParse(markup);
  if (!tree) return null;
  return createElement(
    'svg',
    {
      ...elementProps(tree.attributes, (name) => !OWNED_ROOT_ATTRIBUTE.test(name)),
      ...hooks.root({ className, props: rest }),
      id,
      focusable: 'false',
      ...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' }),
    },
    ...renderChildren(tree),
  );
}
