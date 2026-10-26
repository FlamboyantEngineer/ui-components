import { type ReactNode, type Ref } from 'react';
import type { BaseProps, Key, Orientation, Size } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
export type TabsSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** `automatic` selects a tab when focus reaches it; `manual` waits for Space or Enter. */
export type TabsKeyboardActivation = 'automatic' | 'manual';
/** The state `Tabs` passes to `render` with its root's props. */
export interface TabsRenderState {
    orientation: Orientation;
}
/** The states a `TabPanel` passes to `render` with its element's props. */
export interface TabPanelRenderState {
    isFocused: boolean;
    isFocusVisible: boolean;
    /** A force-mounted panel whose tab is not selected. */
    isInert: boolean;
    isEntering: boolean;
    isExiting: boolean;
}
export interface TabsProps extends BaseProps {
    /** The root element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** The selected tab's `id` (controlled). */
    selectedKey?: Key | undefined;
    /** The initially selected tab's `id` when uncontrolled. Defaults to the first enabled tab. */
    defaultSelectedKey?: Key | undefined;
    /** Receives the `id` of the tab the reader selects. */
    onSelectionChange?: ((key: Key) => void) | undefined;
    /** Keeps an uncontrolled selection in the provider's storage under this key. */
    persistKey?: string | undefined;
    /** The `id`s of tabs that cannot be selected or focused. */
    disabledKeys?: Iterable<Key> | undefined;
    /** Disables every tab. */
    isDisabled?: boolean | undefined;
    /** Lays the tabs out in a row or a column. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** Whether focus alone selects a tab. Defaults to `automatic`. */
    keyboardActivation?: TabsKeyboardActivation | undefined;
    /** Tab block size. Defaults to `md`. */
    size?: TabsSize | undefined;
    /** The `TabList` and the `TabPanel`s. */
    children?: ReactNode;
    /** Replaces the root `<div>` with the caller's own, given its props and state. */
    render?: ElementRender<'div', TabsRenderState> | undefined;
}
export interface TabPanelProps extends Omit<BaseProps, 'id'> {
    /** Pairs the panel with the `Tab` of the same `id`. */
    id?: Key | undefined;
    /** The panel element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** Keeps the panel mounted, inert and hidden, while its tab is not selected. */
    shouldForceMount?: boolean | undefined;
    /** The panel's content. */
    children?: ReactNode;
    /** Replaces the panel's `<div>` with the caller's own, given its props and state. */
    render?: ElementRender<'div', TabPanelRenderState> | undefined;
}
/**
 * Switches between peer sections of one surface: a `TabList` of `Tab`s and their `TabPanel`s. With
 * `persistKey` it remembers the selected tab through the provider's storage.
 */
export declare function Tabs({ size, className, persistKey, selectedKey, defaultSelectedKey, onSelectionChange, ...rest }: TabsProps): import("react").JSX.Element;
/** The content shown for the tab with the same `id`. */
export declare function TabPanel({ className, id, ...rest }: TabPanelProps): import("react").JSX.Element;
export { Tab } from './tab.js';
export type { TabProps, TabRenderState } from './tab.js';
export { TabList } from './tab-list.js';
export type { TabListOverflow, TabListProps, TabListRenderState, TabMenuItems, TabMove, TabNameValidate, } from './tab-list.js';
//# sourceMappingURL=tabs.d.ts.map