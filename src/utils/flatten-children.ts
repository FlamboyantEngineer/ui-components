import { Children, cloneElement, Fragment, isValidElement, type ReactNode } from 'react';

/**
 * The children as one list, with the children of fragments, at any depth, in place of the fragments.
 * `Children.toArray` flattens arrays but keeps a fragment as one child. Each element keeps a key
 * unique among the flattened children (a fragment's key prefixes its children's), so it keeps its
 * identity while its siblings change. Elements are not rendered to find out what they draw.
 */
export function flattenChildren(children: ReactNode, prefix = ''): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [child];
    const key = `${prefix}${String(child.key)}`;
    if (child.type === Fragment) return flattenChildren(child.props.children, `${key}/`);
    return [prefix === '' ? child : cloneElement(child, { key })];
  });
}
