import { act, render, screen, waitFor } from '@testing-library/react';
import { type UserEvent, userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { Combobox, type ComboboxLoader, type ComboboxOption } from './combobox.js';

const cities: ComboboxOption[] = ['Paris', 'Lima', 'Oslo', 'Lisbon', 'Cairo'].map((name) => ({
  id: name.toLowerCase(),
  label: name,
}));

function findCities(query: string): ComboboxOption[] {
  const needle = query.toLowerCase();
  return cities.filter((city) => city.label.toLowerCase().includes(needle));
}

function input() {
  return screen.getByRole('combobox');
}

function optionLabels() {
  return screen.queryAllByRole('option').map((option) => option.textContent);
}

/** Replaces the input's text in one input event, as a paste over a selection does. */
async function setText(user: UserEvent, text: string) {
  const field = input() as HTMLInputElement;
  field.setSelectionRange(0, field.value.length);
  if (text === '') await user.clear(field);
  else await user.paste(text);
}

/** A loader whose searches settle only when the test settles them. */
function createDeferredLoader() {
  const calls: Array<{
    query: string;
    signal: AbortSignal;
    resolve: (items: ComboboxOption[]) => void;
    reject: (error: Error) => void;
  }> = [];
  const loadItems = vi.fn<ComboboxLoader>(
    (query, signal) =>
      new Promise((resolve, reject) => {
        calls.push({ query, signal, resolve, reject });
      }),
  );
  return { calls, loadItems };
}

afterEach(() => vi.useRealTimers());

describe('Combobox remote search', () => {
  it('UIC-COMBOBOX-3.1 UIC-COMBOBOX-5.1 retains typed search text while a controlled multiple selection stays unchanged', async () => {
    const user = userEvent.setup();
    const value: Key[] = [];
    const onChange = vi.fn();
    const loadItems = vi.fn<ComboboxLoader>(async (query) => findCities(query));
    render(
      <Combobox
        label="Cities"
        selectionMode="multiple"
        value={value}
        onChange={onChange}
        loadItems={loadItems}
        searchDelay={0}
      />,
    );
    await user.type(input(), 'lis');
    expect(input()).toHaveValue('lis');
    await user.click(await screen.findByRole('option', { name: 'Lisbon' }));
    expect(loadItems).toHaveBeenLastCalledWith('lis', expect.any(AbortSignal));
    expect(onChange).toHaveBeenLastCalledWith(['lisbon'], { reason: 'select' });
  });

  it('UIC-COMBOBOX-5.1 searches only an open list, at once on opening and after a pause in typing', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const loadItems = vi.fn<ComboboxLoader>(async (query) => findCities(query));
    render(<Combobox label="City" loadItems={loadItems} searchDelay={50} />);
    await user.click(input());
    expect(loadItems).not.toHaveBeenCalled();
    await setText(user, 'l');
    await act(() => vi.advanceTimersByTimeAsync(50));
    expect(optionLabels()).toEqual(['Lima', 'Oslo', 'Lisbon']);
    expect(loadItems).toHaveBeenCalledTimes(1);
    expect(loadItems).toHaveBeenLastCalledWith('l', expect.any(AbortSignal));
    await setText(user, 'li');
    await setText(user, 'lis ');
    await act(() => vi.advanceTimersByTimeAsync(49));
    expect(loadItems).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(optionLabels()).toEqual(['Lisbon']);
    // The pause skipped "li"; the trimmed text is searched.
    expect(loadItems).toHaveBeenCalledTimes(2);
    expect(loadItems).toHaveBeenLastCalledWith('lis', expect.any(AbortSignal));
  });

  it('UIC-COMBOBOX-5.1 aborts a search a newer one replaces and never shows its results', async () => {
    const user = userEvent.setup();
    const { calls, loadItems } = createDeferredLoader();
    render(<Combobox label="City" loadItems={loadItems} searchDelay={0} />);
    await user.click(input());
    await setText(user, 'l');
    await waitFor(() => expect(calls).toHaveLength(1));
    await setText(user, 'o');
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[0]?.signal.aborted).toBe(true);
    act(() => calls[1]?.resolve(findCities('o')));
    await waitFor(() => expect(optionLabels()).toEqual(['Oslo', 'Lisbon', 'Cairo']));
    await act(async () => calls[0]?.resolve(findCities('l')));
    expect(optionLabels()).toEqual(['Oslo', 'Lisbon', 'Cairo']);
  });

  it('UIC-COMBOBOX-5.1 lists sections unfiltered and keeps a picked option after the list closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const loadItems = vi.fn<ComboboxLoader>(async (query) => [
      { id: 'recent', label: 'Recently used', options: [{ id: 'cairo', label: 'Cairo' }] },
      { id: 'found', label: 'Search results', options: findCities(query) },
    ]);
    render(<Combobox label="City" loadItems={loadItems} searchDelay={0} onChange={onChange} />);
    await user.click(input());
    await setText(user, 'li');
    await waitFor(() => expect(optionLabels()).toEqual(['Cairo', 'Lima', 'Lisbon']));
    expect(screen.getByText('Recently used')).toHaveClass('ui-combobox__section-header');
    await user.click(screen.getByRole('option', { name: 'Lisbon' }));
    expect(onChange).toHaveBeenLastCalledWith('lisbon', { reason: 'select' });
    expect(input()).toHaveValue('Lisbon');
    await user.tab();
    expect(input()).toHaveValue('Lisbon');
    expect(loadItems).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMBOBOX-5.1 searches the empty text on opening with a zero minimum, and again at once for a new loader', async () => {
    const user = userEvent.setup();
    const first = vi.fn<ComboboxLoader>(async () => cities.slice(0, 2));
    const second = vi.fn<ComboboxLoader>(async () => cities.slice(2, 3));
    const { rerender } = render(
      <Combobox label="City" loadItems={first} minSearchLength={0} searchDelay={5000} />,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(optionLabels()).toEqual(['Paris', 'Lima']));
    expect(first).toHaveBeenCalledWith('', expect.any(AbortSignal));
    rerender(<Combobox label="City" loadItems={second} minSearchLength={0} searchDelay={5000} />);
    await waitFor(() => expect(optionLabels()).toEqual(['Oslo']));
    expect(second).toHaveBeenCalledWith('', expect.any(AbortSignal));
  });

  it('UIC-COMBOBOX-5.1 lists the given items while the text is too short to search', async () => {
    const user = userEvent.setup();
    const loadItems = vi.fn<ComboboxLoader>(async (query) => findCities(query));
    const recent = [{ id: 'recent', label: 'Recently used', options: cities.slice(4) }];
    render(<Combobox label="City" loadItems={loadItems} items={recent} searchDelay={0} />);
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(optionLabels()).toEqual(['Cairo']));
    await setText(user, 'pa');
    await waitFor(() => expect(optionLabels()).toEqual(['Paris']));
    await setText(user, '');
    await waitFor(() => expect(optionLabels()).toEqual(['Cairo']));
    await user.click(screen.getByRole('option', { name: 'Cairo' }));
    await user.tab();
    expect(input()).toHaveValue('Cairo');
    expect(loadItems).toHaveBeenCalledTimes(1);
  });

  it('UIC-COMBOBOX-5.2 marks the field busy while searching and states why the list is empty', async () => {
    const user = userEvent.setup();
    const { calls, loadItems } = createDeferredLoader();
    const { container } = render(
      <Combobox label="City" loadItems={loadItems} minSearchLength={2} searchDelay={0} />,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByText('Type at least 2 characters to search.')).toHaveClass(
      'ui-combobox__empty',
    );
    expect(loadItems).not.toHaveBeenCalled();
    await setText(user, 'xy');
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.ui-combobox')).toHaveAttribute('data-pending', 'true');
    expect(container.querySelector('.ui-combobox__spinner')).not.toBeNull();
    expect(screen.getByText('Loading')).toHaveClass('ui-combobox__empty');
    expectHooksMatchSpec(document.body, 'COMBOBOX', { slots: ['spinner', 'empty'] });
    act(() => calls[0]?.reject(new Error('offline')));
    expect(await screen.findByText('Search is unavailable.')).toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-busy');
    await setText(user, 'xyz');
    await waitFor(() => expect(calls).toHaveLength(2));
    act(() => calls[1]?.resolve([]));
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('UIC-COMBOBOX-5.3 loads the next page when the end of the list scrolls into view', async () => {
    const observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    vi.stubGlobal(
      'IntersectionObserver',
      function createObserver(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
        observers.push(callback);
        return { observe() {}, disconnect() {} };
      },
    );
    const user = userEvent.setup();
    let releasePage: () => void = () => {};
    const loadItems = vi.fn<ComboboxLoader>(async (_query, _signal, cursor) => {
      if (cursor === undefined) return { items: cities.slice(0, 2), cursor: 'page-2' };
      await new Promise<void>((resolve) => {
        releasePage = resolve;
      });
      return { items: cities.slice(2, 3) };
    });
    render(<Combobox label="City" loadItems={loadItems} searchDelay={0} />);
    await user.click(input());
    await setText(user, 'a');
    await waitFor(() => expect(optionLabels()).toEqual(['Paris', 'Lima']));
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    await waitFor(() =>
      expect(loadItems).toHaveBeenLastCalledWith('a', expect.any(AbortSignal), 'page-2'),
    );
    expect(await screen.findByText('Loading')).toHaveClass('ui-combobox__load-more');
    act(() => releasePage());
    await waitFor(() => expect(optionLabels()).toEqual(['Paris', 'Lima', 'Oslo']));
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    expect(loadItems).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('UIC-COMBOBOX-5.4 draws the caller empty state in place of No results', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="City"
        defaultItems={cities}
        renderEmptyState={() => <em>No city by that name</em>}
      />,
    );
    await user.type(input(), 'zz');
    const empty = await screen.findByText('No city by that name');
    expect(empty.closest('.ui-combobox__empty')).not.toBeNull();
    expect(screen.queryByText('No results')).not.toBeInTheDocument();
  });
});
