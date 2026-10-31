import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { FormEvent, ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Fieldset } from '../field/field.js';
import { Form } from '../form/form.js';
import { DateTimeField } from './date-time-field.js';

function renderInLocale(element: ReactElement) {
  return render(<UiProvider locale="en-US">{element}</UiProvider>);
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-date-time-field');
}

function segment(name: RegExp) {
  return screen.getByRole('spinbutton', { name });
}

const plain = (text: string | null | undefined) => (text ?? '').replace(/\s/g, ' ');

describe('DateTimeField field', () => {
  it('UIC-DATE-TIME-FIELD-1.1 renders a date picker group of segments with a calendar button', () => {
    const { container } = renderInLocale(
      <DateTimeField
        id="due"
        label="Due"
        defaultValue="2026-04-13"
        description="The day it is due."
      />,
    );
    const field = root(container);
    expect(field).toHaveClass('ui-field', 'ui-date-time-field');
    expect(field).toHaveAttribute('data-mode', 'date');
    const group = screen.getByRole('group', { name: 'Due' });
    expect(group).toHaveClass('ui-date-time-field__group');
    expect(group).toHaveAttribute('id', 'due-control');
    expect(group.closest('.ui-date-time-field__picker')).not.toBeNull();
    expect(segment(/^month/)).toHaveTextContent('4');
    expect(segment(/^month/)).toHaveAttribute('data-type', 'month');
    expect(segment(/^month/)).toHaveAccessibleDescription(/The day it is due\./);
    const button = within(group).getByRole('button', { name: /Calendar/ });
    expect(button).toHaveClass('ui-date-time-field__button');
    expect(button.querySelector('[data-glyph="calendar"]')).not.toBeNull();
    expectHooksMatchSpec(container, 'DATE-TIME-FIELD', {
      slots: ['picker', 'group', 'input', 'segment', 'button'],
    });
  });

  it('UIC-DATE-TIME-FIELD-1.1 draws a range with two inputs and a time field without a button', () => {
    const { container, unmount } = renderInLocale(
      <DateTimeField
        label="Window"
        mode="date-range"
        defaultValue={{ start: '2026-04-01', end: '2026-04-03' }}
      />,
    );
    expect(root(container)).toHaveAttribute('data-mode', 'date-range');
    expect(container.querySelectorAll('.ui-date-time-field__input')).toHaveLength(2);
    expect(container.querySelector('.ui-date-time-field__separator')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(
      screen.getAllByRole('spinbutton', { name: /^month/ }).map((node) => node.textContent),
    ).toEqual(['4', '4']);
    expectHooksMatchSpec(container, 'DATE-TIME-FIELD', { slots: ['separator'] });
    unmount();
    const { container: timeContainer } = renderInLocale(
      <DateTimeField label="At" mode="time" defaultValue="13:45" />,
    );
    expect(root(timeContainer)).toHaveAttribute('data-mode', 'time');
    expect(segment(/^hour/)).toHaveTextContent('1');
    expect(segment(/^minute/)).toHaveTextContent('45');
    expect(screen.queryByRole('button', { name: /Calendar/ })).not.toBeInTheDocument();
    expectHooksMatchSpec(timeContainer, 'DATE-TIME-FIELD', {
      slots: ['group', 'input', 'segment'],
    });
  });

  it('UIC-DATE-TIME-FIELD-1.2 edits a date-time as floating wall time and shows unreadable values empty', () => {
    const { unmount } = renderInLocale(
      <DateTimeField label="When" mode="date-time" defaultValue="2026-04-13T13:45" />,
    );
    expect(segment(/^day/)).toHaveTextContent('13');
    expect(segment(/^hour/)).toHaveTextContent('1');
    expect(segment(/^minute/)).toHaveTextContent('45');
    expect(segment(/^AM\/PM/)).toHaveTextContent('PM');
    unmount();
    renderInLocale(<DateTimeField label="Due" defaultValue="soon" />);
    expect(segment(/^month/)).toHaveAttribute('data-placeholder', 'true');
  });

  it('UIC-DATE-TIME-FIELD-1.2 flags a value its mode cannot read and blocks the form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const { container } = renderInLocale(
      <Form aria-label="Plan" validationBehavior="aria" onSubmit={onSubmit}>
        <DateTimeField label="Due" isRequired value="2026-02-30" />
        <DateTimeField label="At" mode="time" value="25:00" />
        <DateTimeField label="When" mode="date-time" value="2026-04-13" />
        <DateTimeField
          label="Slot"
          mode="date-range"
          value={{ start: '2026-04-13', end: 'later' }}
        />
        <DateTimeField label="Call" mode="date-time" timeZone="UTC" value="2026-04-13T03:00:00Z" />
        <button type="submit">Send</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    const roots = [...container.querySelectorAll('.ui-date-time-field')];
    expect(roots.map((root) => root.getAttribute('data-validation'))).toEqual([
      'invalid',
      'invalid',
      'invalid',
      'invalid',
      'valid',
    ]);
    expect(roots[0]?.querySelector('.ui-field__message')).toHaveTextContent('Enter a valid date.');
  });

  it('UIC-DATE-TIME-FIELD-1.3 commits typed dates, times and date-times in canonical form', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const onChange = vi.fn();
    const { unmount } = renderInLocale(
      <DateTimeField label="Due" onChange={onChange} onCommit={onCommit} />,
    );
    act(() => segment(/^month/).focus());
    await user.keyboard('514');
    expect(segment(/^day/)).toHaveTextContent('14');
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('2026');
    expect(onCommit).toHaveBeenLastCalledWith('2026-05-14');
    unmount();
    const time = vi.fn();
    const { unmount: unmountSecond } = renderInLocale(
      <DateTimeField label="At" mode="time" defaultValue="09:00" onCommit={time} />,
    );
    act(() => segment(/^hour/).focus());
    await user.keyboard('{ArrowUp}');
    expect(time).toHaveBeenLastCalledWith('10:00');
    unmountSecond();
    const instant = vi.fn();
    renderInLocale(
      <DateTimeField
        label="When"
        mode="date-time"
        defaultValue="2026-04-13T13:45"
        onCommit={instant}
      />,
    );
    act(() => segment(/^minute/).focus());
    await user.keyboard('{ArrowUp}');
    expect(instant).toHaveBeenLastCalledWith('2026-04-13T13:46');
  });

  it('UIC-DATE-TIME-FIELD-1.2 keeps a four-digit year through a segment edit of an early date-time', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="When"
        mode="date-time"
        defaultValue="0099-04-20T12:30"
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    act(() => segment(/^minute/).focus());
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('0099-04-20T12:31');
    expect(onCommit).toHaveBeenLastCalledWith('0099-04-20T12:31');
    expect(segment(/^minute/)).toHaveAttribute('aria-valuenow', '31');
  });

  it('UIC-DATE-TIME-FIELD-1.4 keeps an out-of-bounds value on screen, invalid and uncommitted', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { container } = renderInLocale(
      <DateTimeField
        label="Due"
        defaultValue="2026-04-28"
        minValue="2026-04-01"
        maxValue="2026-04-29"
        onCommit={onCommit}
      />,
    );
    act(() => segment(/^day/).focus());
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(segment(/^day/)).toHaveTextContent('30');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('2026-04-29');
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(root(container)).toHaveAttribute('data-dirty', 'true');
    expect(plain(container.querySelector('.ui-field__message')?.textContent)).toBe(
      'Choose a value on or before Apr 29, 2026.',
    );
    expect(container.querySelector('.ui-date-time-field__picker')).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('UIC-DATE-TIME-FIELD-1.4 runs the caller check on values within bounds', () => {
    const { container } = renderInLocale(
      <DateTimeField
        label="Due"
        defaultValue="2026-04-04"
        validate={(value) =>
          value === '2026-04-04' ? { severity: 'warning', message: 'A Saturday.' } : null
        }
      />,
    );
    expect(root(container)).toHaveAttribute('data-validation', 'warning');
    expect(screen.getByText('A Saturday.')).toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-1.5 keeps the calendar closed while read-only or disabled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = renderInLocale(
      <>
        <DateTimeField label="Due" isOpen isReadOnly defaultValue="2026-04-13" />
        <DateTimeField label="Stay" mode="date-range" isOpen isDisabled />
        <Fieldset legend="Locked" isDisabled>
          <DateTimeField label="Start" defaultOpen />
        </Fieldset>
      </>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    function Lockable({ isReadOnly }: { isReadOnly: boolean }) {
      return (
        <DateTimeField
          label="When"
          mode="date-time"
          isReadOnly={isReadOnly}
          onOpenChange={onOpenChange}
        />
      );
    }
    const { rerender } = renderInLocale(<Lockable isReadOnly={false} />);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    onOpenChange.mockClear();
    rerender(
      <UiProvider locale="en-US">
        <Lockable isReadOnly />
      </UiProvider>,
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('UIC-DATE-TIME-FIELD-1.5 marks invalid, read-only and disabled pickers', async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderInLocale(<DateTimeField label="Due" isRequired />);
    expect(root(container)).toHaveAttribute('data-validation', 'invalid');
    expect(container.querySelector('.ui-date-time-field__picker')).toHaveAttribute(
      'data-invalid',
      'true',
    );
    unmount();
    const { unmount: unmountReadOnly } = renderInLocale(
      <DateTimeField label="Due" defaultValue="2026-04-13" isReadOnly />,
    );
    expect(segment(/^month/)).toHaveAttribute('aria-readonly', 'true');
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmountReadOnly();
    renderInLocale(<DateTimeField label="Due" defaultValue="2026-04-13" isDisabled />);
    expect(segment(/^month/)).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /Calendar/ })).toBeDisabled();
  });

  it('UIC-DATE-TIME-FIELD-1.6 shows the committed value before the segments while dirty', async () => {
    const user = userEvent.setup();
    const { container } = renderInLocale(<DateTimeField label="Due" committedValue="2026-04-13" />);
    expect(container.querySelector('.ui-date-time-field__previous')).toBeNull();
    act(() => segment(/^day/).focus());
    await user.keyboard('{ArrowUp}');
    const previous = container.querySelector('.ui-date-time-field__previous');
    expect(previous).toHaveClass('ui-field-previous-value');
    expect(previous?.querySelector('del')).toHaveTextContent('Apr 13, 2026');
    expect(previous?.nextElementSibling).toHaveClass('ui-date-time-field__input');
    expectHooksMatchSpec(container, 'DATE-TIME-FIELD', { slots: ['previous'] });
  });

  it('UIC-DATE-TIME-FIELD-1.6 writes the previous value at the editor precision and hour cycle', () => {
    /** The previous value a field shows, read once and then unmounted. */
    function previousOf(element: ReactElement) {
      const { container, unmount } = renderInLocale(element);
      const text = plain(container.querySelector('.ui-date-time-field__previous del')?.textContent);
      unmount();
      return text;
    }
    expect(
      previousOf(
        <DateTimeField
          label="At"
          mode="time"
          granularity="second"
          value="12:30:31"
          committedValue="12:30:30"
        />,
      ),
    ).toBe('12:30:30 PM');
    expect(
      previousOf(
        <DateTimeField
          label="When"
          mode="date-time"
          granularity="second"
          hourCycle={24}
          timeZone="Asia/Tokyo"
          value="2026-04-20T13:30:31+09:00[Asia/Tokyo]"
          committedValue="2026-04-20T13:30:30+09:00[Asia/Tokyo]"
        />,
      ),
    ).toBe('Apr 20, 2026, 13:30:30');
    expect(
      previousOf(
        <DateTimeField
          label="Window"
          mode="date-time-range"
          granularity="second"
          value={{ start: '2026-04-20T09:00:01', end: '2026-04-20T10:00:00' }}
          committedValue={{ start: '2026-04-20T09:00:00', end: '2026-04-20T10:00:00' }}
        />,
      ),
    ).toContain('9:00:00 AM');
  });

  it('UIC-DATE-TIME-FIELD-1.7 restores, undoes and clears from the menu', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Due"
        committedValue="2026-04-13"
        menu={['clear']}
        onCommit={onCommit}
      />,
    );
    act(() => segment(/^day/).focus());
    await user.keyboard('{ArrowUp}');
    expect(onCommit).toHaveBeenLastCalledWith('2026-04-14');
    await user.keyboard('{Control>}z{/Control}');
    expect(segment(/^day/)).toHaveTextContent('13');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    await user.click(screen.getByRole('button', { name: 'Restore Due' }));
    expect(segment(/^day/)).toHaveTextContent('13');
    await user.click(screen.getByRole('button', { name: 'Due actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Clear' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
    expect(segment(/^day/)).toHaveAttribute('data-placeholder', 'true');
  });

  it('UIC-DATE-TIME-FIELD-1.8 forwards the caller class, id, data attributes and open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = renderInLocale(
      <DateTimeField
        label="Due"
        id="due"
        className="caller"
        data-testid="probe"
        defaultValue="2026-04-13"
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );
    const field = root(container);
    expect(field).toHaveClass('caller');
    expect(field).toHaveAttribute('id', 'due');
    expect(field).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expectHooksMatchSpec(container, 'DATE-TIME-FIELD', { callerAttributes: ['data-testid'] });
  });
});

describe('DateTimeField calendar', () => {
  it('UIC-DATE-TIME-FIELD-2.1 opens a calendar dialog and picks a day with the keyboard', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderInLocale(<DateTimeField label="Due" defaultValue="2026-04-13" onCommit={onCommit} />);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = screen.getByRole('dialog');
    const popover = dialog.closest('.ui-date-time-field__popover') as HTMLElement;
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover.style.zIndex).not.toBe('');
    expect(dialog).toHaveClass('ui-date-time-field__dialog');
    expect(within(dialog).getByRole('grid', { name: /April 2026/ })).toHaveClass(
      'ui-date-time-field__calendar-grid',
    );
    expect(within(dialog).getByRole('button', { name: 'Previous' })).toHaveClass(
      'ui-date-time-field__calendar-nav',
    );
    expectHooksMatchSpec(document.body, 'DATE-TIME-FIELD', {
      slots: [
        'popover',
        'dialog',
        'calendar',
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
      ],
    });
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: /April 13/ })).toHaveFocus(),
    );
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onCommit).toHaveBeenCalledWith('2026-04-14');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-DATE-TIME-FIELD-2.1 refuses days outside the bounds and shows two months for a range', async () => {
    const user = userEvent.setup();
    const { unmount } = renderInLocale(
      <DateTimeField label="Due" defaultValue="2026-04-13" minValue="2026-04-10" />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.getByRole('button', { name: /April 9, 2026/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.keyboard('{Escape}');
    unmount();
    const onCommit = vi.fn();
    renderInLocale(
      <DateTimeField
        label="Window"
        mode="date-range"
        defaultValue={{ start: '2026-04-01', end: '2026-04-03' }}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /^Monday, April 6, 2026/ }));
    await user.click(screen.getByRole('button', { name: /^Wednesday, April 8, 2026/ }));
    expect(onCommit).toHaveBeenCalledWith({ start: '2026-04-06', end: '2026-04-08' });
  });

  it('UIC-DATE-TIME-FIELD-2.2 sets today, now or nothing from the quick actions', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    const { unmount } = renderInLocale(
      <DateTimeField label="Due" defaultValue="2020-01-01" onCommit={onCommit} />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const today = screen.getByRole('button', { name: 'Today' });
    expect(today).toHaveClass('ui-button', 'ui-date-time-field__action');
    await user.click(today);
    const date = new Date();
    const pad = (part: number) => String(part).padStart(2, '0');
    expect(onCommit).toHaveBeenLastCalledWith(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(screen.queryByRole('button', { name: 'Now' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onCommit).toHaveBeenLastCalledWith(null);
    unmount();
    const instant = vi.fn();
    renderInLocale(<DateTimeField label="When" mode="date-time" onCommit={instant} />);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    await user.click(screen.getByRole('button', { name: 'Now' }));
    const text = instant.mock.calls[0]?.[0] as string;
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const picked = new Date(text);
    expect(Math.abs(picked.getTime() - Date.now())).toBeLessThan(61_000);
  });

  describe('with the clock held', () => {
    afterEach(() => vi.useRealTimers());

    it('UIC-DATE-TIME-FIELD-2.2 reads the clock when Now or Today is pressed, not when the popover opened', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 3, 13, 9, 0));
      const user = userEvent.setup();
      const onCommit = vi.fn();
      const { unmount } = renderInLocale(
        <DateTimeField label="When" mode="date-time" onCommit={onCommit} />,
      );
      await user.click(screen.getByRole('button', { name: /Calendar/ }));
      const now = await screen.findByRole('button', { name: 'Now' });
      vi.setSystemTime(new Date(2026, 3, 13, 9, 7));
      await user.click(now);
      expect(onCommit).toHaveBeenLastCalledWith('2026-04-13T09:07');
      unmount();
      vi.setSystemTime(new Date(2026, 3, 13, 23, 59));
      renderInLocale(<DateTimeField label="Due" onCommit={onCommit} />);
      await user.click(screen.getByRole('button', { name: /Calendar/ }));
      const today = await screen.findByRole('button', { name: 'Today' });
      vi.setSystemTime(new Date(2026, 3, 14, 0, 1));
      await user.click(today);
      expect(onCommit).toHaveBeenLastCalledWith('2026-04-14');
    });
  });

  it('UIC-DATE-TIME-FIELD-2.2 offers no Clear for a required field and disables it without a value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = renderInLocale(
      <DateTimeField label="Due" isRequired defaultValue="2026-04-13" onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Today' })).toBeEnabled();
    expect(within(dialog).queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    renderInLocale(<DateTimeField label="Due" />);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    expect(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Clear' }),
    ).toBeDisabled();
  });
});
