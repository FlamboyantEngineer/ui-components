import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SelectField, type SelectFieldLoader, type SelectFieldOption } from './select-field.js';

const catalogue: SelectFieldOption[] = [
  { id: 'r1', label: 'Report.pdf', description: 'Document', icon: 'edit' },
  { id: 'r2', label: 'Report draft.pdf' },
  { id: 'b1', label: 'Budget.xlsx' },
];

function searchCatalogue(query: string) {
  const lower = query.toLowerCase();
  return catalogue.filter((option) => option.label.toLowerCase().includes(lower));
}

function trigger(name: RegExp | string = /Files$/) {
  return screen.getByRole('button', { name });
}

function optionKeys() {
  return screen.queryAllByRole('option').map((option) => option.getAttribute('data-key'));
}

/**
 * Sets the filter text the way an input event does. Typing through user-event would make it
 * dispatch a change event when the filter later loses focus, which can land while React unmounts
 * the popover.
 */
function search(text: string) {
  // eslint-disable-next-line testing-library/prefer-user-event -- user-event would dispatch a late change on blur, during the popover unmount (see above)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: text } });
}

describe('SelectField search', () => {
  it('UIC-SELECT-FIELD-5.1 searches once the query is long enough and typing pauses', async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn<SelectFieldLoader>(async (query) => searchCatalogue(query));
    render(
      <SelectField
        label="Files"
        options={[]}
        loadOptions={loadOptions}
        minSearchLength={3}
        searchDelay={100}
      />,
    );
    await user.click(trigger());
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    search('re');
    expect(screen.getByText('Type at least 3 characters to search.')).toBeInTheDocument();
    search('rep');
    search('repo');
    await waitFor(() => expect(optionKeys()).toEqual(['r1', 'r2']));
    expect(loadOptions).toHaveBeenCalledTimes(1);
    expect(loadOptions).toHaveBeenLastCalledWith('repo', expect.any(AbortSignal));
    search('report d');
    await waitFor(() => expect(optionKeys()).toEqual(['r2']));
    expect(loadOptions).toHaveBeenLastCalledWith('report d', expect.any(AbortSignal));
  });

  it('UIC-SELECT-FIELD-5.1 aborts a search that a newer query replaces', async () => {
    const user = userEvent.setup();
    const signals: AbortSignal[] = [];
    const pending: Array<(options: SelectFieldOption[]) => void> = [];
    const loadOptions: SelectFieldLoader = (query, signal) => {
      signals.push(signal);
      return new Promise((resolve) => pending.push(() => resolve(searchCatalogue(query))));
    };
    render(<SelectField label="Files" options={[]} loadOptions={loadOptions} searchDelay={0} />);
    await user.click(trigger());
    search('b');
    await waitFor(() => expect(signals).toHaveLength(1));
    search('bu');
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
    pending[1]?.([]);
    await waitFor(() => expect(optionKeys()).toEqual(['b1']));
  });

  it('UIC-SELECT-FIELD-5.1 lists the chosen options before the results', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Files"
        selectionMode="multiple"
        options={[{ id: 'b1', label: 'Budget.xlsx' }]}
        defaultValue={['b1']}
        loadOptions={async (query) => searchCatalogue(query)}
        searchDelay={0}
      />,
    );
    await user.click(trigger());
    expect(optionKeys()).toEqual(['b1']);
    search('report');
    await waitFor(() => expect(optionKeys()).toEqual(['b1', 'r1', 'r2']));
  });

  it('UIC-SELECT-FIELD-5.2 reports a running search, a failure and an empty result', async () => {
    const user = userEvent.setup();
    let release: (options: SelectFieldOption[]) => void = () => {};
    const loadOptions = vi.fn<SelectFieldLoader>(
      (query) =>
        new Promise((resolve, reject) => {
          if (query === 'fail') reject(new Error('offline'));
          else release = resolve;
        }),
    );
    render(<SelectField label="Files" options={[]} loadOptions={loadOptions} searchDelay={0} />);
    await user.click(trigger());
    expect(screen.getByText('Type to search.')).toBeInTheDocument();
    search('r');
    await waitFor(() => expect(screen.getByText('Loading')).toHaveClass('ui-select-field__empty'));
    release(catalogue.slice(0, 2));
    await waitFor(() => expect(optionKeys()).toEqual(['r1', 'r2']));
    search('re');
    const status = await screen.findByRole('status');
    expect(status).toHaveClass('ui-select-field__loading');
    expect(status).toHaveTextContent('Loading');
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['loading'] });
    release([]);
    expect(await screen.findByText('No results')).toBeInTheDocument();
    search('fail');
    expect(await screen.findByText('Search is unavailable.')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-5.3 keeps the label of a chosen searched option after new results', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Files"
        selectionMode="multiple"
        options={[]}
        loadOptions={async (query) => searchCatalogue(query)}
        searchDelay={0}
      />,
    );
    await user.click(trigger());
    search('budget');
    await user.click(await screen.findByRole('option', { name: 'Budget.xlsx' }));
    search('report');
    await waitFor(() => expect(optionKeys()).toEqual(['b1', 'r1', 'r2']));
    search('');
    await user.keyboard('{Escape}');
    const chips = screen.getByRole('grid', { name: 'Files selected values' });
    expect(within(chips).getByRole('row', { name: 'Budget.xlsx' })).not.toHaveAttribute(
      'data-missing',
    );
  });

  it('UIC-SELECT-FIELD-5.4 loads the next page when the end of the list scrolls into view', async () => {
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
    const loadOptions = vi.fn<SelectFieldLoader>(async (query, _signal, cursor) => {
      if (cursor === undefined) return { options: catalogue.slice(0, 2), cursor: 'page-2' };
      await new Promise<void>((resolve) => {
        releasePage = resolve;
      });
      return { options: catalogue.slice(2) };
    });
    render(
      <SelectField
        label="Files"
        options={[]}
        loadOptions={loadOptions}
        minSearchLength={0}
        searchDelay={0}
      />,
    );
    await user.click(trigger());
    await waitFor(() => expect(optionKeys()).toEqual(['r1', 'r2']));
    expect(loadOptions).toHaveBeenCalledWith('', expect.any(AbortSignal));
    const observe = observers.at(-1);
    act(() => observe?.([{ isIntersecting: true }]));
    await waitFor(() =>
      expect(loadOptions).toHaveBeenLastCalledWith('', expect.any(AbortSignal), 'page-2'),
    );
    const more = await screen.findByText('Loading');
    expect(more).toHaveClass('ui-select-field__load-more');
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['load-more'] });
    act(() => releasePage());
    await waitFor(() => expect(optionKeys()).toEqual(['r1', 'r2', 'b1']));
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    act(() => observers.at(-1)?.([{ isIntersecting: true }]));
    expect(loadOptions).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
