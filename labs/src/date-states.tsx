import {
  DateTimeField,
  type DateTimeFieldDateState,
} from '../../src/components/date-time-field/date-time-field.js';

export function getCalendarState(date: string): DateTimeFieldDateState | undefined {
  if (date === '2026-04-10') return { tone: 'success', description: 'Spring holiday' };
  if (date === '2026-04-14')
    return { tone: 'danger', isDisabled: true, description: 'Closed for a holiday' };
  if (date === '2026-04-16' || date === '2026-04-21')
    return { isTaken: true, description: 'Appointment taken' };
  if ([0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay()))
    return { isDisabled: true, description: 'Closed on weekends' };
  if (date === '2026-04-23') return { tone: 'info', description: 'Special opening' };
  if (date === '2026-04-24') return { tone: 'warning', description: 'Limited appointments' };
  if (date === '2026-04-27') return { tone: 'neutral', description: 'Community day' };
  return undefined;
}
export function DateStates() {
  return (
    <>
      <DateTimeField
        label="Appointment"
        defaultValue="2026-04-13"
        getDateState={getCalendarState}
        data-lab-field="date-states"
      />
      <DateTimeField
        label="Available range"
        mode="date-range"
        defaultValue={{ start: '2026-04-06', end: '2026-04-09' }}
        getDateState={getCalendarState}
        presets={[
          { label: 'Available weekdays', value: { start: '2026-04-06', end: '2026-04-09' } },
          {
            label: 'Crosses a taken appointment',
            value: { start: '2026-04-15', end: '2026-04-17' },
          },
        ]}
        data-lab-field="date-states-range"
      />
    </>
  );
}
