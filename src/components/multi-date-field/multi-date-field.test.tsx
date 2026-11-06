import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Fieldset } from '../field/field.js';
import { MultiDateField, type MultiDateFieldProps } from './multi-date-field.js';

const getNow = () => new Date('2026-04-13T12:00:00Z');

function renderField(props: Partial<MultiDateFieldProps> = {}) {
  return render(
    <UiProvider locale="en-US" getNow={getNow}>
      <MultiDateField label="Days off" {...props} />
    </UiProvider>,
  );
}

const day = (name: RegExp) => screen.getByRole('button', { name });

describe('MultiDateField', () => {
  it('UIC-MULTI-DATE-FIELD-1.1 UIC-MULTI-DATE-FIELD-1.6 renders an inline calendar and the chosen dates as tags', () => {
    const { container } = renderField({
      defaultValue: ['2026-04-20', '2026-04-14'],
      className: 'leave',
      id: 'leave',
      'data-section': 'team',
    } as Partial<MultiDateFieldProps>);
    const root = container.querySelector('.ui-multi-date-field');
    expect(root).toHaveClass('ui-field', 'leave');
    expect(root).toHaveAttribute('data-section', 'team');
    expect(screen.getByRole('application', { name: /Days off/ })).toHaveClass(
      'ui-multi-date-field__calendar',
    );
    const tags = screen.getByRole('grid', { name: 'Days off selected values' });
    expect(
      within(tags)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual([expect.stringContaining('Apr 14, 2026'), expect.stringContaining('Apr 20, 2026')]);
    expect(day(/Tuesday, April 14, 2026/)).toHaveAttribute('data-selected', 'true');
    expectHooksMatchSpec(container, 'MULTI-DATE-FIELD', {
      slots: ['control', 'calendar', 'tags'],
      callerAttributes: ['data-section'],
    });
  });

  it('UIC-MULTI-DATE-FIELD-1.3 toggles days in and out of the set and commits each change', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderField({ defaultValue: ['2026-04-20'], onCommit });
    await user.click(day(/Wednesday, April 15, 2026/));
    expect(onCommit).toHaveBeenLastCalledWith(['2026-04-15', '2026-04-20']);
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith(['2026-04-15', '2026-04-16', '2026-04-20']);
    await user.click(day(/Monday, April 20, 2026/));
    expect(onCommit).toHaveBeenLastCalledWith(['2026-04-15', '2026-04-16']);
    expect(day(/April 20, 2026/)).not.toHaveAttribute('data-selected');
  });

  it('UIC-MULTI-DATE-FIELD-1.3 removes a date from its tag and returns focus to the calendar at the end', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderField({ defaultValue: ['2026-04-14', '2026-04-20'], onCommit });
    const tags = screen.getByRole('grid', { name: 'Days off selected values' });
    const [first] = within(tags).getAllByRole('button', { name: /Remove/ });
    await user.click(first as HTMLElement);
    expect(onCommit).toHaveBeenLastCalledWith(['2026-04-20']);
    await user.click(screen.getByRole('button', { name: /Remove/ }));
    expect(onCommit).toHaveBeenLastCalledWith([]);
    expect(
      screen.queryByRole('grid', { name: 'Days off selected values' }),
    ).not.toBeInTheDocument();
    // The calendar's focused day, the earliest date chosen when it opened, takes focus.
    await waitFor(() => expect(day(/Tuesday, April 14, 2026/)).toHaveFocus());
  });

  it('UIC-MULTI-DATE-FIELD-1.2 shows a repeated, unordered value as its set and writes it ordered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ value: ['2026-04-20', '2026-04-14', '2026-04-20'], onChange });
    const tags = screen.getByRole('grid', { name: 'Days off selected values' });
    expect(within(tags).getAllByRole('row')).toHaveLength(2);
    await user.click(day(/Thursday, April 16, 2026/));
    expect(onChange).toHaveBeenLastCalledWith(['2026-04-14', '2026-04-16', '2026-04-20']);
  });

  it('UIC-MULTI-DATE-FIELD-1.2 marks a text that is no date invalid', () => {
    const { container } = renderField({ defaultValue: ['2026-02-30'] });
    expect(container.querySelector('.ui-field')).toHaveAttribute('data-validation', 'invalid');
    expect(screen.getByText('Enter a valid date.')).toBeInTheDocument();
  });

  it('UIC-MULTI-DATE-FIELD-1.4 refuses days outside the bounds and unavailable days', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderField({
      defaultValue: ['2026-04-14'],
      minValue: '2026-04-10',
      isDateUnavailable: (date) => date === '2026-04-18',
      getDateState: (date) =>
        date === '2026-04-21' ? { isTaken: true, description: 'Booked' } : undefined,
      onCommit,
    });
    await user.click(day(/Thursday, April 9, 2026/));
    await user.click(day(/Saturday, April 18, 2026/));
    await user.click(day(/Tuesday, April 21, 2026/));
    expect(onCommit).not.toHaveBeenCalled();
    expect(day(/Tuesday, April 21, 2026/)).toHaveAccessibleDescription('Booked');
  });

  it('UIC-MULTI-DATE-FIELD-1.4 reports a value outside the bounds or on an unavailable day', () => {
    const { rerender } = renderField({ value: ['2026-03-31'], minValue: '2026-04-01' });
    expect(screen.getByText('Choose a value on or after Apr 1, 2026.')).toBeInTheDocument();
    rerender(
      <UiProvider locale="en-US" getNow={getNow}>
        <MultiDateField
          label="Days off"
          value={['2026-04-18']}
          isDateUnavailable={(date) => date === '2026-04-18'}
        />
      </UiProvider>,
    );
    expect(screen.getByText('Choose an available date.')).toBeInTheDocument();
  });

  it('UIC-MULTI-DATE-FIELD-1.4 stops adding at the most dates and reports a fuller value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { rerender } = renderField({
      defaultValue: ['2026-04-14', '2026-04-15'],
      maxValues: 2,
      onCommit,
    });
    expect(day(/Thursday, April 16, 2026/)).toHaveAttribute('data-unavailable', 'true');
    await user.click(day(/Thursday, April 16, 2026/));
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(day(/Tuesday, April 14, 2026/));
    expect(onCommit).toHaveBeenLastCalledWith(['2026-04-15']);
    expect(day(/Thursday, April 16, 2026/)).not.toHaveAttribute('data-unavailable');
    rerender(
      <UiProvider locale="en-US" getNow={getNow}>
        <MultiDateField
          label="Days off"
          value={['2026-04-14', '2026-04-15', '2026-04-16']}
          maxValues={2}
        />
      </UiProvider>,
    );
    expect(screen.getByText('Choose up to 2 dates.')).toBeInTheDocument();
  });

  it('UIC-MULTI-DATE-FIELD-1.3 changes nothing while read-only and disables everything while disabled', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { rerender } = renderField({ defaultValue: ['2026-04-14'], isReadOnly: true, onCommit });
    await user.click(day(/Wednesday, April 15, 2026/));
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    rerender(
      <UiProvider locale="en-US" getNow={getNow}>
        <Fieldset legend="Leave" isDisabled>
          <MultiDateField label="Days off" defaultValue={['2026-04-14']} onCommit={onCommit} />
        </Fieldset>
      </UiProvider>,
    );
    expect(day(/Wednesday, April 15, 2026/)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('application', { name: /Days off/ })).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it('UIC-MULTI-DATE-FIELD-1.5 submits one entry per date under its name and clears to an empty set', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = render(
      <UiProvider locale="en-US" getNow={getNow}>
        <form>
          <MultiDateField
            label="Days off"
            name="day"
            defaultValue={['2026-04-20', '2026-04-14']}
            onCommit={onCommit}
          />
        </form>
      </UiProvider>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('no form');
    expect([...new FormData(form).entries()]).toEqual([
      ['day', '2026-04-14'],
      ['day', '2026-04-20'],
    ]);
    act(() => day(/Monday, April 20, 2026/).focus());
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = await screen.findByRole('menu', { name: 'Days off actions' });
    await user.click(within(menu).getByRole('menuitem', { name: 'Clear' }));
    expect(onCommit).toHaveBeenLastCalledWith([]);
    expect([...new FormData(form).entries()]).toEqual([]);
  });

  it('UIC-MULTI-DATE-FIELD-1.1 leaves the tags out with hideTags and shows several months', () => {
    renderField({
      defaultValue: ['2026-04-14'],
      hideTags: true,
      visibleMonths: 2,
      weekNumbers: 'iso',
    });
    expect(
      screen.queryByRole('grid', { name: 'Days off selected values' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.getAllByRole('rowheader').length).toBeGreaterThan(0);
  });

  it('UIC-MULTI-DATE-FIELD-1.1 renders the tags and form values on the server without the calendar', () => {
    const view = renderToString(
      <UiProvider locale="en-US">
        <MultiDateField label="Days off" name="day" defaultValue={['2026-04-14']} />
      </UiProvider>,
    );
    expect(view).toContain('ui-multi-date-field__tags');
    expect(view).toContain('value="2026-04-14"');
    expect(view).not.toContain('ui-multi-date-field__calendar');
  });
});
