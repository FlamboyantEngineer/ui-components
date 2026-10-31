import { describe, expect, it } from 'vitest';
import {
  formatIsoDate,
  parseIsoDate,
  parseIsoDateTime,
  parseIsoTime,
} from '../../primitives/index.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  currentDateValue,
  findBoundIssue,
  formatDateValue,
  isUnavailableValue,
} from './date-values.js';

const pad = (part: number) => String(part).padStart(2, '0');
const plain = (text: string) => text.replace(/\s/g, ' ');

/** The local wall time of a `Date` as a floating ISO text, to the minute. */
function toFloating(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

describe('date values', () => {
  it('UIC-DATE-TIME-FIELD-1.2 reads ISO 8601 texts by kind and refuses unreadable ones', () => {
    expect(parseIsoDate('2026-04-13')?.toString()).toBe('2026-04-13');
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-04-13T10:00')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoTime('13:45')?.hour).toBe(13);
    expect(parseIsoTime('13:45:30')?.second).toBe(30);
    expect(parseIsoTime('25:00')).toBeNull();
    expect(parseIsoDateTime('not a date')).toBeNull();
    expect(parseIsoDateTime('2026-04-13')).toBeNull();
    expect(parseIsoDateTime('2026-04-13T25:00')).toBeNull();
    expect(parseIsoDateTime(null)).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-1.2 writes each kind back as the text it was read from', () => {
    for (const text of ['2026-04-13', '2026-12-31']) {
      expect(formatIsoDate(requireDefined(parseIsoDate(text)))).toBe(text);
    }
    expect(formatIsoDate(requireDefined(parseIsoTime('07:05')))).toBe('07:05');
    expect(formatIsoDate(requireDefined(parseIsoTime('07:05:09')), 'second')).toBe('07:05:09');
    expect(formatIsoDate(requireDefined(parseIsoDateTime('2026-04-13T13:45')))).toBe(
      '2026-04-13T13:45',
    );
    expect(formatIsoDate(requireDefined(parseIsoDateTime('2026-04-13T13:45:30')), 'second')).toBe(
      '2026-04-13T13:45:30',
    );
    const zoned = '2026-04-13T12:00:00+09:00[Asia/Tokyo]';
    expect(formatIsoDate(requireDefined(parseIsoDateTime(zoned, 'Asia/Tokyo')))).toBe(zoned);
  });

  it('UIC-DATE-TIME-FIELD-4.2 truncates a repeated hour within the occurrence it is in', () => {
    const zone = 'America/New_York';
    const second = requireDefined(parseIsoDateTime('2026-11-01T06:30:45.123Z', zone));
    const first = requireDefined(parseIsoDateTime('2026-11-01T05:30:45.123Z', zone));
    expect(formatIsoDate(second, 'hour')).toBe('2026-11-01T01:00:00-05:00[America/New_York]');
    expect(formatIsoDate(second)).toBe('2026-11-01T01:30:00-05:00[America/New_York]');
    expect(formatIsoDate(second, 'second')).toBe('2026-11-01T01:30:45-05:00[America/New_York]');
    expect(formatIsoDate(first, 'hour')).toBe('2026-11-01T01:00:00-04:00[America/New_York]');
    expect(formatIsoDate(first)).toBe('2026-11-01T01:30:00-04:00[America/New_York]');
    expect(formatIsoDate(first, 'second')).toBe('2026-11-01T01:30:45-04:00[America/New_York]');
    // Lord Howe Island falls back half an hour: 01:30 to 01:59 repeat, 01:00 occurs once.
    const lordHowe = 'Australia/Lord_Howe';
    const repeated = requireDefined(parseIsoDateTime('2026-04-04T15:15:30Z', lordHowe));
    expect(formatIsoDate(repeated)).toBe('2026-04-05T01:45:00+10:30[Australia/Lord_Howe]');
    expect(formatIsoDate(repeated, 'hour')).toBe('2026-04-05T01:00:00+11:00[Australia/Lord_Howe]');
    // A wall time the zone skips moves forward, as before.
    const skipped = requireDefined(parseIsoDateTime('2026-03-08T07:30:00Z', zone));
    expect(formatIsoDate(skipped, 'hour')).toBe('2026-03-08T03:00:00-04:00[America/New_York]');
  });

  it('UIC-DATE-TIME-FIELD-1.2 keeps four-digit years in floating date and time texts', () => {
    for (const year of ['0001', '0099', '0999', '1000']) {
      const text = `${year}-04-20T12:30`;
      const value = requireDefined(parseIsoDateTime(text));
      expect(formatIsoDate(value)).toBe(text);
      expect(formatIsoDate(value.add({ minutes: 1 }), 'second')).toBe(`${year}-04-20T12:31:00`);
    }
  });

  it('UIC-DATE-TIME-FIELD-1.2 reads an offset or zoned text as the local wall time of its instant', () => {
    const moment = new Date(2026, 3, 13, 13, 45);
    expect(formatIsoDate(requireDefined(parseIsoDateTime(moment.toISOString())))).toBe(
      toFloating(moment),
    );
    const zoned = `${moment.toISOString().slice(0, 19)}+00:00[UTC]`;
    expect(formatIsoDate(requireDefined(parseIsoDateTime(zoned)))).toBe(toFloating(moment));
  });

  it('UIC-DATE-TIME-FIELD-2.2 gives the date and minute of the clock in its zone', () => {
    const clock = { now: new Date('2026-04-20T15:30:45Z'), zone: 'Pacific/Kiritimati' };
    expect(currentDateValue('date', clock)).toBe('2026-04-21');
    expect(currentDateValue('date-time', clock)).toBe('2026-04-21T05:30');
    expect(currentDateValue('date', { ...clock, zone: 'UTC' })).toBe('2026-04-20');
    // A zoned field reads its own zone, whatever the clock's.
    expect(currentDateValue('date', { ...clock, timeZone: 'America/New_York' })).toBe('2026-04-20');
  });

  it('UIC-DATE-TIME-FIELD-1.4 finds the bound a value breaks and a reversed range', () => {
    const bounds = { minValue: '2026-04-01', maxValue: '2026-04-30' };
    expect(findBoundIssue('2026-04-13', 'date', bounds)).toBeNull();
    expect(findBoundIssue('2026-03-31', 'date', bounds)).toEqual({
      bound: 'min',
      limit: '2026-04-01',
    });
    expect(findBoundIssue('2026-05-01', 'date', bounds)).toEqual({
      bound: 'max',
      limit: '2026-04-30',
    });
    expect(findBoundIssue(null, 'date', bounds)).toBeNull();
    expect(findBoundIssue('08:00', 'time', { minValue: '09:00' })).toEqual({
      bound: 'min',
      limit: '09:00',
    });
    expect(findBoundIssue('09:00:00', 'time', { minValue: '09:00' })).toBeNull();
    expect(
      findBoundIssue('2026-04-13T08:00', 'date-time', { maxValue: '2026-04-13T07:00' }),
    ).toEqual({ bound: 'max', limit: '2026-04-13T07:00' });
    expect(findBoundIssue({ start: '2026-04-05', end: '2026-04-02' }, 'date-range', {})).toEqual({
      bound: 'min',
      limit: '2026-04-05',
    });
    expect(
      findBoundIssue({ start: '2026-04-02', end: '2026-05-02' }, 'date-range', bounds),
    ).toEqual({ bound: 'max', limit: '2026-04-30' });
    expect(findBoundIssue('someday', 'date', bounds)).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-1.6 formats values for the locale and keeps unreadable text', () => {
    expect(formatDateValue('2026-04-13', 'date', { locale: 'en-US' })).toBe('Apr 13, 2026');
    expect(plain(formatDateValue('13:45', 'time', { locale: 'en-US' }))).toBe('1:45 PM');
    expect(plain(formatDateValue('2026-04-13T13:45', 'date-time', { locale: 'en-US' }))).toBe(
      'Apr 13, 2026, 1:45 PM',
    );
    expect(
      plain(
        formatDateValue({ start: '2026-04-01', end: '2026-04-03' }, 'date-range', {
          locale: 'en-US',
        }),
      ),
    ).toBe('Apr 1 – 3, 2026');
    expect(
      formatDateValue({ start: '2026-04-01', end: 'later' }, 'date-range', { locale: 'en-US' }),
    ).toBe('2026-04-01 – later');
    expect(formatDateValue('someday', 'date', { locale: 'en-US' })).toBe('someday');
  });

  it('UIC-DATE-TIME-FIELD-3.1 asks about the date of a value, either end of a range included', () => {
    const asked: string[] = [];
    const isDateUnavailable = (date: string) => {
      asked.push(date);
      return date === '2026-04-19';
    };
    const options = { isDateUnavailable };
    expect(isUnavailableValue('2026-04-19', 'date', options)).toBe(true);
    expect(isUnavailableValue('2026-04-20', 'date', options)).toBe(false);
    expect(
      isUnavailableValue({ start: '2026-04-13', end: '2026-04-19' }, 'date-range', options),
    ).toBe(true);
    expect(isUnavailableValue('2026-04-19T10:00', 'date-time', options)).toBe(true);
    expect(
      isUnavailableValue('2026-04-18T20:00:00Z', 'date-time', {
        ...options,
        timeZone: 'Asia/Tokyo',
      }),
    ).toBe(true);
    expect(asked.at(-1)).toBe('2026-04-19');
    expect(isUnavailableValue('10:00', 'time', options)).toBe(false);
    expect(isUnavailableValue('2026-04-19', 'date', {})).toBe(false);
    expect(isUnavailableValue(null, 'date', options)).toBe(false);
  });

  it('UIC-DATE-TIME-FIELD-4.1 writes seconds at the second granularity and drops finer parts', () => {
    expect(formatIsoDate(requireDefined(parseIsoTime('07:05:09')), 'second')).toBe('07:05:09');
    expect(formatIsoDate(requireDefined(parseIsoTime('07:05:09')))).toBe('07:05');
    expect(formatIsoDate(requireDefined(parseIsoTime('07:05:09')), 'hour')).toBe('07:00');
    expect(formatIsoDate(requireDefined(parseIsoDateTime('2026-04-13T13:45:30')), 'hour')).toBe(
      '2026-04-13T13:00',
    );
    expect(
      currentDateValue('date-time', {
        granularity: 'second',
        now: new Date('2026-04-20T15:30:45.500Z'),
        zone: 'UTC',
      }),
    ).toBe('2026-04-20T15:30:45');
    expect(formatDateValue('13:45:30', 'time', { locale: 'en-US', granularity: 'second' })).toMatch(
      /1:45:30/,
    );
  });

  it('UIC-DATE-TIME-FIELD-4.2 reads any instant into the zone and writes zoned texts', () => {
    const tokyo = (text: string) => {
      const value = parseIsoDateTime(text, 'Asia/Tokyo');
      return value ? formatIsoDate(value) : null;
    };
    const noon = '2026-04-13T12:00:00+09:00[Asia/Tokyo]';
    expect(tokyo('2026-04-13T03:00:00.000Z')).toBe(noon);
    expect(tokyo('2026-04-13T05:00:00+02:00')).toBe(noon);
    expect(tokyo('2026-04-13T05:00:00+02:00[Europe/Paris]')).toBe(noon);
    expect(tokyo('2026-04-13T12:00')).toBe(noon);
    expect(tokyo('2026-04-13')).toBeNull();
    expect(
      formatIsoDate(
        requireDefined(parseIsoDateTime('2026-04-13T12:00:45', 'Asia/Tokyo')),
        'second',
      ),
    ).toBe('2026-04-13T12:00:45+09:00[Asia/Tokyo]');
    // A wall time the clocks skip reads as the time after the gap.
    expect(
      formatIsoDate(requireDefined(parseIsoDateTime('2026-03-29T02:30', 'Europe/Paris'))),
    ).toBe('2026-03-29T03:30:00+02:00[Europe/Paris]');
    expect(
      plain(formatDateValue(noon, 'date-time', { locale: 'en-US', timeZone: 'Asia/Tokyo' })),
    ).toBe('Apr 13, 2026, 12:00 PM');
    const clock = { now: new Date('2026-04-20T15:30:45Z'), zone: 'UTC' };
    expect(currentDateValue('date-time', { ...clock, timeZone: 'Asia/Tokyo' })).toBe(
      '2026-04-21T00:30:00+09:00[Asia/Tokyo]',
    );
    expect(currentDateValue('date', { ...clock, timeZone: 'Pacific/Kiritimati' })).toBe(
      '2026-04-21',
    );
  });

  it('UIC-DATE-TIME-FIELD-4.3 bounds and formats ranges of zoned dates and times', () => {
    const range = {
      start: '2026-04-13T09:00:00+00:00[UTC]',
      end: '2026-04-13T17:00:00+00:00[UTC]',
    };
    const options = { timeZone: 'UTC' };
    expect(
      findBoundIssue(range, 'date-time-range', {
        ...options,
        maxValue: '2026-04-13T14:00:00+02:00[Europe/Paris]',
      }),
    ).toEqual({ bound: 'max', limit: '2026-04-13T14:00:00+02:00[Europe/Paris]' });
    expect(
      findBoundIssue({ start: range.end, end: range.start }, 'date-time-range', options),
    ).toEqual({ bound: 'min', limit: range.end });
    expect(formatDateValue(range, 'date-time-range', { locale: 'en-US', ...options })).toMatch(
      /Apr 13, 2026/,
    );
  });
});

it('UIC-DATE-TIME-FIELD-3.1 checks interior days through leap dates and zoned date-time ranges', () => {
  expect(
    isUnavailableValue({ start: '2028-02-28', end: '2028-03-01' }, 'date-range', {
      isDateUnavailable: (date) => date === '2028-02-29',
    }),
  ).toBe(true);
  expect(
    isUnavailableValue(
      { start: '2026-04-15T15:30:00Z', end: '2026-04-17T02:00:00Z' },
      'date-time-range',
      { timeZone: 'Asia/Tokyo', isDateUnavailable: (date) => date === '2026-04-16' },
    ),
  ).toBe(true);
  expect(
    isUnavailableValue(
      { start: '2026-04-15T00:30:00Z', end: '2026-04-17T02:00:00Z' },
      'date-time-range',
      { timeZone: 'America/New_York', isDateUnavailable: (date) => date === '2026-04-15' },
    ),
  ).toBe(true);
});
