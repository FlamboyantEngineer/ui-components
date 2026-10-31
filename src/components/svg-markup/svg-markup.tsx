import { createElement, useId, useMemo, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { mapTree } from '../../utils/map-tree.js';
import { toImageProps } from '../icon/icon.js';
import { parseSvgMarkup, type SvgElementNode, type SvgNode } from './parse-svg-markup.js';
import { createSvgReferenceScope, type SvgReferenceScope } from './svg-references.js';

export interface SvgMarkupProps extends BaseProps {
  /** SVG markup with a root `<svg>` element, for example an entry of a host icon registry. */
  markup: string;
  /** Accessible name. Without one the drawing is decorative and hidden from assistive technology. */
  label?: string | undefined;
}

const hooks = createHooks('svg-markup');

const reactPropNames: Readonly<Record<string, string>> = {
  class: 'className',
  tabindex: 'tabIndex',
  crossorigin: 'crossOrigin',
  'xmlns:xlink': 'xmlnsXlink',
};

/** Root attributes the component and its caller own; the markup's values are dropped. */
const ownedRootAttribute =
  /^(class|style|width|height|role|focusable|tabindex|id|aria-.+|data-.+)$/i;

function toCamelCase(name: string): string {
  return name.replace(/[-:]([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/** The React prop for an SVG attribute: `stroke-width` → `strokeWidth`, `xlink:href` → `xlinkHref`. */
function toPropName(attribute: string): string {
  const mapped = reactPropNames[attribute];
  if (mapped) return mapped;
  if (attribute.startsWith('data-') || attribute.startsWith('aria-')) return attribute;
  return toCamelCase(attribute);
}

/** A CSS declaration list as a React style object. */
function parseStyle(css: string): Record<string, string> {
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
    style[toCamelCase(name)] = value;
  }
  return style;
}

function toElementProps(
  attributes: Readonly<Record<string, string>>,
  keep: (name: string) => boolean = () => true,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (!keep(name)) continue;
    props[toPropName(name)] = name === 'style' ? parseStyle(value) : value;
  }
  return props;
}

function renderChildren(node: SvgElementNode, scope: SvgReferenceScope): ReactNode[] {
  return mapTree<SvgNode, ReactNode>(
    node.children,
    (child) => (child.type === 'element' ? child.children : undefined),
    (child, children, key) => {
      if (child.type === 'text') return child.text;
      const attributes = scope(child.tag, child.attributes);
      if (attributes === null) return null;
      return createElement(child.tag, { ...toElementProps(attributes), key }, children);
    },
  );
}

interface SvgDrawing {
  /** The markup's root attributes, scoped, without the ones the component and caller own. */
  rootProps: Record<string, unknown>;
  children: ReactNode[];
}

/** The drawing's root attributes and content as React props and elements, scoped to `instanceId`. */
export function renderSvgDrawing(tree: SvgElementNode, instanceId: string): SvgDrawing {
  const scope = createSvgReferenceScope(tree, instanceId);
  const rootAttributes = scope('svg', tree.attributes) ?? {};
  return {
    rootProps: toElementProps(rootAttributes, (name) => !ownedRootAttribute.test(name)),
    children: renderChildren(tree, scope),
  };
}

/**
 * Renders SVG markup as React elements, without innerHTML. The root keeps the markup's drawing
 * attributes (`viewBox`, `fill`, `stroke`, …); the stylesheet sizes it. Decorative unless labelled.
 * Each instance prefixes the drawing's IDs, so its references never reach the host page or another
 * drawing. The drawing is parsed and scoped again only when `markup` changes.
 * Renders nothing when the markup has no `<svg>` root.
 */
export function SvgMarkup({ markup, label, className, ...rest }: SvgMarkupProps) {
  const instanceId = useId();
  const tree = useMemo(() => parseSvgMarkup(markup), [markup]);
  const drawing = useMemo(
    () => (tree ? renderSvgDrawing(tree, instanceId) : null),
    [tree, instanceId],
  );
  if (!drawing) return null;
  return createElement(
    'svg',
    {
      ...drawing.rootProps,
      ...rest,
      ...hooks.root({ className }),
      focusable: 'false',
      ...toImageProps(label),
    },
    drawing.children,
  );
}
