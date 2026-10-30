import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxLoader, type ComboboxPage } from './combobox.js';

type Observed = (entries: Array<{ isIntersecting: boolean }>) => void;

function stubObservers(): Observed[] {
  const observers: Observed[] = [];
  vi.stubGlobal('IntersectionObserver', function createObserver(callback: Observed) {
    observers.push(callback);
    return { observe() {}, disconnect() {} };
  });
  return observers;
}

const input = () => screen.getByRole('combobox') as HTMLInputElement;
const optionLabels = () => screen.queryAllByRole('option').map((option) => option.textContent);
const page = (labels: string[], cursor?: string): ComboboxPage => ({
  items: labels.map((label) => ({ id: label, label })),
  cursor,
});

async function replaceText(user: UserEvent, text: string) {
  input().setSelectionRange(0, input().value.length);
  await user.paste(text);
}

afterEach(() => vi.unstubAllGlobals());

describe('Combobox pages of replaced searches', () => {
  it('UIC-COMBOBOX-5.3 offers no next page after a replacing search fails', async () => {
    const observers = stubObservers();
    const user = userEvent.setup();
    const loadItems = vi.fn<ComboboxLoader>(async (query, _signal, cursor) => {
      if (query === 'blue') throw new Error('offline');
      return cursor === undefined ? page(['alpha first'], 'alpha-page-2') : page([]);
    });
    render(<Combobox label="Word" loadItems={loadItems} searchDelay={0} />);
    await user.click(input());
    await replaceText(user, 'alpha');
    await waitFor(() => expect(optionLabels()).toEqual(['alpha first']));
    await replaceText(user, 'blue');
    expect(await screen.findByText('Search is unavailable.')).toBeInTheDocument();
    expect(optionLabels()).not.toContain('alpha first');
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    expect(loadItems.mock.calls.map(([query, , cursor]) => [query, cursor])).toEqual([
      ['alpha', undefined],
      ['blue', undefined],
    ]);
  });

  it("UIC-COMBOBOX-5.3 keeps the current search's next page when a replaced page arrives late", async () => {
    const observers = stubObservers();
    const user = userEvent.setup();
    const pending = new Map<string, (result: ComboboxPage) => void>();
    const loadItems = vi.fn<ComboboxLoader>(
      (query, _signal, cursor) =>
        new Promise((resolve) => pending.set(`${query} ${cursor ?? 'first'}`, resolve)),
    );
    render(<Combobox label="Word" loadItems={loadItems} searchDelay={0} />);
    await user.click(input());
    await replaceText(user, 'alpha');
    await act(async () => pending.get('alpha first')?.(page(['alpha first'], 'a2')));
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    await replaceText(user, 'blue');
    await waitFor(() => expect(pending.has('blue first')).toBe(true));
    await act(async () => pending.get('blue first')?.(page(['blue first'], 'b2')));
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    await waitFor(() => expect(pending.has('blue b2')).toBe(true));
    await act(async () => pending.get('alpha a2')?.(page(['alpha second'])));
    await act(async () => pending.get('blue b2')?.(page(['blue second'])));
    expect(optionLabels()).toEqual(['blue first', 'blue second']);
  });
});
