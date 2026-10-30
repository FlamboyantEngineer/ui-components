'use client';

import type { ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Attribution, type AttributionProps } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import {
  DescriptionList,
  DescriptionRow,
  type DescriptionListProps,
} from '../description-list/description-list.js';
import { EmptyState } from '../empty-state/empty-state.js';
import {
  ChangeValues,
  changeListHooks as hooks,
  type ChangeListValue,
  type ChangeListValueType,
  type ChangeListVariant,
  type ChangeListValueRenderer,
} from './change-values.js';
import { resolveChangeKind } from './list-changes.js';

export type {
  ChangeListValue,
  ChangeListValueRenderer,
  ChangeListValueType,
  ChangeListVariant,
} from './change-values.js';

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

export interface ChangeListProps
  extends
    BaseProps,
    Pick<DescriptionListProps, 'aria-label' | 'aria-labelledby'>,
    Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
  /** The changes, one row each. */
  changes: readonly ChangeListChange[];
  /** `compact` puts old → new on one line; `detailed` stacks the old and new values. Defaults to `compact`. */
  variant?: ChangeListVariant | undefined;
  /** Draws a plain value or a list item, such as a status in a badge. Defaults to the text. */
  renderValue?: ChangeListValueRenderer | undefined;
  /** Draws the list while it has no changes. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

const showText: ChangeListValueRenderer = (value) => value;

/**
 * What changed in a record, one row per property: its label and its old → new value, drawn per
 * value type (a word diff of text, the items added to and removed from a list, or the two values),
 * with who changed it and when.
 */
export function ChangeList({
  changes,
  variant = 'compact',
  renderValue = showText,
  renderEmptyState,
  showAvatar,
  fallbackAfterDays,
  getNow,
  className,
  ...rest
}: ChangeListProps) {
  const strings = useUiStrings();
  if (changes.length === 0) {
    return renderEmptyState ? (
      renderEmptyState()
    ) : (
      <EmptyState size="sm" description={strings.noChanges} />
    );
  }
  return (
    <DescriptionList
      {...rest}
      {...hooks.root({ className, props: rest, data: { variant } })}
      layout={variant === 'compact' ? 'inline' : 'stacked'}
    >
      {changes.map((change) => {
        const type = change.type ?? 'value';
        const hasAttribution = Boolean(change.time) || change.person !== undefined;
        return (
          <DescriptionRow
            key={toKeyIdentity(change.id)}
            label={change.label}
            className={hooks.slotClass('change')}
            data-change={resolveChangeKind(change.before, change.after)}
            data-type={type}
            secondary={
              hasAttribution ? (
                <Attribution
                  time={change.time}
                  person={change.person}
                  showAvatar={showAvatar}
                  fallbackAfterDays={fallbackAfterDays}
                  getNow={getNow}
                  className={hooks.slotClass('attribution')}
                />
              ) : null
            }
          >
            <ChangeValues
              type={type}
              before={change.before}
              after={change.after}
              variant={variant}
              renderValue={renderValue}
            />
          </DescriptionRow>
        );
      })}
    </DescriptionList>
  );
}
