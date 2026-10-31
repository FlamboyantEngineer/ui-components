// Keeps a drawing's ID references inside the drawing (specs/SVG-MARKUP.md, UIC-SVG-MARKUP-1.4).
// Browsers resolve `#id` across the whole document, so each rendered instance prefixes its IDs
// and every reference to them, and drops references to IDs the drawing does not define.

import { walkTree } from '../../utils/walk-tree.js';
import type { SvgElementNode } from './parse-svg-markup.js';
import { scopeTimingList } from './svg-timing.js';

/** Rewrites one element's attributes for its instance; null drops the element. */
export type SvgReferenceScope = (
  tag: string,
  attributes: Readonly<Record<string, string>>,
) => Record<string, string> | null;

/** Attributes holding a space-separated list of IDs. */
const idListAttribute =
  /^aria-(?:labelledby|describedby|controls|owns|activedescendant|details|errormessage|flowto)$/;

/** Animations, which target their parent when their `href` goes, so they go with it. */
const animationTags: ReadonlySet<string> = new Set([
  'animate',
  'animatemotion',
  'animatetransform',
  'set',
]);

/** Attributes holding names or prose, which reference nothing. */
const freeTextAttribute = /^(?:class|lang|role|xml:lang|xml:space|aria-.+|data-.+)$/;

/** A `url(#id)` reference, quoted or not. The policy has already refused every other `url()`. */
const urlReference = /url\(\s*(["']?)#([^"')]*)\1\s*\)/gi;

const definedIdsByTree = new WeakMap<SvgElementNode, ReadonlySet<string>>();

/** The IDs a drawing defines below its root, which its caller owns. Cached per parsed tree. */
function definedIds(tree: SvgElementNode): ReadonlySet<string> {
  const cached = definedIdsByTree.get(tree);
  if (cached) return cached;
  const ids = new Set<string>();
  for (const node of walkTree(tree.children, (node) =>
    node.type === 'element' ? node.children : undefined,
  )) {
    const id = node.type === 'element' ? node.attributes.id : undefined;
    if (id) ids.add(id);
  }
  definedIdsByTree.set(tree, ids);
  return ids;
}

/**
 * A useId value as an ID prefix of word characters only, which needs no escaping in a fragment or
 * `url()` and holds none of the `.`, `+`, `-` and `\` that split a timing value.
 */
function toPrefix(instanceId: string): string {
  return `${instanceId.replace(/\W/g, '_')}_`;
}

/**
 * The reference scope of one rendered instance of `tree`. IDs gain the instance's prefix, and so
 * do `href`, `xlink:href`, `url()`, animation timing and ARIA ID references to them. A reference
 * to an ID the drawing does not define is dropped: the attribute, the `style` declaration or the
 * ID-list token goes, an animation linked to it goes, and a `begin` left with no timing never
 * starts. The parsed tree is left as it is.
 */
export function createSvgReferenceScope(
  tree: SvgElementNode,
  instanceId: string,
): SvgReferenceScope {
  const ids = definedIds(tree);
  const prefix = toPrefix(instanceId);
  const scoped = (id: string) => (ids.has(id) ? `${prefix}${id}` : null);

  /** The value with its `url()` references scoped, or null when one leaves the drawing. */
  const scopeUrls = (value: string): string | null => {
    let isEscaping = false;
    const rewritten = value.replace(urlReference, (_, quote: string, id: string) => {
      const target = scoped(id);
      if (target === null) isEscaping = true;
      return `url(${quote}#${target ?? ''}${quote})`;
    });
    return isEscaping ? null : rewritten;
  };

  const scopeStyle = (css: string) =>
    css
      .split(';')
      .map((declaration) => scopeUrls(declaration))
      .filter((declaration): declaration is string => declaration !== null)
      .join(';');

  const scopeTiming = (value: string) => scopeTimingList(value, prefix, (id) => ids.has(id));

  const scopeIdList = (value: string): string | null => {
    const kept = value
      .split(/\s+/)
      .map((id) => (id ? scoped(id) : null))
      .filter((id): id is string => id !== null);
    return kept.length > 0 ? kept.join(' ') : null;
  };

  /** A fragment link scoped; to an undefined ID it drops the attribute, or an animation. */
  const scopeLink = (tag: string, value: string): string | null | undefined => {
    const link = value.trim();
    if (!link.startsWith('#')) return value;
    const target = scoped(link.slice(1));
    if (target !== null) return `#${target}`;
    return animationTags.has(tag.toLowerCase()) ? null : undefined;
  };

  /** The scoped value of one attribute, `undefined` to drop the attribute, null to drop the element. */
  const scopeAttribute = (tag: string, name: string, value: string): string | null | undefined => {
    if (name === 'id') return `${prefix}${value}`;
    if (name === 'href' || name === 'xlink:href') return scopeLink(tag, value);
    if (name === 'style') return scopeStyle(value) || undefined;
    if (name === 'begin') return scopeTiming(value) ?? 'indefinite';
    if (name === 'end') return scopeTiming(value) ?? undefined;
    if (idListAttribute.test(name)) return scopeIdList(value) ?? undefined;
    if (freeTextAttribute.test(name)) return value;
    return scopeUrls(value) ?? undefined;
  };

  return (tag, attributes) => {
    const kept: Record<string, string> = {};
    for (const [name, value] of Object.entries(attributes)) {
      const next = scopeAttribute(tag, name, value);
      if (next === null) return null;
      if (next !== undefined) kept[name] = next;
    }
    return kept;
  };
}
