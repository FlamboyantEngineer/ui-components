import { type ReactElement, type ReactNode } from 'react';
import type { AriaLabellingProps, SelectionProps } from '../../core/events.js';
import type { BaseProps, Key, Size, Tone } from '../../core/props.js';
export type TagGroupSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type TagTone = Tone;
export interface TagGroupProps<T extends object> extends BaseProps, AriaLabellingProps, SelectionProps {
    /** The data to render a tag for each of, with `children` as a function. */
    items?: Iterable<T> | undefined;
    /** The tags: `Tag` elements, or a function that renders the `Tag` of each of `items`. */
    children: ReactNode | ((item: T) => ReactElement);
    /** Lets the tags be removed; called with the keys to remove. */
    onRemove?: ((keys: Set<Key>) => void) | undefined;
    /** Scale. Defaults to `md`. */
    size?: TagGroupSize | undefined;
    /** The tone of every tag that sets none. Defaults to `neutral`. */
    tone?: TagTone | undefined;
    /** Shown in the list while it holds no tag. */
    renderEmptyState?: (() => ReactNode) | undefined;
}
export interface TagProps extends Omit<BaseProps, 'id'> {
    /** The tag's key in the group. */
    id?: Key | undefined;
    /** The tag's content. Give `textValue` when it is not plain text. */
    children: ReactNode;
    /** The tag's name, when its content is not plain text. */
    textValue?: string | undefined;
    /** Leaves the tag out of the keyboard path and of removal. */
    isDisabled?: boolean | undefined;
    /** The tag's tone. Defaults to the group's. */
    tone?: TagTone | undefined;
}
/**
 * A focusable collection of tags (React Aria `TagGroup`): the arrow keys move between tags, and with
 * `onRemove` each tag offers a remove button and Delete and Backspace remove the focused tag.
 * Without `onRemove` the tags stay focusable and offer no removal.
 */
export declare function TagGroup<T extends object>({ children, items, size, tone, renderEmptyState, className, selectedKeys, defaultSelectedKeys, disabledKeys, onSelectionChange, onRemove, ...rest }: TagGroupProps<T>): import("react").JSX.Element;
/**
 * One tag of a `TagGroup`. In a group with `onRemove` an enabled tag ends with a remove button,
 * named by the provider's `remove` string read with the tag's name.
 */
export declare function Tag({ id, children, tone, textValue, className, ...rest }: TagProps): import("react").JSX.Element;
//# sourceMappingURL=tag-group.d.ts.map