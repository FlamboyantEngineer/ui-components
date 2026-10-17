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
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { useLayerZIndex } from '../portal/portal.js';
import { currentDateValue, type DateFieldValue, type DateTimeFieldMode } from './date-values.js';

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
  'actions',
  'action',
]);

/** The heading with month navigation and one grid per visible month. */
export function CalendarBody({ months }: { months: number }) {
  const strings = useUiStrings();
  return (
    <>
      <header {...hooks.slot('calendar-header')}>
        <IconButton
          slot="previous"
          icon="chevron-left"
          label={strings.previous}
          size="sm"
          className={hooks.slotClass('calendar-nav')}
        />
        <Heading className={hooks.slotClass('calendar-heading')} />
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

/**
 * The picker's quick actions: Today for a date, Now for a date and time, and Clear. Each picks its
 * value and closes the picker.
 */
function DateActions({
  mode,
  onPick,
}: {
  mode: DateTimeFieldMode;
  onPick: (value: DateFieldValue) => void;
}) {
  const strings = useUiStrings();
  const overlay = useContext(OverlayTriggerStateContext);
  const pick = (value: DateFieldValue) => {
    onPick(value);
    overlay?.close();
  };
  const action = (label: string, value: DateFieldValue) => (
    <Button
      variant="ghost"
      size="sm"
      className={hooks.slotClass('action')}
      onPress={() => pick(value)}
    >
      {label}
    </Button>
  );
  return (
    <div {...hooks.slot('actions')}>
      {mode === 'date' ? action(strings.today, currentDateValue('date')) : null}
      {mode === 'date-time' ? action(strings.now, currentDateValue('date-time')) : null}
      {action(strings.clear, null)}
    </div>
  );
}

/** The picker's popover on the `dropdown` layer: a dialog holding the calendar and the actions. */
export function CalendarPopover({
  mode,
  onPick,
  children,
}: {
  mode: DateTimeFieldMode;
  onPick: (value: DateFieldValue) => void;
  children: ReactNode;
}) {
  const zIndex = useLayerZIndex('dropdown');
  return (
    <Popover
      {...hooks.slot('popover', { layer: 'dropdown' })}
      offset={4}
      containerPadding={8}
      style={{ zIndex }}
    >
      <Dialog className={hooks.slotClass('dialog')}>
        {children}
        <DateActions mode={mode} onPick={onPick} />
      </Dialog>
    </Popover>
  );
}
