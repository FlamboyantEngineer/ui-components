import { describe, expect, it } from 'vitest';
import {
  buildTimeColumns,
  noTime,
  pickTimePart,
  stepTimeOption,
  type TimeColumn,
  wholeDay,
} from './time-columns-model.js';

const at = (hour: number, minute = 0, second = 0) => ({ hour, minute, second });
const enabledIds = (column: TimeColumn | undefined) =>
  column?.options.filter((entry) => !entry.isDisabled).map((entry) => entry.id) ?? [];

describe('time columns model', () => {
  it('UIC-DATE-TIME-FIELD-4.6 builds the columns of the granularity and hour cycle', () => {
    const units = (granularity: 'hour' | 'minute' | 'second', hourCycle: 12 | 24) =>
      buildTimeColumns(null, { granularity, hourCycle, bounds: wholeDay }).map((c) => c.unit);
    expect(units('hour', 24)).toEqual(['hour']);
    expect(units('minute', 24)).toEqual(['hour', 'minute']);
    expect(units('second', 12)).toEqual(['hour', 'minute', 'second', 'dayPeriod']);
    const [hours, minutes, period] = buildTimeColumns(at(13, 45), {
      granularity: 'minute',
      hourCycle: 12,
      bounds: wholeDay,
    });
    expect(hours?.options).toHaveLength(12);
    expect(hours?.selected).toBe(1);
    expect(minutes?.selected).toBe(45);
    expect(period?.selected).toBe(1);
    expect(
      buildTimeColumns(null, { granularity: 'minute', hourCycle: 24, bounds: wholeDay })[0],
    ).toMatchObject({ selected: null });
  });

  it('UIC-DATE-TIME-FIELD-4.6 disables the options the bounds allow no time of', () => {
    const bounds = { min: 9 * 3600 + 30 * 60, max: 17 * 3600 };
    const settings = { granularity: 'minute', hourCycle: 24, bounds } as const;
    const [hours, minutes] = buildTimeColumns(at(9, 45), settings);
    expect(enabledIds(hours)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(enabledIds(minutes)).toEqual(Array.from({ length: 30 }, (_, index) => index + 30));
    expect(enabledIds(buildTimeColumns(at(17), settings)[1])).toEqual([0]);
    const twelve = buildTimeColumns(at(10), { ...settings, hourCycle: 12 });
    expect(enabledIds(twelve[2])).toEqual([0, 1]);
    expect(enabledIds(buildTimeColumns(at(10), { ...settings, bounds: noTime })[0])).toEqual([]);
  });

  it('UIC-DATE-TIME-FIELD-4.6 picks a part, keeping the others and staying within the bounds', () => {
    const settings = { granularity: 'minute', hourCycle: 24, bounds: wholeDay } as const;
    expect(pickTimePart(null, { unit: 'hour', id: 9 }, settings)).toEqual(at(9));
    expect(pickTimePart(at(9, 15), { unit: 'minute', id: 40 }, settings)).toEqual(at(9, 40));
    const twelve = { ...settings, hourCycle: 12 } as const;
    expect(pickTimePart(at(13, 5), { unit: 'hour', id: 0 }, twelve)).toEqual(at(12, 5));
    expect(pickTimePart(at(1, 5), { unit: 'dayPeriod', id: 1 }, twelve)).toEqual(at(13, 5));
    expect(pickTimePart(at(13, 5), { unit: 'dayPeriod', id: 0 }, twelve)).toEqual(at(1, 5));
    const bounded = { ...settings, bounds: { min: 9 * 3600 + 30 * 60 + 20, max: 17 * 3600 } };
    expect(pickTimePart(at(10, 10), { unit: 'hour', id: 9 }, bounded)).toEqual(at(9, 31));
    expect(pickTimePart(at(16, 45), { unit: 'hour', id: 17 }, bounded)).toEqual(at(17));
    expect(
      pickTimePart(at(9, 0, 30), { unit: 'second', id: 5 }, { ...settings, granularity: 'second' }),
    ).toEqual(at(9, 0, 5));
  });

  it('UIC-DATE-TIME-FIELD-4.6 steps to the next or previous enabled option, wrapping', () => {
    const column: TimeColumn = {
      unit: 'hour',
      options: [0, 1, 2, 3].map((id) => ({ id, isDisabled: id === 2 })),
      selected: 1,
    };
    expect(stepTimeOption(column, 1)).toBe(3);
    expect(stepTimeOption(column, -1)).toBe(0);
    expect(stepTimeOption({ ...column, selected: 3 }, 1)).toBe(0);
    expect(stepTimeOption({ ...column, selected: 0 }, -1)).toBe(3);
    expect(stepTimeOption({ ...column, selected: null }, 1)).toBe(0);
    expect(stepTimeOption({ ...column, selected: null }, -1)).toBe(3);
    expect(stepTimeOption({ ...column, selected: 2 }, 1)).toBe(3);
    expect(
      stepTimeOption(
        { ...column, options: column.options.map((o) => ({ ...o, isDisabled: true })) },
        1,
      ),
    ).toBeNull();
  });
});
