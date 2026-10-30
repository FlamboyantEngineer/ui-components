import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectField, type SelectFieldLoader } from './select-field.js';

type Observed = (entries: Array<{ isIntersecting: boolean }>) => void;

function stubObservers(): Observed[] {
  const observers: Observed[] = [];
  vi.stubGlobal('IntersectionObserver', function createObserver(callback: Observed) {
    observers.push(callback);
    return { observe() {}, disconnect() {} };
  });
  return observers;
}

const optionLabels = () => screen.queryAllByRole('option').map((option) => option.textContent);
const options = (labels: string[]) => labels.map((label) => ({ id: label, label }));

/** Sets the filter text as an input event does (see select-search.test.tsx). */
function search(text: string) {
  // eslint-disable-next-line testing-library/prefer-user-event -- user-event would dispatch a late change on blur, during the popover unmount
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } });
}

afterEach(() => vi.unstubAllGlobals());

describe('SelectField pages of replaced searches', () => {
  it('UIC-SELECT-FIELD-5.4 offers no next page after a replacing search fails', async () => {
    const observers = stubObservers();
    const user = userEvent.setup();
    const loadOptions = vi.fn<SelectFieldLoader>(async (query, _signal, cursor) => {
      if (query === 'blue') throw new Error('offline');
      return cursor === undefined
        ? { options: options(['alpha first']), cursor: 'alpha-page-2' }
        : { options: [] };
    });
    render(<SelectField label="Words" options={[]} loadOptions={loadOptions} searchDelay={0} />);
    await user.click(screen.getByRole('button', { name: /Words$/ }));
    search('alpha');
    await waitFor(() => expect(optionLabels()).toContain('alpha first'));
    search('blue');
    expect(await screen.findByText('Search is unavailable.')).toBeInTheDocument();
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    expect(loadOptions.mock.calls.map(([query, , cursor]) => [query, cursor])).toEqual([
      ['alpha', undefined],
      ['blue', undefined],
    ]);
  });

  it("UIC-SELECT-FIELD-5.4 keeps the current search's next page when a replaced page arrives late", async () => {
    const observers = stubObservers();
    const user = userEvent.setup();
    const pending = new Map<string, (result: Awaited<ReturnType<SelectFieldLoader>>) => void>();
    const loadOptions = vi.fn<SelectFieldLoader>(
      (query, _signal, cursor) =>
        new Promise((resolve) => pending.set(`${query} ${cursor ?? 'first'}`, resolve)),
    );
    render(<SelectField label="Words" options={[]} loadOptions={loadOptions} searchDelay={0} />);
    await user.click(screen.getByRole('button', { name: /Words$/ }));
    search('alpha');
    await waitFor(() => expect(pending.has('alpha first')).toBe(true));
    await act(async () =>
      pending.get('alpha first')?.({ options: options(['alpha first']), cursor: 'a2' }),
    );
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    search('blue');
    await waitFor(() => expect(pending.has('blue first')).toBe(true));
    await act(async () =>
      pending.get('blue first')?.({ options: options(['blue first']), cursor: 'b2' }),
    );
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    await waitFor(() => expect(pending.has('blue b2')).toBe(true));
    await act(async () => pending.get('alpha a2')?.({ options: options(['alpha second']) }));
    await act(async () => pending.get('blue b2')?.({ options: options(['blue second']) }));
    expect(optionLabels()).toEqual(['blue first', 'blue second']);
  });
});
