// Date time field cases for host-owned and initially open popups, and hour granularity.

import { useState } from 'react';
import {
  DateTimeField,
  type DateTimeFieldValue,
} from '../../src/components/date-time-field/date-time-field.js';
import { MountOnDemand } from './lab-form.js';
import { useHostOpen } from './lab-open-state.js';
import { LabOutput } from './lab-output.js';

type PopupMode = 'date' | 'date-time';

const firstValues: Record<PopupMode, string> = {
  date: '2026-04-13',
  'date-time': '2026-04-13T09:30',
};

/**
 * The host holds whether the popup is open (see `useHostOpen`): its buttons open, close and lock
 * the field, and each request the field makes (the trigger, Escape, a pick, locking) shows first.
 * The date mode opens a calendar; the date-time mode adds hour and minute columns under it.
 */
function HostOpen({ mode }: { mode: PopupMode }) {
  const host = useHostOpen(`${mode} field`);
  const [value, setValue] = useState<string | null>(firstValues[mode]);
  return (
    <div data-lab-demo={`host-open-${mode}`}>
      <DateTimeField
        label={`Host-opened ${mode}`}
        mode={mode}
        value={value}
        onChange={setValue}
        {...host.props}
      />
      {host.panel}
      <LabOutput name={`Value ${mode}`}>{value ?? 'none'}</LabOutput>
    </div>
  );
}

/** A popup open from its first render, uncontrolled; the reader closes it as usual. */
function InitiallyOpen({ mode }: { mode: PopupMode }) {
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <MountOnDemand label={`an initially open ${mode} field`}>
      <DateTimeField
        label={`Open at first, ${mode}`}
        mode={mode}
        defaultValue={firstValues[mode]}
        defaultOpen
        onOpenChange={(next) => setChanges((list) => [...list, next ? 'open' : 'close'])}
      />
      <LabOutput name={`Open at first ${mode}`}>{changes.join(', ') || 'none'}</LabOutput>
    </MountOnDemand>
  );
}

export function OpenPopups() {
  return (
    <>
      <HostOpen mode="date" />
      <HostOpen mode="date-time" />
      <InitiallyOpen mode="date" />
      <InitiallyOpen mode="date-time" />
    </>
  );
}

/**
 * Hour granularity: the segments stop at the hour and the value keeps whole hours. The date and
 * time's picker lists only hours, and on 13 April only those from 8:00 to 18:00.
 */
export function HourGranularity() {
  const [instant, setInstant] = useState<DateTimeFieldValue<'date-time'>>('2026-04-13T14:00');
  const [hour, setHour] = useState<DateTimeFieldValue<'time'>>('10:00');
  return (
    <>
      <DateTimeField
        label="Delivery hour"
        mode="date-time"
        granularity="hour"
        hourCycle={24}
        minValue="2026-04-13T08:00"
        maxValue="2026-04-13T18:00"
        description="On 13 April, between 8:00 and 18:00."
        defaultValue="2026-04-13T14:00"
        onCommit={setInstant}
        data-lab-field="hour-date-time"
      />
      <LabOutput name="Delivery hour committed">{instant ?? 'none'}</LabOutput>
      <DateTimeField
        label="Opening hour"
        mode="time"
        granularity="hour"
        hourCycle={24}
        defaultValue="10:00"
        onCommit={setHour}
        data-lab-field="hour-time"
      />
      <LabOutput name="Opening hour committed">{hour ?? 'none'}</LabOutput>
    </>
  );
}
