import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { DateTimeField, type DateTimeFieldProps } from './date-time-field.js';

type AnyProps = DateTimeFieldProps<'date' | 'date-range'>;

function renderField(props: Partial<AnyProps>, locale = 'en-US') {
  return render(
    <UiProvider locale={locale}>
      <DateTimeField<'date' | 'date-range'> label="Due" {...props} />
    </UiProvider>,
  );
}

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  const [button] = document.getElementsByClassName('ui-date-time-field__button');
  if (!button) throw new Error('no calendar button');
  await user.click(button);
  return screen.getByRole('dialog');
}

/** The visible next button: React Aria also renders a hidden one for screen reader users. */
function nextButton(dialog: HTMLElement) {
  const header = dialog.querySelector<HTMLElement>('.ui-date-time-field__calendar-header');
  if (!header) throw new Error('no calendar header');
  return within(header).getByRole('button', { name: 'Next' });
}

const gridNames = (dialog: HTMLElement) =>
  within(dialog)
    .getAllByRole('grid')
    .map((grid) => grid.getAttribute('aria-label'));

describe('DateTimeField visible months', () => {
  it('UIC-DATE-TIME-FIELD-3.5 shows three captioned months with one focused day across them', async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-04-30', visibleMonths: 3 });
    const dialog = await openCalendar(user);
    const grids = within(dialog).getAllByRole('grid');
    expect(grids).toHaveLength(3);
    expect(new Set(gridNames(dialog)).size).toBe(3);
    const captions = dialog.querySelectorAll('.ui-date-time-field__calendar-month');
    expect([...captions].map((caption) => caption.textContent)).toEqual([
      'March 2026',
      'April 2026',
      'May 2026',
    ]);
    expect(captions[0]).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(document.body, 'DATE-TIME-FIELD', { slots: ['calendar-month'] });
    // The focused day moves from April's last day into May's grid.
    await user.keyboard('{ArrowRight}');
    expect(
      within(grids[2] as HTMLElement).getByRole('button', { name: /May 1, 2026/ }),
    ).toHaveFocus();
  });

  it('UIC-DATE-TIME-FIELD-3.5 shows one month without a caption by default', async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-04-13' });
    const dialog = await openCalendar(user);
    expect(within(dialog).getAllByRole('grid')).toHaveLength(1);
    expect(dialog.querySelector('.ui-date-time-field__calendar-month')).toBeNull();
  });

  it('UIC-DATE-TIME-FIELD-3.5 pages by the visible months or by one month', async () => {
    const user = userEvent.setup();
    const { unmount } = renderField({ defaultValue: '2026-04-13', visibleMonths: 2 });
    let dialog = await openCalendar(user);
    expect(gridNames(dialog)).toEqual([
      expect.stringMatching(/April 2026/),
      expect.stringMatching(/May 2026/),
    ]);
    await user.click(nextButton(dialog));
    expect(gridNames(dialog)).toEqual([
      expect.stringMatching(/June 2026/),
      expect.stringMatching(/July 2026/),
    ]);
    unmount();
    renderField({ defaultValue: '2026-04-13', visibleMonths: 2, calendarPaging: 'month' });
    dialog = await openCalendar(user);
    await user.click(nextButton(dialog));
    expect(gridNames(dialog)).toEqual([
      expect.stringMatching(/May 2026/),
      expect.stringMatching(/June 2026/),
    ]);
  });

  it('UIC-DATE-TIME-FIELD-3.5 picks a range from one month into the next', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    renderField({
      mode: 'date-range',
      visibleMonths: 3,
      defaultValue: { start: '2026-04-13', end: '2026-04-14' },
      onCommit,
    });
    const dialog = await openCalendar(user);
    expect(gridNames(dialog)).toEqual([
      expect.stringMatching(/March 2026/),
      expect.stringMatching(/April 2026/),
      expect.stringMatching(/May 2026/),
    ]);
    await user.click(within(dialog).getByRole('button', { name: /March 28, 2026/ }));
    await user.click(within(dialog).getByRole('button', { name: /May 3, 2026/ }));
    expect(onCommit).toHaveBeenCalledWith({ start: '2026-03-28', end: '2026-05-03' });
  });

  it('UIC-DATE-TIME-FIELD-3.5 keeps the value, the popover and the focused day when the count changes', async () => {
    const user = userEvent.setup();
    const { rerender } = renderField({ defaultValue: '2026-04-13', visibleMonths: 1 });
    const dialog = await openCalendar(user);
    const day = within(dialog).getByRole('button', { name: /April 13, 2026/ });
    expect(day).toHaveFocus();
    rerender(
      <UiProvider locale="en-US">
        <DateTimeField<'date' | 'date-range'>
          label="Due"
          defaultValue="2026-04-13"
          visibleMonths={2}
        />
      </UiProvider>,
    );
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(within(dialog).getAllByRole('grid')).toHaveLength(2);
    expect(within(dialog).getByRole('button', { name: /April 13, 2026/ })).toHaveFocus();
  });

  it("UIC-DATE-TIME-FIELD-3.5 writes the month captions in the locale's words", async () => {
    const user = userEvent.setup();
    renderField({ defaultValue: '2026-04-13', visibleMonths: 2 }, 'ar-EG');
    const dialog = await openCalendar(user);
    const captions = [...dialog.querySelectorAll('.ui-date-time-field__calendar-month')];
    expect(captions.map((caption) => caption.textContent)).toEqual([
      expect.stringMatching(/أبريل/),
      expect.stringMatching(/مايو/),
    ]);
  });
});
