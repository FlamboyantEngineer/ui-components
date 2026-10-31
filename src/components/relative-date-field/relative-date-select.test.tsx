import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type FormEvent, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { Form } from '../form/form.js';
import { RelativeDateField } from './relative-date-field.js';

const getNow = () => new Date(2026, 4, 23, 10, 30, 0);

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

function optionTexts() {
  return screen.getAllByRole('option').map((option) => option.textContent);
}

describe('RelativeDateField presets', () => {
  it('UIC-RELATIVE-DATE-FIELD-2.2 lists caller labels and commits computed presets', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const endOfMonth = (now: Date) =>
      new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('sv-SE');
    renderInLocale(
      <RelativeDateField
        label="Due"
        getNow={getNow}
        presets={[
          { amount: 2, unit: 'week', label: 'In a fortnight' },
          { amount: 1, unit: 'day' },
          { label: 'End of month', getValue: endOfMonth },
        ]}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    expect(optionTexts()).toEqual(['In a fortnight', 'Tomorrow', 'End of month']);
    await user.click(screen.getByRole('option', { name: 'End of month' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-31');
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    await user.click(screen.getByRole('option', { name: 'In a fortnight' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-06-06');
  });

  it('UIC-RELATIVE-DATE-FIELD-2.3 commits relative ranges and reads them relative to now', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = renderInLocale(
      <RelativeDateField label="Period" mode="date-range" getNow={getNow} onCommit={onCommit} />,
    );
    const root = container.querySelector('.ui-relative-date-field');
    expect(root).toHaveAttribute('data-mode', 'date-range');
    await user.click(screen.getByRole('button', { name: /Period$/ }));
    expect(optionTexts()).toEqual(['Today', 'Last 7 days', 'Last 30 days', 'Next 7 days']);
    await user.click(screen.getByRole('option', { name: 'Last 7 days' }));
    expect(onCommit).toHaveBeenLastCalledWith({ start: '2026-05-16', end: '2026-05-23' });
    expect(screen.getByRole('button', { name: 'May 16, 2026 – Today Period' })).toBeInTheDocument();
    expect(root).toHaveAttribute('data-relation', 'present');
    const preview = container.querySelector('.ui-relative-date-field__preview');
    expect(preview?.tagName).toBe('SPAN');
    expect(
      [...(preview?.querySelectorAll('time') ?? [])].map((node) => node.getAttribute('datetime')),
    ).toEqual(['2026-05-16', '2026-05-23']);
    await user.click(screen.getByRole('button', { name: /Period$/ }));
    await user.click(screen.getByRole('option', { name: 'Next 7 days' }));
    expect(onCommit).toHaveBeenLastCalledWith({ start: '2026-05-23', end: '2026-05-30' });
    expect(root).toHaveAttribute('data-relation', 'present');
  });

  it('UIC-RELATIVE-DATE-FIELD-2.3 names range periods from the provider and relates past ranges', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UiProvider locale="en-US" messages={{ lastPeriod: 'Previous {period}' }}>
        <RelativeDateField
          label="Period"
          mode="date-range"
          getNow={getNow}
          defaultValue={{ start: '2026-05-01', end: '2026-05-10' }}
          presets={[{ amount: -2, unit: 'week' }]}
        />
      </UiProvider>,
    );
    expect(container.querySelector('.ui-relative-date-field')).toHaveAttribute(
      'data-relation',
      'past',
    );
    await user.click(screen.getByRole('button', { name: /Period$/ }));
    expect(optionTexts()).toEqual(['Previous 2 weeks']);
  });

  it('UIC-RELATIVE-DATE-FIELD-2.4 flags a reversed range and disables a reversed preset', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const { container } = renderInLocale(
      <Form aria-label="Plan" validationBehavior="aria" onSubmit={onSubmit}>
        <RelativeDateField
          label="Period"
          name="period"
          mode="date-range"
          getNow={getNow}
          defaultValue={{ start: '2026-05-25', end: '2026-05-23' }}
          presets={[
            { label: 'Backwards', getValue: () => ({ start: '2026-05-25', end: '2026-05-23' }) },
            { amount: 7, unit: 'day' },
          ]}
          onCommit={onCommit}
        />
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-relative-date-field')).toHaveAttribute(
      'data-validation',
      'invalid',
    );
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Choose a value on or after May 25, 2026.',
    );
    await user.click(screen.getByRole('button', { name: /Period$/ }));
    expect(screen.getByRole('option', { name: 'Backwards' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('option', { name: 'Backwards' }));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('UIC-RELATIVE-DATE-FIELD-2.4 disables presets outside the bounds and flags values outside', async () => {
    const user = userEvent.setup();
    const { container } = renderInLocale(
      <RelativeDateField
        label="Due"
        getNow={getNow}
        defaultValue="2026-05-20"
        minValue="2026-05-23"
        maxValue="2026-05-27"
        showCalendar
      />,
    );
    expect(container.querySelector('.ui-relative-date-field')).toHaveAttribute(
      'data-validation',
      'invalid',
    );
    expect(container.querySelector('.ui-field__message')).toHaveTextContent(
      'Choose a value on or after May 23, 2026.',
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    expect(screen.getByRole('option', { name: 'Today' })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('option', { name: 'Yesterday' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Next week' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: /May 28, 2026/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-RELATIVE-DATE-FIELD-2.4 refuses a preset whose value left the bounds while the list was open', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    let now = new Date('2026-04-20T12:00:00Z');
    let late = false;
    const clock = () => now;
    function Controlled() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <RelativeDateField
          label="Due"
          value={value}
          onChange={setValue}
          getNow={clock}
          timeZone="UTC"
          maxValue="2026-04-20"
          presets={[
            { amount: 0, unit: 'day' },
            { label: 'Deadline', getValue: () => (late ? '2026-04-22' : '2026-04-20') },
          ]}
          onCommit={onCommit}
        />
      );
    }
    renderInLocale(<Controlled />);
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    now = new Date('2026-04-21T00:00:01Z');
    await user.click(screen.getByRole('option', { name: 'Today' }));
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    now = new Date('2026-04-20T12:00:00Z');
    late = true;
    await user.click(screen.getByRole('option', { name: 'Deadline' }));
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Due$/ })).toHaveTextContent('Select');
  });
});
