'use client';

import { useMemo, useState } from 'react';
import { useNow } from '../../core/clock.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import type { FieldStateOptions } from '../field/field.js';
import {
  SelectField,
  type SelectFieldOption,
  type SelectFieldProps,
} from '../select-field/select-field.js';
import {
  describeZones,
  isTimeZone,
  listPlatformZones,
  sortZones,
  type TimeZoneEntry,
} from './time-zones.js';

export const timeZoneFieldHooks = createHooks('time-zone-field', []);

type SelectListProps = Exclude<SelectFieldProps<'single'>, { mode: 'tree' }>;

/** The select props a time zone field passes on: all but its options and its value's type. */
type PassedProps = Omit<
  SelectListProps,
  | keyof FieldStateOptions<Key | null>
  | 'options'
  | 'mode'
  | 'selectionMode'
  | 'emptyLabel'
  | 'loadOptions'
  | 'minSearchLength'
  | 'searchDelay'
  | 'chipPlacement'
  | 'isMixed'
  | 'maxValues'
  | 'renderOption'
>;

export interface TimeZoneFieldProps extends PassedProps, FieldStateOptions<string | null> {
  /**
   * The IANA identifiers offered, such as a host's supported set, in any order. Defaults to every
   * zone the platform lists. A chosen zone outside them that the platform reads is offered too.
   */
  zones?: readonly string[] | undefined;
  /**
   * The instant each zone's offset is read at, which daylight saving time changes. Defaults to now
   * by the provider's clock; before hydration, zones show without offsets.
   */
  referenceDate?: Date | undefined;
}

const quarterHour = 900_000;

/** The listed zone as a select option: its identifier, then its offset and generic name. */
function toOption(entry: TimeZoneEntry): SelectFieldOption {
  const details = [entry.offsetText, entry.name].filter(Boolean).join(' · ');
  return { id: entry.id, label: entry.id.replaceAll('_', ' '), description: details || undefined };
}

/**
 * The options: until the list first opens only the chosen zone, so a field that stays closed
 * describes one zone; then every offered zone, described at the reference instant (read to the
 * quarter hour, which every offset change falls on) and in offset order. The offered zones are
 * described once for the list, and a change of the chosen zone describes that zone alone.
 */
function useZoneOptions(props: TimeZoneFieldProps, isOpened: boolean): SelectFieldOption[] {
  const { locale } = useLocale();
  const now = useNow();
  const at = props.referenceDate ?? now;
  const instant = at ? Math.floor(at.getTime() / quarterHour) * quarterHour : null;
  const chosen = props.value ?? props.defaultValue ?? null;
  const { zones } = props;
  const offered = useMemo(() => {
    const ids = isOpened ? (zones ?? listPlatformZones()) : [];
    return describeZones(ids, locale, instant === null ? null : new Date(instant));
  }, [isOpened, zones, locale, instant]);
  return useMemo(() => {
    const isOffered = chosen === null || offered.some((entry) => entry.id === chosen);
    const extra = isOffered
      ? []
      : describeZones([chosen], locale, instant === null ? null : new Date(instant));
    return sortZones([...offered, ...extra]).map(toOption);
  }, [offered, chosen, locale, instant]);
}

/**
 * A field that chooses an IANA time zone from a searchable, virtualized list: each zone by its
 * identifier, with its offset at a reference instant and its generic name in the locale, in
 * offset order. The value, the form value and every callback use the identifier; a value the
 * platform does not read as a zone shows as itself and is invalid.
 */
export function TimeZoneField(props: TimeZoneFieldProps) {
  const { zones: _zones, referenceDate: _reference, className, onOpenChange, ...rest } = props;
  const [isOpened, setOpened] = useState(Boolean(props.isOpen ?? props.defaultOpen));
  const options = useZoneOptions(props, isOpened || props.isOpen === true);
  const strings = useUiStrings();
  const { validate } = props;
  // Every option's id is a string, so the select's keys are the zone identifiers.
  const select = rest as SelectListProps;
  return (
    <SelectField
      filterable
      virtualized
      {...select}
      className={mergeClassNames(timeZoneFieldHooks.className, className)}
      options={options}
      validate={(value) =>
        value !== null && !isTimeZone(String(value))
          ? { severity: 'error', message: strings.timeZoneUnknown, validity: 'typeMismatch' }
          : validate?.(value === null ? null : String(value))
      }
      onOpenChange={(isOpen) => {
        if (isOpen) setOpened(true);
        onOpenChange?.(isOpen);
      }}
    />
  );
}
