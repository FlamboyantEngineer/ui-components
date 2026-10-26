import { type ReactElement, type ReactNode } from 'react';
/**
 * Keys a collection's children by their `id`, whatever component draws them, so that siblings with
 * the keys `1` and `'1'` stay separate React elements. React Aria keys the elements it draws from
 * `items` by their `id` as text, so each is wrapped in an element that carries its collection key and
 * hands the drawn element its own `id`. The collection items (`Tag`, `Tab`, `ListViewItem`, …) encode
 * that `id` themselves, so a host component that wraps one keeps its key.
 */
export declare function keyCollectionChildren(children: ReactNode): ReactNode;
export declare function keyCollectionChildren<T extends object>(children: (item: T) => ReactElement): (item: T) => ReactElement;
export declare function keyCollectionChildren<T extends object>(children: ReactNode | ((item: T) => ReactElement)): ReactNode | ((item: T) => ReactElement);
//# sourceMappingURL=key-collection-children.d.ts.map