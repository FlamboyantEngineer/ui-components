import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Form } from '../form/form.js';
import { type DateRangeValue, DateTimeField } from './date-time-field.js';

function entries(form: HTMLFormElement) {
  return [...new FormData(form).entries()].map(([name, value]) => `${name}=${String(value)}`);
}

describe('DateTimeField forms', () => {
  it('UIC-DATE-TIME-FIELD-4.4 submits single values and range ends as canonical text', () => {
    const { container } = render(
      <form>
        <DateTimeField label="Due" name="due" defaultValue="2026-04-13" />
        <DateTimeField label="At" mode="time" name="at" />
        <DateTimeField
          label="Stay"
          mode="date-range"
          startName="from"
          endName="to"
          defaultValue={{ start: '2026-04-06', end: '2026-04-10' }}
        />
        <DateTimeField label="Off" name="off" defaultValue="2026-01-01" isDisabled />
      </form>,
    );
    expect(entries(container.querySelector('form') as HTMLFormElement)).toEqual([
      'due=2026-04-13',
      'at=',
      'from=2026-04-06',
      'to=2026-04-10',
    ]);
  });
});

describe('DateTimeField range errors from a form', () => {
  const range = { start: '2026-04-20', end: '2026-04-22' };

  function Ranged({ value }: { value: DateRangeValue }) {
    return (
      <DateTimeField label="Stay" mode="date-range" startName="start" endName="end" value={value} />
    );
  }

  it('UIC-DATE-TIME-FIELD-4.4 UIC-FIELD-3.9 shows an endpoint error and blocks the submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <Form validationErrors={{ end: 'Endpoint rejected' }} onSubmit={onSubmit}>
        <Ranged value={range} />
        <button type="submit">Save</button>
      </Form>,
    );
    expect(screen.getByText('Endpoint rejected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('UIC-DATE-TIME-FIELD-4.4 UIC-FIELD-3.9 clears an endpoint error once that end changes', () => {
    const errors = { start: 'Start rejected', end: 'End rejected' };
    const { rerender } = render(
      <Form validationErrors={errors}>
        <Ranged value={range} />
      </Form>,
    );
    expect(screen.getByText('Start rejected')).toBeInTheDocument();
    rerender(
      <Form validationErrors={errors}>
        <Ranged value={{ ...range, start: '2026-04-19' }} />
      </Form>,
    );
    expect(screen.queryByText('Start rejected')).not.toBeInTheDocument();
    expect(screen.getByText('End rejected')).toBeInTheDocument();
    rerender(
      <Form validationErrors={errors}>
        <Ranged value={{ start: '2026-04-19', end: '2026-04-23' }} />
      </Form>,
    );
    expect(screen.queryByText('End rejected')).not.toBeInTheDocument();
  });
});

describe('DateTimeField native reset', () => {
  function segmentTexts(container: HTMLElement) {
    return [...container.querySelectorAll('.ui-date-time-field__segment')]
      .filter((segment) => segment.getAttribute('data-type') !== 'literal')
      .map((segment) => segment.textContent);
  }

  function Pantry({ children }: { children: React.ReactNode }) {
    const [keepsEdits, setKeepsEdits] = useState(true);
    return (
      <form
        aria-label="Pantry"
        onReset={(event) => {
          if (keepsEdits) event.preventDefault();
        }}
      >
        {children}
        <button type="button" onClick={() => setKeepsEdits(false)}>
          Allow reset
        </button>
        <button type="reset">Reset</button>
      </form>
    );
  }

  it('UIC-DATE-TIME-FIELD-4.5 UIC-FIELD-2.6 keeps segments typed in part through a cancelled reset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Pantry>
        <DateTimeField label="Due" name="due" onChange={onChange} />
        <DateTimeField label="Stay" mode="date-range" startName="from" endName="to" />
        <DateTimeField label="At" mode="time" name="at" />
      </Pantry>,
    );
    const [month, , , startMonth, startDay, , endMonth, , , hour] =
      screen.getAllByRole('spinbutton');
    await user.click(month as HTMLElement);
    await user.keyboard('4');
    await user.click(startMonth as HTMLElement);
    await user.keyboard('5');
    await user.click(startDay as HTMLElement);
    await user.keyboard('1');
    await user.click(endMonth as HTMLElement);
    await user.keyboard('6');
    await user.click(hour as HTMLElement);
    await user.keyboard('9');
    const typed = segmentTexts(container);
    expect(typed.filter((text) => /\d/.test(text ?? ''))).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(segmentTexts(container)).toEqual(typed));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Allow reset' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() =>
      expect(segmentTexts(container).filter((text) => /\d/.test(text ?? ''))).toEqual([]),
    );
  });
});
