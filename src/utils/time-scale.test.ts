import { describe, expect, it } from 'vitest';
import { getLocalTimeZone } from '../primitives/index.js';
import {
  addTimeUnits,
  createTimeScale,
  floorToTimeUnit,
  type TimeScaleOptions,
} from './time-scale.js';

const utc = (options: Partial<TimeScaleOptions> = {}) =>
  createTimeScale({
    domain: ['2026-01-01', '2026-01-11'],
    range: [0, 100],
    timeZone: 'UTC',
    locale: 'en-US',
    ...options,
  });

describe('createTimeScale', () => {
  it('UIC-SCALES-2.1 maps dates and date-times to positions by elapsed time', () => {
    const scale = utc();
    expect(scale.map('2026-01-01')).toBe(0);
    expect(scale.map('2026-01-06')).toBe(50);
    expect(scale.map('2026-01-06T12:00:00Z')).toBeCloseTo(55);
    expect(scale.map('2026-01-06T13:00:00+01:00')).toBeCloseTo(55);
    expect(scale.map('2026-01-06T12:00')).toBeCloseTo(55);
    expect(scale.map('2026-01-21')).toBe(200);
    expect(scale.domain).toEqual(['2026-01-01', '2026-01-11']);
    expect(scale.range).toEqual([0, 100]);
    const flipped = utc({ range: [100, 0] });
    expect(flipped.map('2026-01-03')).toBeCloseTo(80);
  });

  it('UIC-SCALES-2.1 reads dates in the time zone and inverts positions to UTC instants', () => {
    const paris = utc({ timeZone: 'Europe/Paris' });
    expect(paris.map('2025-12-31T23:00:00Z')).toBe(0);
    expect(paris.invert(50)).toBe('2026-01-05T23:00:00.000Z');
    expect(utc().invert(55)).toBe('2026-01-06T12:00:00.000Z');
    expect(utc().invert(Number.NaN)).toBe('');
  });

  it('UIC-SCALES-2.2 keeps unreadable input truthful', () => {
    const scale = utc();
    expect(scale.map('soon')).toBeNaN();
    expect(scale.format('soon', 'day')).toBe('');
    const broken = utc({ domain: ['2026-01-01', 'later'] });
    expect(broken.map('2026-01-02')).toBeNaN();
    expect(broken.ticks()).toEqual([]);
    expect(broken.invert(10)).toBe('');
    const local = createTimeScale({ domain: ['2026-01-01', '2026-01-02'], range: [0, 1] });
    const zoned = createTimeScale({
      domain: ['2026-01-01', '2026-01-02'],
      range: [0, 1],
      timeZone: getLocalTimeZone(),
    });
    expect(local.map('2026-01-01T12:00:00Z')).toBe(zoned.map('2026-01-01T12:00:00Z'));
  });

  it('UIC-SCALES-2.3 ticks the starts of days, weeks, months, quarters and years in the domain', () => {
    const scale = utc({ domain: ['2026-01-15', '2026-07-20'] });
    expect(scale.ticks({ unit: 'month' }).map((tick) => tick.value)).toEqual([
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
    ]);
    expect(scale.ticks({ unit: 'quarter' }).map((tick) => tick.value)).toEqual([
      '2026-04-01',
      '2026-07-01',
    ]);
    expect(
      utc({ domain: ['2025-11-01', '2028-02-01'] })
        .ticks({ unit: 'year' })
        .map((tick) => tick.value),
    ).toEqual(['2026-01-01', '2027-01-01', '2028-01-01']);
    const days = utc({ domain: ['2026-01-01T06:00:00Z', '2026-01-03T00:00:00Z'] });
    expect(days.ticks({ unit: 'day' }).map((tick) => [tick.value, tick.position])).toEqual([
      ['2026-01-02', 1800 / 42],
      ['2026-01-03', 100],
    ]);
  });

  it('UIC-SCALES-2.3 starts weeks on the first day of the locale', () => {
    const domain = ['2026-03-01', '2026-03-20'] as const;
    expect(
      utc({ domain, locale: 'en-US' })
        .ticks({ unit: 'week' })
        .map((tick) => tick.value),
    ).toEqual(['2026-03-01', '2026-03-08', '2026-03-15']);
    expect(
      utc({ domain, locale: 'en-GB' })
        .ticks({ unit: 'week' })
        .map((tick) => tick.value),
    ).toEqual(['2026-03-02', '2026-03-09', '2026-03-16']);
  });

  it('UIC-SCALES-2.3 places ticks at midnight in the time zone, across daylight saving changes', () => {
    const scale = createTimeScale({
      domain: ['2026-03-28', '2026-03-31'],
      range: [0, 71],
      timeZone: 'Europe/Paris',
      locale: 'fr-FR',
    });
    expect(scale.ticks({ unit: 'day' }).map((tick) => [tick.value, tick.position])).toEqual([
      ['2026-03-28', 0],
      ['2026-03-29', 24],
      ['2026-03-30', 47],
      ['2026-03-31', 71],
    ]);
  });

  it('UIC-SCALES-2.4 chooses the smallest unit that fits the tick count', () => {
    const unitOf = (domain: readonly [string, string], count?: number) =>
      utc({ domain })
        .ticks({ count })
        .map((tick) => tick.value);
    expect(unitOf(['2026-01-01', '2026-01-06'])).toHaveLength(6);
    expect(unitOf(['2026-01-01', '2026-02-15'])).toEqual([
      '2026-01-04',
      '2026-01-11',
      '2026-01-18',
      '2026-01-25',
      '2026-02-01',
      '2026-02-08',
      '2026-02-15',
    ]);
    expect(unitOf(['2026-01-01', '2026-06-30'])).toHaveLength(6);
    expect(unitOf(['2026-01-01', '2027-06-30'])).toEqual([
      '2026-01-01',
      '2026-04-01',
      '2026-07-01',
      '2026-10-01',
      '2027-01-01',
      '2027-04-01',
    ]);
    expect(unitOf(['2026-01-01', '2026-01-31'], 40)).toHaveLength(31);
    expect(unitOf(['1990-06-01', '2026-01-01'])).toEqual([
      '1995-01-01',
      '2000-01-01',
      '2005-01-01',
      '2010-01-01',
      '2015-01-01',
      '2020-01-01',
      '2025-01-01',
    ]);
  });

  it('UIC-SCALES-2.5 labels ticks for the unit and the locale', () => {
    const scale = utc({ domain: ['2026-01-01', '2026-12-31'] });
    expect(scale.format('2026-03-05', 'day')).toBe('Mar 5');
    expect(scale.format('2026-03-01', 'week')).toBe('Mar 1');
    expect(scale.format('2026-03-01', 'month')).toBe('Mar 2026');
    expect(scale.format('2026-04-01', 'quarter')).toBe('Apr 2026');
    expect(scale.format('2026-04-01', 'year')).toBe('2026');
    expect(scale.ticks({ unit: 'quarter' }).map((tick) => tick.label)).toEqual([
      'Jan 2026',
      'Apr 2026',
      'Jul 2026',
      'Oct 2026',
    ]);
    const french = utc({ locale: 'fr-FR' });
    expect(french.format('2026-03-05', 'day')).toBe('5 mars');
    const tokyo = utc({ timeZone: 'Asia/Tokyo' });
    expect(tokyo.format('2026-03-04T20:00:00Z', 'day')).toBe('Mar 5');
  });
});

describe('floorToTimeUnit and addTimeUnits', () => {
  it('UIC-SCALES-2.6 finds the first day of the calendar unit holding a date', () => {
    expect(floorToTimeUnit('2026-03-18', 'day')).toBe('2026-03-18');
    expect(floorToTimeUnit('2026-03-18', 'week', 'en-US')).toBe('2026-03-15');
    expect(floorToTimeUnit('2026-03-18', 'week', 'en-GB')).toBe('2026-03-16');
    expect(floorToTimeUnit('2026-03-18', 'month')).toBe('2026-03-01');
    expect(floorToTimeUnit('2026-05-18', 'quarter')).toBe('2026-04-01');
    expect(floorToTimeUnit('2026-05-18', 'year')).toBe('2026-01-01');
    expect(floorToTimeUnit('soon', 'month')).toBe('');
  });

  it('UIC-SCALES-2.6 moves a date by whole calendar units, clamping month ends', () => {
    expect(addTimeUnits('2026-03-18', 'day', -20)).toBe('2026-02-26');
    expect(addTimeUnits('2026-03-18', 'week', 2)).toBe('2026-04-01');
    expect(addTimeUnits('2026-01-31', 'month', 1)).toBe('2026-02-28');
    expect(addTimeUnits('2026-11-15', 'quarter', 1)).toBe('2027-02-15');
    expect(addTimeUnits('2024-02-29', 'year', 1)).toBe('2025-02-28');
    expect(addTimeUnits('2026-03-18', 'day', 1.7)).toBe('2026-03-19');
    expect(addTimeUnits('soon', 'day', 1)).toBe('');
    expect(addTimeUnits('2026-03-18', 'day', Number.NaN)).toBe('');
  });
});
