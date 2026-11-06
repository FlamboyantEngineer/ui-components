// The time zones a time zone field offers, each described at a reference instant
// (specs/TIME-ZONE-FIELD.md).

/** A zone as the field lists it. */
export interface TimeZoneEntry {
  /** The IANA identifier, as given: the stored value. */
  id: Key;
  /** Its offset from UTC at the reference instant, in minutes, or `null` without one. */
  offset: number | null;
  /** The offset in the locale, such as `GMT+05:30`, or empty without a reference instant. */
  offsetText: string;
  /** The zone's generic name in the locale, such as `India Standard Time`, when it has one. */
  name: string;
}

type Key = string;

/** Whether `id` is a time zone the platform reads. */
export function isTimeZone(id: string): boolean {
  if (id === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: id });
    return true;
  } catch {
    return false;
  }
}

/** Every zone the platform lists, with `UTC`, which some platforms leave out. */
export function listPlatformZones(): string[] {
  const zones =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  return zones.includes('UTC') ? zones : ['UTC', ...zones];
}

/** The minutes of a `GMT±hh:mm` offset text, `GMT` alone being zero. */
function readOffset(text: string): number {
  const match = /([+-−])(\d{1,2})(?::?(\d{2}))?/u.exec(text);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '+' ? minutes : -minutes;
}

function readPart(format: Intl.DateTimeFormat, at: Date): string {
  return format.formatToParts(at).find((part) => part.type === 'timeZoneName')?.value ?? '';
}

/**
 * Describes each zone at `at`: its offset then, which daylight saving time and half- or
 * quarter-hour offsets change, its offset text and its generic name in `locale`. Without `at`, the
 * zones carry only their names. A zone the platform cannot read is left out.
 */
export function describeZones(
  ids: readonly string[],
  locale: string,
  at: Date | null,
): TimeZoneEntry[] {
  const entries: TimeZoneEntry[] = [];
  for (const id of new Set(ids)) {
    if (!isTimeZone(id)) continue;
    const named = new Intl.DateTimeFormat(locale, { timeZone: id, timeZoneName: 'longGeneric' });
    const name = readPart(named, at ?? new Date(0));
    if (!at) {
      entries.push({ id, offset: null, offsetText: '', name });
      continue;
    }
    const offsetText = readPart(
      new Intl.DateTimeFormat(locale, { timeZone: id, timeZoneName: 'longOffset' }),
      at,
    );
    const neutral = new Intl.DateTimeFormat('en-US', { timeZone: id, timeZoneName: 'longOffset' });
    entries.push({ id, offset: readOffset(readPart(neutral, at)), offsetText, name });
  }
  return entries;
}

/** Zones in offset order, west to east, then by identifier; zones without an offset keep theirs. */
export function sortZones(entries: readonly TimeZoneEntry[]): TimeZoneEntry[] {
  return [...entries].sort(
    (a, b) => (a.offset ?? 0) - (b.offset ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
