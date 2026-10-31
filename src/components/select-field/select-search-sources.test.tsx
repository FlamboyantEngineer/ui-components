import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelectField, type SelectFieldLoader } from './select-field.js';

type Observed = (entries: Array<{ isIntersecting: boolean }>) => void;
type Page = Awaited<ReturnType<SelectFieldLoader>>;

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
const reachEnd = (observers: Observed[]) =>
  act(() => observers.at(-1)?.([{ isIntersecting: true }]));

/** A loader whose calls the test settles by `<name> <cursor or first>`. */
function pendingLoader(name: string, pending: Map<string, (page: Page) => void>) {
  return vi.fn<SelectFieldLoader>(
    (_query, _signal, cursor) =>
      new Promise((resolve) => pending.set(`${name} ${cursor ?? 'first'}`, resolve)),
  );
}

function renderField(loadOptions: SelectFieldLoader | undefined) {
  const field = (load: SelectFieldLoader | undefined) => (
    <SelectField
      label="Words"
      options={[]}
      loadOptions={load}
      minSearchLength={0}
      searchDelay={0}
    />
  );
  const view = render(field(loadOptions));
  return { replace: (next: SelectFieldLoader | undefined) => view.rerender(field(next)) };
}

async function open() {
  await userEvent.setup().click(screen.getByRole('button', { name: /Words$/ }));
}

afterEach(() => vi.unstubAllGlobals());

describe('SelectField searches of a replaced loader', () => {
  it('UIC-SELECT-FIELD-5.4 searches a new loader from its first page, never with the old cursor', async () => {
    const observers = stubObservers();
    const first = vi.fn<SelectFieldLoader>(async () => ({
      options: options(['from first']),
      cursor: 'first-next',
    }));
    const second = vi.fn<SelectFieldLoader>(async (_query, _signal, cursor) =>
      cursor === undefined
        ? { options: options(['from second']), cursor: 'second-next' }
        : { options: options(['second more']) },
    );
    const { replace } = renderField(first);
    await open();
    await waitFor(() => expect(optionLabels()).toEqual(['from first']));
    replace(second);
    reachEnd(observers);
    await waitFor(() => expect(optionLabels()).toEqual(['from second']));
    reachEnd(observers);
    await waitFor(() => expect(optionLabels()).toEqual(['from second', 'second more']));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second.mock.calls.map(([query, , cursor]) => [query, cursor])).toEqual([
      ['', undefined],
      ['', 'second-next'],
    ]);
  });

  it('UIC-SELECT-FIELD-5.4 drops first and next pages of the old loader that arrive late', async () => {
    const observers = stubObservers();
    const pending = new Map<string, (page: Page) => void>();
    const first = pendingLoader('first', pending);
    const second = pendingLoader('second', pending);
    const { replace } = renderField(first);
    await open();
    await act(async () =>
      pending.get('first first')?.({ options: options(['first one']), cursor: 'f2' }),
    );
    reachEnd(observers);
    expect(pending.has('first f2')).toBe(true);
    replace(second);
    await waitFor(() => expect(pending.has('second first')).toBe(true));
    await act(async () => pending.get('first f2')?.({ options: options(['first two']) }));
    expect(optionLabels()).toEqual(['first one']);
    await act(async () => pending.get('second first')?.({ options: options(['second one']) }));
    expect(optionLabels()).toEqual(['second one']);
  });

  it('UIC-SELECT-FIELD-5.4 drops a first page still loading when the loader changes', async () => {
    stubObservers();
    const pending = new Map<string, (page: Page) => void>();
    const first = pendingLoader('first', pending);
    const second = pendingLoader('second', pending);
    const { replace } = renderField(first);
    await open();
    replace(second);
    await waitFor(() => expect(pending.has('second first')).toBe(true));
    await act(async () =>
      pending.get('first first')?.({ options: options(['first one']), cursor: 'f2' }),
    );
    await act(async () => pending.get('second first')?.({ options: options(['second one']) }));
    expect(optionLabels()).toEqual(['second one']);
  });

  it('UIC-SELECT-FIELD-5.4 stops paging when the loader is removed', async () => {
    const observers = stubObservers();
    const first = vi.fn<SelectFieldLoader>(async () => ({
      options: options(['from first']),
      cursor: 'first-next',
    }));
    const { replace } = renderField(first);
    await open();
    await waitFor(() => expect(optionLabels()).toEqual(['from first']));
    replace(undefined);
    reachEnd(observers);
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('UIC-SELECT-FIELD-5.4 keeps paging a loader that is the same function each render', async () => {
    const observers = stubObservers();
    const load = vi.fn<SelectFieldLoader>(async (_query, _signal, cursor) =>
      cursor === undefined
        ? { options: options(['one']), cursor: 'next' }
        : { options: options(['two']) },
    );
    const { replace } = renderField(load);
    await open();
    await waitFor(() => expect(optionLabels()).toEqual(['one']));
    replace(load);
    reachEnd(observers);
    await waitFor(() => expect(optionLabels()).toEqual(['one', 'two']));
    expect(load).toHaveBeenCalledTimes(2);
  });
});
