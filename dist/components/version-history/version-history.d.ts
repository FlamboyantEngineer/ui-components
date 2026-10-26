import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, NativeProps } from '../../core/props.js';
import type { AttributionProps } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { type VersionHistoryFilter } from './version-model.js';
export type { VersionHistoryFilter } from './version-model.js';
/** One saved version: named, or automatic and titled by its time. */
export interface VersionHistoryVersion {
    /** Identifies the version. */
    id: Key;
    /** The version's name. A version without one is an automatic version, titled by its time. */
    label?: string | undefined;
    /** When the version was saved: an ISO 8601 date or date and time. */
    time: string;
    /** Who saved it. */
    person?: AvatarIdentity | undefined;
    /** What changed in it, in a line. */
    summary?: ReactNode;
    /** The version cannot be selected and has no actions. */
    isDisabled?: boolean | undefined;
}
export interface VersionHistoryProps extends BaseProps, AriaLabellingProps, Pick<NativeProps<'div'>, 'ref'>, Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
    /** The versions, newest first. */
    versions: readonly VersionHistoryVersion[];
    /** The version that is the current content: it is marked and cannot be restored. */
    currentKey?: Key | null | undefined;
    /** The selected versions, at most two: one to view, two to compare. Controlled. */
    selectedKeys?: Iterable<Key> | undefined;
    /** The versions selected at first, uncontrolled. */
    defaultSelectedKeys?: Iterable<Key> | undefined;
    /** Called with the selected versions after each change. */
    onSelectionChange?: ((keys: Set<Key>) => void) | undefined;
    /** Shows a compare action, enabled while two versions are selected; called older first. */
    onCompare?: ((keys: [older: Key, newer: Key]) => void) | undefined;
    /** Offers to restore each version but the current one, after a confirmation. */
    onRestore?: ((key: Key) => void | Promise<unknown>) | undefined;
    /** Offers to name or rename each version; an empty name removes it. */
    onRename?: ((key: Key, label: string) => void | Promise<unknown>) | undefined;
    /** Which versions are shown. Controlled. */
    filter?: VersionHistoryFilter | undefined;
    /** Which versions are shown at first, uncontrolled. Defaults to every version. */
    defaultFilter?: VersionHistoryFilter | undefined;
    /** Called with the filter after each change. */
    onFilterChange?: ((filter: VersionHistoryFilter) => void) | undefined;
    /** Shows the filters above the list. Defaults to true. */
    showFilters?: boolean | undefined;
    /** Asks for older versions when the end of the list scrolls into view. */
    onLoadMore?: (() => void) | undefined;
    /** Versions are loading. */
    isLoading?: boolean | undefined;
    /** Why the versions could not be loaded; shown instead of the list. */
    error?: ReactNode;
    /** Shows a retry action with `error`. */
    onRetry?: (() => void) | undefined;
    /** Draws the list while there are no versions at all. */
    renderEmptyState?: (() => ReactNode) | undefined;
}
/**
 * The saved versions of a document or record, newest first: named and automatic versions with who
 * saved them and when, the current one marked. Select one to view it and two to compare them;
 * restore a version after a confirmation, name or rename it, and filter to named versions or one
 * person's.
 */
export declare function VersionHistory(props: VersionHistoryProps): import("react").JSX.Element;
//# sourceMappingURL=version-history.d.ts.map