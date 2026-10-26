import { type ReactElement, type ReactNode, type Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, NativeProps } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { type IconSource } from '../icon/icon.js';
/** The states a `Tab` passes to `render` with its element's props. */
export interface TabRenderState {
    isSelected: boolean;
    isHovered: boolean;
    isPressed: boolean;
    isFocused: boolean;
    isFocusVisible: boolean;
    isDisabled: boolean;
}
export interface TabProps extends Omit<BaseProps, 'id'>, AriaLabellingProps {
    /** Pairs the tab with the `TabPanel` of the same `id`. */
    id?: Key | undefined;
    /** The tab's element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** Refuses selection and focus. */
    isDisabled?: boolean | undefined;
    /** Makes the tab a link that navigates when selected. */
    href?: string | undefined;
    /** Called when the tab is right-clicked or the context menu key is pressed on it. */
    onContextMenu?: NativeProps<'div'>['onContextMenu'];
    /**
     * Replaces the tab's element with the caller's own, given its props and state. A tab with `href`
     * receives an anchor's props and the replacement renders an `<a>`.
     */
    render?: ElementRender<'div', TabRenderState> | undefined;
    /** The tab's label. */
    children?: ReactNode;
    /** The tab's text in an overflow menu, a rename field and a drag, when its label is not plain text. */
    textValue?: string | undefined;
    /** A decorative icon before the label. */
    icon?: IconSource;
    /** A count after the label. Zero, negative and non-finite values show nothing. */
    count?: number | null | undefined;
    /** Counts above this show as `<max>+`. Defaults to 99. */
    countMax?: number | undefined;
    /** The tab's accessible description while it shows a count. Defaults to the provider's `itemCount`. */
    countLabel?: string | undefined;
}
/**
 * One tab. With `href` it renders a link that navigates through the provider's router
 * (`UiProvider` `navigate`) when selected. In a list that takes them it draws a close mark, renames
 * in place, drags and opens a menu of its actions.
 */
export declare function Tab({ id, ...props }: TabProps): ReactElement;
//# sourceMappingURL=tab.d.ts.map