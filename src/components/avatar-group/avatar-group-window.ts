'use client';

import { useUiStrings } from '../../core/provider.js';
import { assignOccurrenceKeys, type KeyedValue } from '../../utils/stable-keys.js';
import { getDisplayName } from '../avatar/avatar.js';
import type { AvatarGroupPerson, AvatarGroupProps } from './avatar-group.js';

/** The people a strip shows and how many more it counts. */
export interface AvatarGroupWindow {
  visible: Array<KeyedValue<AvatarGroupPerson>>;
  hidden: Array<KeyedValue<AvatarGroupPerson>>;
  overflow: number;
}

type AvatarGroupWindowOptions = Pick<AvatarGroupProps, 'people' | 'maxVisible' | 'overflowCount'>;

interface PresenceLabelOptions
  extends Pick<AvatarGroupProps, 'people' | 'hiddenNames'>, Omit<AvatarGroupWindow, 'visible'> {
  ariaLabel: string | undefined;
}

function wholeCount(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function windowPeople({
  people,
  maxVisible,
  overflowCount,
}: AvatarGroupWindowOptions): AvatarGroupWindow {
  const limit =
    maxVisible === undefined || !Number.isFinite(maxVisible)
      ? people.length
      : wholeCount(maxVisible);
  const keyed = assignOccurrenceKeys(people, (person) => person.id);
  const hidden = keyed.slice(limit);
  return {
    visible: keyed.slice(0, limit),
    hidden,
    overflow: hidden.length + wholeCount(overflowCount),
  };
}

/** The group's name and the overflow's name, with blank names read as the `unnamed` string. */
export function usePresenceLabels({
  people,
  hiddenNames = [],
  ariaLabel,
  hidden,
  overflow,
}: PresenceLabelOptions) {
  const strings = useUiStrings();
  const displayName = (person: AvatarGroupPerson) => getDisplayName(person.name, strings.unnamed);
  const extraNames = hiddenNames.map((name) => name.trim()).filter(Boolean);
  const allNames = [...people.map(displayName), ...extraNames];
  return {
    group: ariaLabel?.trim() || allNames.join(', ') || strings.morePeople(overflow, []),
    overflow: strings.morePeople(overflow, [
      ...hidden.map(({ value }) => displayName(value)),
      ...extraNames,
    ]),
  };
}
