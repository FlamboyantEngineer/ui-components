import { Children, Fragment, createElement, isValidElement, type ReactNode } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { LayoutElement } from './layout.js';

/** Parents whose children are list items, so a divider between them is one too. */
const listParents: ReadonlySet<LayoutElement> = new Set(['ul', 'ol']);
/** Parents that hold phrasing content only, so a divider between their children is inline. */
const phrasingParents: ReadonlySet<LayoutElement> = new Set(['a', 'label', 'p', 'span']);

/** The element of a divider that is valid between the children of `parent`. */
function resolveDividerElement(parent: LayoutElement): 'li' | 'span' | 'div' {
  if (listParents.has(parent)) return 'li';
  return phrasingParents.has(parent) ? 'span' : 'div';
}

/**
 * The rendered children of a layout primitive, with a decorative divider, hidden from assistive
 * technology, between each pair while `divided`. Children that are `null`, `undefined`, booleans
 * or empty strings get no divider; components are not rendered to find out whether they draw
 * anything. Each child keeps the same keyed place divided or not, so toggling the dividers never
 * remounts it.
 */
export function interleaveDividers(
  children: ReactNode,
  { parent, className, divided }: { parent: LayoutElement; className: string; divided: boolean },
): ReactNode[] {
  const element = resolveDividerElement(parent);
  // `Children.toArray` keys every element, so keyed children keep their identity when reordered.
  const shown = Children.toArray(children).filter((child) => !isEmptyNode(child));
  return shown.map((child, index) => (
    <Fragment key={isValidElement(child) ? child.key : index}>
      {divided && index > 0 ? createElement(element, { className, 'aria-hidden': true }) : null}
      {child}
    </Fragment>
  ));
}
