import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Form } from '../form/form.js';
import { DateTimeField, type DateRangeValue } from './date-time-field.js';

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
