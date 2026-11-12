import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactElement, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { chooseFieldMenuItem } from '../../../test/field-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { Form } from '../form/form.js';
import { RelativeDateField } from './relative-date-field.js';

const getNow = () => new Date(2026, 4, 23, 10, 30, 0);

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-relative-date-field');
}

describe('RelativeDateField', () => {
  it.each(['isReadOnly', 'isDisabled'] as const)(
    'UIC-RELATIVE-DATE-FIELD-1.4 keeps an explicitly open list closed while %s',
    (lock) => {
      render(<RelativeDateField label="Due" getNow={getNow} isOpen {...{ [lock]: true }} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    },
  );

  it('UIC-RELATIVE-DATE-FIELD-1.1 reads the value relative to now and previews the absolute date', () => {
    const { container } = renderInLocale(
      <RelativeDateField id="due" label="Due" defaultValue="2026-05-24" getNow={getNow} />,
    );
    const field = root(container);
    expect(field).toHaveClass('ui-field', 'ui-relative-date-field');
    expect(field).toHaveAttribute('data-mode', 'date');
    expect(field).toHaveAttribute('data-relation', 'future');
    const trigger = screen.getByRole('button', { name: 'Tomorrow Due' });
    expect(trigger).toHaveClass('ui-relative-date-field__trigger');
    expect(trigger).toHaveAttribute('id', 'due-control');
    const preview = container.querySelector('time');
    expect(preview).toHaveClass('ui-relative-date-field__preview');
    expect(preview).toHaveAttribute('datetime', '2026-05-24');
    expect(preview).toHaveTextContent('May 24, 2026');
    expectHooksMatchSpec(container, 'RELATIVE-DATE-FIELD', {
      slots: ['select', 'trigger', 'value', 'chevron', 'preview'],
    });
  });

  it('UIC-RELATIVE-DATE-FIELD-1.2 refreshes its words and presets as time passes', async () => {
    vi.useFakeTimers({ now: new Date('2026-04-20T23:59:00Z') });
    try {
      const { container, unmount } = renderInLocale(
        <>
          <RelativeDateField
            label="Due"
            timeZone="UTC"
            defaultValue="2026-04-20"
            maxValue="2026-04-20"
          />
          <RelativeDateField
            label="Call"
            mode="date-time"
            timeZone="UTC"
            defaultValue="2026-04-20T23:58:00Z"
          />
        </>,
      );
      expect(screen.getByRole('button', { name: /Due$/ })).toHaveTextContent('Today');
      expect(screen.getByRole('button', { name: /Call$/ })).toHaveTextContent('1 minute ago');
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByRole('button', { name: /Due$/ })).toHaveTextContent('Yesterday');
      expect(screen.getByRole('button', { name: /Call$/ })).toHaveTextContent('2 minutes ago');
      expect(container.querySelector('.ui-relative-date-field')).toHaveAttribute(
        'data-relation',
        'past',
      );
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-RELATIVE-DATE-FIELD-1.2 shows the placeholder for no value or one that is not a date', () => {
    const { container, rerender } = renderInLocale(
      <RelativeDateField label="Due" getNow={getNow} placeholder="No date" />,
    );
    const value = () => container.querySelector('.ui-relative-date-field__value');
    expect(value()).toHaveAttribute('data-placeholder', 'true');
    expect(value()).toHaveTextContent('No date');
    expect(container.querySelector('time')).toBeNull();
    expect(root(container)).not.toHaveAttribute('data-relation');
    rerender(
      <UiProvider locale="en-US">
        <RelativeDateField label="Due" getNow={getNow} value="next-ish" />
      </UiProvider>,
    );
    expect(value()).toHaveTextContent('Select an option');
    rerender(
      <UiProvider locale="en-US">
        <RelativeDateField label="Due" getNow={getNow} mode="date-time" value="2026-05-23T10:25" />
      </UiProvider>,
    );
    expect(value()).toHaveTextContent('5 minutes ago');
    expect(root(container)).toHaveAttribute('data-relation', 'past');
    expect(root(container)).toHaveAttribute('data-mode', 'date-time');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.3 lists presets and commits the date each stands for', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        defaultValue="2026-04-20"
        getNow={getNow}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    const listbox = screen.getByRole('listbox');
    const popover = listbox.closest('.ui-relative-date-field__popover') as HTMLElement;
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover.style.zIndex).not.toBe('');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Today',
      'Tomorrow',
      'Yesterday',
      'Next week',
      'Last week',
    ]);
    expectHooksMatchSpec(document.body, 'RELATIVE-DATE-FIELD', {
      slots: ['popover', 'listbox', 'option'],
    });
    await user.click(screen.getByRole('option', { name: 'Tomorrow' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-24');
    expect(screen.getByRole('button', { name: 'Tomorrow Due' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tomorrow Due' }));
    await user.click(screen.getByRole('option', { name: 'Next week' }));
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-30');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.3 commits nothing from the closed trigger', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        getNow={getNow}
        defaultValue="2026-05-30"
        onCommit={onCommit}
      />,
    );
    const trigger = screen.getByRole('button', { name: /Due$/ });
    trigger.focus();
    await user.keyboard('{ArrowRight}{ArrowLeft}{ArrowRight}t');
    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveAccessibleName('May 30, 2026 Due');
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-23');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.3 takes custom presets and commits local date-times', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        mode="date-time"
        presets={[
          { amount: 3, unit: 'day' },
          { amount: 2, unit: 'month' },
        ]}
        getNow={getNow}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Due$/ }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'In 3 days',
      'In 2 months',
    ]);
    await user.click(screen.getByRole('option', { name: 'In 3 days' }));
    expect(onCommit).toHaveBeenCalledWith('2026-05-26T10:30');
  });

  it('UIC-RELATIVE-DATE-FIELD-1.4 keeps read-only fields closed, disables disabled ones and validates', async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderInLocale(
      <RelativeDateField label="Due" defaultValue="2026-05-24" getNow={getNow} isReadOnly />,
    );
    const trigger = screen.getByRole('button', { name: 'Tomorrow Due' });
    expect(trigger).toBeEnabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(container.querySelector('time')).not.toBeNull();
    unmount();
    const { container: disabled, unmount: unmountDisabled } = renderInLocale(
      <RelativeDateField label="Due" defaultValue="2026-05-24" getNow={getNow} isDisabled />,
    );
    expect(screen.getByRole('button', { name: 'Tomorrow Due' })).toBeDisabled();
    expect(disabled.querySelector('time')).not.toBeNull();
    unmountDisabled();
    const { container: required } = renderInLocale(
      <RelativeDateField label="Due" getNow={getNow} isRequired />,
    );
    expect(root(required)).toHaveAttribute('data-validation', 'invalid');
    expect(required.querySelector('.ui-relative-date-field__select')).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('UIC-RELATIVE-DATE-FIELD-1.4 reports no opening while read-only', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderInLocale(
      <RelativeDateField
        label="Due"
        defaultValue="2026-05-24"
        getNow={getNow}
        isReadOnly
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Tomorrow Due' }));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('UIC-RELATIVE-DATE-FIELD-1.4 restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = renderInLocale(
      <RelativeDateField
        showRestoreButton
        label="Due"
        committedValue="2026-05-23"
        getNow={getNow}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Today Due' }));
    await user.click(screen.getByRole('option', { name: 'Yesterday' }));
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    await user.click(screen.getByRole('button', { name: 'Restore Due' }));
    expect(screen.getByRole('button', { name: 'Today Due' })).toBeInTheDocument();
    await chooseFieldMenuItem(user, screen.getByRole('button', { name: 'Today Due' }), 'Clear');
    expect(onCommit).toHaveBeenLastCalledWith(null);
  });

  it('UIC-RELATIVE-DATE-FIELD-1.5 forwards the caller class, id, data attributes and open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = renderInLocale(
      <RelativeDateField
        label="Due"
        id="due"
        className="caller"
        data-testid="probe"
        getNow={getNow}
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );
    const field = root(container);
    expect(field).toHaveClass('caller');
    expect(field).toHaveAttribute('id', 'due');
    expect(field).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expectHooksMatchSpec(container, 'RELATIVE-DATE-FIELD', { callerAttributes: ['data-testid'] });
  });

  it('UIC-RELATIVE-DATE-FIELD-1.6 UIC-FIELD-3.9 shows a range endpoint error from its form and blocks submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    renderInLocale(
      <Form validationErrors={{ 'trip-start': 'Endpoint rejected' }} onSubmit={onSubmit}>
        <RelativeDateField
          label="Trip"
          mode="date-range"
          startName="trip-start"
          endName="trip-end"
          defaultValue={{ start: '2026-04-20', end: '2026-04-22' }}
          getNow={getNow}
        />
        <button type="submit">Save</button>
      </Form>,
    );
    expect(screen.getByText('Endpoint rejected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('UIC-RELATIVE-DATE-FIELD-1.6 form value', () => {
    function form() {
      return screen.getByRole<HTMLFormElement>('form', { name: 'Plan' });
    }

    function ControlledDue() {
      const [due, setDue] = useState<string | null>('2026-05-24');
      return (
        <form aria-label="Plan">
          <RelativeDateField label="Due" name="due" value={due} getNow={getNow} />
          <button type="button" onClick={() => setDue('2026-06-01')}>
            Move
          </button>
        </form>
      );
    }

    it('submits the date under its name, following picks, clear, undo and reset', async () => {
      const user = userEvent.setup();
      renderInLocale(
        <form aria-label="Plan">
          <RelativeDateField label="Due" name="due" defaultValue="2026-05-24" getNow={getNow} />
          <RelativeDateField label="Start" defaultValue="2026-05-20" getNow={getNow} />
          <button type="reset">Reset</button>
        </form>,
      );
      expect([...new FormData(form())]).toEqual([['due', '2026-05-24']]);
      await user.click(screen.getByRole('button', { name: 'Tomorrow Due' }));
      await user.click(screen.getByRole('option', { name: 'Yesterday' }));
      expect(new FormData(form()).get('due')).toBe('2026-05-22');
      const trigger = screen.getByRole('button', { name: 'Yesterday Due' });
      await chooseFieldMenuItem(user, trigger, 'Clear');
      expect(new FormData(form()).get('due')).toBe('');
      act(() => screen.getByRole('button', { name: /Due$/ }).focus());
      await user.keyboard('{Control>}z{/Control}');
      expect(new FormData(form()).get('due')).toBe('2026-05-22');
      await user.click(screen.getByRole('button', { name: 'Reset' }));
      await waitFor(() => expect(new FormData(form()).get('due')).toBe('2026-05-24'));
    });

    it('follows a controlled value', async () => {
      const user = userEvent.setup();
      renderInLocale(<ControlledDue />);
      expect(new FormData(form()).get('due')).toBe('2026-05-24');
      await user.click(screen.getByRole('button', { name: 'Move' }));
      expect(new FormData(form()).get('due')).toBe('2026-06-01');
    });

    it('submits a date and time, and a range under its start and end names as DateTimeField does', () => {
      renderInLocale(
        <>
          <form aria-label="Plan">
            <RelativeDateField
              label="Call"
              name="call"
              mode="date-time"
              defaultValue="2026-05-24T09:15"
              getNow={getNow}
            />
            <RelativeDateField
              label="Trip"
              startName="trip-start"
              endName="trip-end"
              mode="date-range"
              defaultValue={{ start: '2026-05-20', end: '2026-05-27' }}
              getNow={getNow}
            />
          </form>
          <form aria-label="Typed plan">
            <DateTimeField
              label="Typed trip"
              startName="trip-start"
              endName="trip-end"
              mode="date-range"
              defaultValue={{ start: '2026-05-20', end: '2026-05-27' }}
            />
          </form>
        </>,
      );
      const entries = [...new FormData(form())];
      expect(entries).toEqual([
        ['call', '2026-05-24T09:15'],
        ['trip-start', '2026-05-20'],
        ['trip-end', '2026-05-27'],
      ]);
      const typed = screen.getByRole<HTMLFormElement>('form', { name: 'Typed plan' });
      expect([...new FormData(typed)]).toEqual(entries.slice(1));
    });

    it('submits a read-only field and leaves out a disabled one, or one in a disabled fieldset', () => {
      renderInLocale(
        <form aria-label="Plan">
          <RelativeDateField
            label="Due"
            name="due"
            defaultValue="2026-05-24"
            isReadOnly
            getNow={getNow}
          />
          <RelativeDateField
            label="Start"
            name="start"
            defaultValue="2026-05-20"
            isDisabled
            getNow={getNow}
          />
          <fieldset disabled>
            <RelativeDateField label="End" name="end" defaultValue="2026-05-30" getNow={getNow} />
          </fieldset>
        </form>,
      );
      expect([...new FormData(form())]).toEqual([['due', '2026-05-24']]);
    });
  });
});
