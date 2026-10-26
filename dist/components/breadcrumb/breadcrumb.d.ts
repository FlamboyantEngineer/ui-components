import type { ReactNode } from 'react';
import type { BaseProps, Key, NativeProps, Size } from '../../core/props.js';
import { type IconSource } from '../icon/icon.js';
import type { MenuEntry } from '../menu/menu.js';
export type BreadcrumbSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** `truncate` lets labels ellipsize; `menu` collapses middle crumbs into a menu after the first. */
export type BreadcrumbOverflow = 'truncate' | 'menu';
export interface BreadcrumbItem {
    /** Passed to `onAction`. Defaults to the item's index. */
    id?: Key | undefined;
    /** The crumb's text. */
    label: ReactNode;
    /** The crumb's text in menus, when its label is not plain text. */
    textValue?: string | undefined;
    /** Where the crumb leads. The last crumb is the current page and never navigates. */
    href?: string | undefined;
    /** Places beside this crumb (its siblings), offered in a menu from a button after it. */
    menu?: readonly MenuEntry[] | undefined;
}
export interface BreadcrumbProps extends BaseProps, Pick<NativeProps<'nav'>, 'ref' | 'hidden'> {
    /** Names the trail's landmark. */
    'aria-label'?: string | undefined;
    /** Names the trail's landmark by another element. */
    'aria-labelledby'?: string | undefined;
    /** Disables every crumb and menu. */
    isDisabled?: boolean | undefined;
    /** Receives the `id` (or index) of a crumb the reader activates, or one chosen from a menu. */
    onAction?: ((key: Key) => void) | undefined;
    /** The trail, from the outermost container to the current page (the last item). */
    items: readonly BreadcrumbItem[];
    /** Type scale. Defaults to `md`. */
    size?: BreadcrumbSize | undefined;
    /** Decorative icon between crumbs. Defaults to a chevron pointing along the reading direction. */
    separator?: IconSource;
    /**
     * What a trail that runs out of room does: `truncate` (the default) lets labels ellipsize, `menu`
     * keeps the first and current crumbs and as many others as fit, and lists the rest in a menu.
     */
    overflow?: BreadcrumbOverflow | undefined;
}
/** A location trail: crumbs from the outermost container to the current page. */
export declare function Breadcrumb({ items, size, separator, overflow, isDisabled, onAction, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, ...rest }: BreadcrumbProps): import("react").JSX.Element;
//# sourceMappingURL=breadcrumb.d.ts.map