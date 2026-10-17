import { Children, Fragment, createElement, isValidElement, type ReactNode } from 'react';
import type { LayoutElement } from './layout.js';

/** Parents whose children are list items, so a divider between them is one too. */
const listParents: ReadonlySet<LayoutElement> = new Set(['ul', 'ol']);
/** Parents that hold phrasing content only, so a divider between their children is inline. */
const phrasingParents: ReadonlySet<LayoutElement> = new Set(['a', 'label', 'p', 'span']);

/** The element of a divider that is valid between the children of `parent`. */
export function resolveDividerElement(parent: LayoutElement): 'li' | 'span' | 'div' {
  if (listParents.has(parent)) return 'li';
  return phrasingParents.has(parent) ? 'span' : 'div';
}

/**
 * The rendered children of a layout primitive with a decorative divider, hidden from assistive
 * technology, between each pair. Children that render nothing get no divider.
 */
export function interleaveDividers(
  children: ReactNode,
  { parent, className }: { parent: LayoutElement; className: string },
): ReactNode[] {
  const element = resolveDividerElement(parent);
  // `Children.toArray` keys every element, so keyed children keep their identity when reordered.
  return Children.toArray(children).map((child, index) => (
    <Fragment key={isValidElement(child) ? child.key : index}>
      {index > 0 ? createElement(element, { className, 'aria-hidden': true }) : null}
      {child}
    </Fragment>
  ));
}
