import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimeZoneField } from './time-zone-field.js';
import { describeZones, sortZones } from './time-zones.js';

const zones = ['Asia/Kathmandu', 'America/New_York', 'UTC', 'Asia/Kolkata', 'Australia/Lord_Howe'];
const july = new Date('2026-07-01T12:00:00Z');
const january = new Date('2026-01-15T12:00:00Z');

const trigger = () => screen.getByRole('button', { name: /Zone$/ });
const optionLabels = () =>
  screen
    .getAllByRole('option')
    .map((option) => option.querySelector('.ui-select-field__option-label')?.textContent);

describe('describeZones', () => {
  it('UIC-TIME-ZONE-FIELD-1.2 reads offsets at the reference instant, half and quarter hours included', () => {
    const summer = sortZones(describeZones(zones, 'en-US', july));
    expect(summer.map(({ id, offset }) => [id, offset])).toEqual([
      ['America/New_York', -240],
      ['UTC', 0],
      ['Asia/Kolkata', 330],
      ['Asia/Kathmandu', 345],
      ['Australia/Lord_Howe', 630],
    ]);
    expect(
      summer.map((entry) => entry.offsetText).filter((text) => text !== summer[1]?.offsetText),
    ).toEqual(['GMT-04:00', 'GMT+05:30', 'GMT+05:45', 'GMT+10:30']);
    const winter = describeZones(zones, 'en-US', january);
    expect(winter.find((entry) => entry.id === 'America/New_York')?.offset).toBe(-300);
    expect(winter.find((entry) => entry.id === 'Australia/Lord_Howe')?.offset).toBe(660);
  });

  it('UIC-TIME-ZONE-FIELD-1.3 leaves out unreadable zones and offsets without a reference', () => {
    const entries = describeZones(['Mars/Base', 'Asia/Kolkata', 'Asia/Kolkata'], 'en-US', null);
    expect(entries).toEqual([
      { id: 'Asia/Kolkata', offset: null, offsetText: '', name: 'India Standard Time' },
    ]);
  });
});

describe('TimeZoneField', () => {
  it('UIC-TIME-ZONE-FIELD-1.1 UIC-TIME-ZONE-FIELD-1.2 lists zones by offset and finds them by id, name or offset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <form aria-label="Settings">
        <TimeZoneField
          label="Zone"
          name="zone"
          zones={zones}
          referenceDate={july}
          defaultValue="UTC"
          onChange={onChange}
        />
      </form>,
    );
    expect(trigger().closest('.ui-time-zone-field')).toHaveClass('ui-select-field');
    await user.click(trigger());
    expect(optionLabels()).toEqual([
      'America/New York',
      'UTC',
      'Asia/Kolkata',
      'Asia/Kathmandu',
      'Australia/Lord Howe',
    ]);
    expect(screen.getByRole('option', { name: /Kolkata/ })).toHaveTextContent(
      'GMT+05:30 · India Standard Time',
    );
    await user.keyboard('india');
    expect(optionLabels()).toEqual(['Asia/Kolkata']);
    await user.clear(screen.getByRole('searchbox'));
    await user.keyboard('+05:45');
    await user.click(screen.getByRole('option', { name: /Kathmandu/ }));
    expect(onChange).toHaveBeenLastCalledWith('Asia/Kathmandu');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Settings' });
    expect(new FormData(form).get('zone')).toBe('Asia/Kathmandu');
  });

  it('UIC-TIME-ZONE-FIELD-1.3 keeps a chosen alias outside the zones and flags an unknown one', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TimeZoneField
        label="Zone"
        zones={['UTC']}
        referenceDate={january}
        value="US/Eastern"
        validationMode="immediate"
      />,
    );
    expect(trigger()).toHaveTextContent('US/Eastern');
    await user.click(trigger());
    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(2);
    await user.keyboard('{Escape}');
    rerender(
      <TimeZoneField label="Zone" zones={['UTC']} value="Mars/Base" validationMode="immediate" />,
    );
    expect(screen.getByText('Not a known time zone')).toBeInTheDocument();
  });
});
