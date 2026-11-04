'use client';

import { ChevronDownGlyph } from '../../core/glyphs.js';
import { Glyph } from '../../core/provider.js';
import {
  Button as AriaButton,
  CalendarMonthPicker,
  CalendarYearPicker,
  type Key,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from '../../primitives/index.js';
import { DEFAULT_POINT_OFFSET } from '../../utils/overlay-defaults.js';
import { PopoverPresence } from '../popover/popover.js';
import { useLayerZIndex } from '../portal/portal.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';

interface HeadingSelectProps {
  unit: 'month' | 'year';
  'aria-label': string;
  value: Key;
  onChange: (key: Key | null) => void;
  items: ReadonlyArray<{ id: number; formatted: string }>;
}

/** A month or year choice of the calendar heading: a React Aria select of the picker's items. */
function HeadingSelect({ unit, items, ...select }: HeadingSelectProps) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <Select {...select} {...hooks.slot('calendar-select', { unit })}>
      <AriaButton className={hooks.slotClass('calendar-select-button')}>
        <SelectValue />
        <Glyph icon={ChevronDownGlyph} />
      </AriaButton>
      <PopoverPresence />
      <Popover
        {...hooks.slot('calendar-select-popover', { layer: 'dropdown' })}
        offset={DEFAULT_POINT_OFFSET}
        style={{ zIndex }}
      >
        <ListBox className={hooks.slotClass('calendar-select-list')} items={items}>
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.formatted}
              className={hooks.slotClass('calendar-select-option')}
            >
              {item.formatted}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}

/**
 * The calendar heading as a month select and a year select (React Aria `CalendarMonthPicker` and
 * `CalendarYearPicker`), which move the calendar straight to the chosen month or year.
 */
export function CalendarHeadingSelects() {
  return (
    <>
      <CalendarMonthPicker>
        {(picker) => <HeadingSelect unit="month" {...picker} />}
      </CalendarMonthPicker>
      <CalendarYearPicker>
        {(picker) => <HeadingSelect unit="year" {...picker} />}
      </CalendarYearPicker>
    </>
  );
}
