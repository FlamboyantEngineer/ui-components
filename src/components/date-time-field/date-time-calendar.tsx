import { useContext, type ReactNode } from 'react';
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Dialog,
  Heading,
  OverlayTriggerStateContext,
  Popover,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { CalendarHeadingSelects } from './date-time-calendar-heading.js';
import type { DateControlSettings } from './date-time-pickers.js';
import { currentDateValue, type DateFieldValue, type DateTimeFieldMode } from './date-values.js';

/** A named value offered beside the calendar, such as `Last 7 days`. */
export interface DateTimeFieldPreset<V> {
  label: string;
  /** The value the preset sets, in the field's format. */
  value: V;
}

/** How the calendar heading shows its month: as text, or as month and year selects. */
export type DateTimeFieldCalendarHeading = 'text' | 'select';

interface CalendarPopoverProps {
  mode: DateTimeFieldMode;
  settings: DateControlSettings;
  onPick: (value: DateFieldValue) => void;
  children: ReactNode;
}

const hooks = createHooks('date-time-field', [
  'popover',
  'dialog',
  'calendar-header',
  'calendar-heading',
  'calendar-nav',
  'calendar-months',
  'calendar-grid',
  'calendar-head',
  'calendar-weekday',
  'calendar-body',
  'calendar-cell',
  'presets',
  'preset',
  'actions',
  'action',
]);

/** The heading (text or selects) with month navigation, and one grid per visible month. */
export function CalendarBody({
  months,
  heading,
}: {
  months: number;
  heading: DateTimeFieldCalendarHeading;
}) {
  const strings = useUiStrings();
  return (
    <>
      {/* The month navigation is no page banner, wherever the calendar is drawn. */}
      <header {...hooks.slot('calendar-header')} role="none">
        <IconButton
          slot="previous"
          icon="chevron-left"
          label={strings.previous}
          size="sm"
          className={hooks.slotClass('calendar-nav')}
        />
        {heading === 'select' ? (
          <CalendarHeadingSelects />
        ) : (
          <Heading className={hooks.slotClass('calendar-heading')} />
        )}
        <IconButton
          slot="next"
          icon="chevron-right"
          label={strings.next}
          size="sm"
          className={hooks.slotClass('calendar-nav')}
        />
      </header>
      <div {...hooks.slot('calendar-months')}>
        {Array.from({ length: months }, (_, offset) => (
          <CalendarGrid
            key={offset}
            className={hooks.slotClass('calendar-grid')}
            offset={offset > 0 ? { months: offset } : undefined}
          >
            <CalendarGridHeader className={hooks.slotClass('calendar-head')}>
              {(day) => (
                <CalendarHeaderCell className={hooks.slotClass('calendar-weekday')}>
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody className={hooks.slotClass('calendar-body')}>
              {(date) => <CalendarCell date={date} className={hooks.slotClass('calendar-cell')} />}
            </CalendarGridBody>
          </CalendarGrid>
        ))}
      </div>
    </>
  );
}

/** Picks a value and closes the picker. */
function usePick(onPick: (value: DateFieldValue) => void) {
  const overlay = useContext(OverlayTriggerStateContext);
  return (value: DateFieldValue) => {
    onPick(value);
    overlay?.close();
  };
}

/** The caller's presets beside the calendar; one the field would refuse is disabled. */
function DatePresets({ settings, onPick }: Pick<CalendarPopoverProps, 'settings' | 'onPick'>) {
  const pick = usePick(onPick);
  if (settings.presets.length === 0) return null;
  return (
    <div {...hooks.slot('presets')}>
      {settings.presets.map((preset) => (
        <Button
          key={preset.label}
          variant="ghost"
          size="sm"
          className={hooks.slotClass('preset')}
          isDisabled={!settings.isPickable(preset.value)}
          onPress={() => pick(preset.value)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}

/**
 * The picker's quick actions: Today for a date, Now for a date and time, and Clear unless the field
 * is required. Each picks its value, read when pressed, and closes the picker.
 */
function DateActions({ mode, settings, onPick }: Omit<CalendarPopoverProps, 'children'>) {
  const strings = useUiStrings();
  const pick = usePick(onPick);
  const action = (label: string, getValue: () => DateFieldValue, isDisabled = false) => (
    <Button
      variant="ghost"
      size="sm"
      className={hooks.slotClass('action')}
      isDisabled={isDisabled}
      onPress={() => pick(getValue())}
    >
      {label}
    </Button>
  );
  return (
    <div {...hooks.slot('actions')}>
      {mode === 'date' ? action(strings.today, () => currentDateValue('date', settings)) : null}
      {mode === 'date-time'
        ? action(strings.now, () => currentDateValue('date-time', settings))
        : null}
      {settings.isRequired ? null : action(strings.clear, () => null, !settings.canClear)}
    </div>
  );
}

/**
 * The picker's popover on the `dropdown` layer: a dialog holding the presets, the calendar and the
 * actions.
 */
export function CalendarPopover({ mode, settings, onPick, children }: CalendarPopoverProps) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <Popover
      {...hooks.slot('popover', { layer: 'dropdown' })}
      offset={4}
      containerPadding={8}
      style={{ zIndex }}
    >
      <Dialog className={hooks.slotClass('dialog')}>
        <DatePresets settings={settings} onPick={onPick} />
        {children}
        <DateActions mode={mode} settings={settings} onPick={onPick} />
      </Dialog>
    </Popover>
  );
}
