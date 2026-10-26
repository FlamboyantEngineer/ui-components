import type { ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { type AttributionProps } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { type DescriptionListProps } from '../description-list/description-list.js';
import { type ChangeListValue, type ChangeListValueType, type ChangeListVariant, type ChangeListValueRenderer } from './change-values.js';
export type { ChangeListValue, ChangeListValueRenderer, ChangeListValueType, ChangeListVariant, } from './change-values.js';
/** One property that changed: its label, its old and new values, and who changed it when. */
export interface ChangeListChange {
    /** Identifies the change. */
    id: Key;
    /** The property's name. */
    label: ReactNode;
    /**
     * `text` shows a word diff of long text, `list` the items added and removed, `value` (the
     * default) the old and the new value whole.
     */
    type?: ChangeListValueType | undefined;
    /** The old value; unset when the property had none. */
    before?: ChangeListValue;
    /** The new value; unset when the property has none now. */
    after?: ChangeListValue;
    /** Who made the change. */
    person?: AvatarIdentity | undefined;
    /** When the change was made: an ISO 8601 date or date and time. */
    time?: string | null | undefined;
}
export interface ChangeListProps extends BaseProps, Pick<DescriptionListProps, 'aria-label' | 'aria-labelledby'>, Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
    /** The changes, one row each. */
    changes: readonly ChangeListChange[];
    /** `compact` puts old → new on one line; `detailed` stacks the old and new values. Defaults to `compact`. */
    variant?: ChangeListVariant | undefined;
    /** Draws a plain value or a list item, such as a status in a badge. Defaults to the text. */
    renderValue?: ChangeListValueRenderer | undefined;
    /** Draws the list while it has no changes. */
    renderEmptyState?: (() => ReactNode) | undefined;
}
/**
 * What changed in a record, one row per property: its label and its old → new value, drawn per
 * value type (a word diff of text, the items added to and removed from a list, or the two values),
 * with who changed it and when.
 */
export declare function ChangeList({ changes, variant, renderValue, renderEmptyState, showAvatar, fallbackAfterDays, getNow, className, ...rest }: ChangeListProps): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react").JSX.Element | null | undefined;
//# sourceMappingURL=change-list.d.ts.map