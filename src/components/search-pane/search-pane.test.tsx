import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pressComposingKeys } from '../../../test/composition.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SearchPane, type SearchPaneProps } from './search-pane.js';
import type { SearchPaneResult } from './search-results.js';
import type { SearchPaneHandle } from './use-search-pane.js';

/** `count` results for `pear`, each in its own sentence and section. */
function makeResults(count: number, overrides: Partial<SearchPaneResult> = {}): SearchPaneResult[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `r${index + 1}`,
    source: `Step ${index + 1}: poach the pear gently.`,
    start: `Step ${index + 1}: poach the `.length,
    end: `Step ${index + 1}: poach the pear`.length,
    label: `Section ${index + 1}`,
    ...overrides,
  }));
}

const three = makeResults(3);

function pane(props: Partial<SearchPaneProps> = {}) {
  return <SearchPane label="Find in the recipe" defaultQuery="pear" results={three} {...props} />;
}

const queryBox = () => screen.getByRole('searchbox', { name: 'Find in the recipe' });
const status = () => screen.getByRole('status');
const list = () => screen.getByRole('listbox', { name: 'Search results' });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SearchPane', () => {
  it('UIC-SEARCH-PANE-1.1 UIC-SEARCH-PANE-5.2 draws a find row with the query and options', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onSelectedOptionsChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      pane({
        ref,
        id: 'search',
        className: 'host',
        'data-panel': 'left',
        placeholder: 'Find a word',
        onQueryChange,
        options: [{ id: 'case', label: 'Match case' }],
        onSelectedOptionsChange,
        onClose: () => undefined,
      }),
    );
    const root = container.querySelector('.ui-search-pane');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('host');
    expect(root).toHaveAttribute('id', 'search');
    expect(root).toHaveAttribute('data-panel', 'left');
    expect(root).toHaveAttribute('data-mode', 'search');
    expect(container.querySelector('.ui-search-pane__header .ui-search-pane__find')).toHaveClass(
      'ui-find-bar',
    );
    expect(queryBox()).toHaveValue('pear');
    expect(queryBox()).toHaveAttribute('placeholder', 'Find a word');
    await user.type(queryBox(), 's');
    expect(onQueryChange).toHaveBeenLastCalledWith('pears');
    await user.click(screen.getByRole('button', { name: 'Find options' }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitemcheckbox', { name: 'Match case' }));
    expect(onSelectedOptionsChange).toHaveBeenLastCalledWith(new Set(['case']));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'SEARCH-PANE', {
      slots: ['header', 'find', 'results', 'result', 'result-label'],
      callerAttributes: ['data-panel'],
    });
  });

  it('UIC-SEARCH-PANE-1.2 shows each state distinctly, with its message', () => {
    const { container, rerender } = render(pane({ query: '' }));
    const root = container.querySelector('.ui-search-pane');
    const message = () => container.querySelector('.ui-search-pane__message');
    expect(root).toHaveAttribute('data-state', 'empty');
    expect(message()).toHaveTextContent('Type to search.');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(pane({ status: 'idle', results: [], query: 'pear' }));
    expect(root).toHaveAttribute('data-state', 'idle');
    expect(message()).toBeNull();
    expect(status()).toHaveTextContent('');
    rerender(pane({ status: 'pending', results: [], query: 'pear' }));
    expect(root).toHaveAttribute('data-state', 'pending');
    expect(status()).toHaveTextContent('Searching…');
    rerender(pane({ results: [], query: 'pear' }));
    expect(root).toHaveAttribute('data-state', 'no-results');
    expect(message()).toHaveTextContent('No results');
    expect(status()).toHaveTextContent('No results');
    rerender(pane({ status: 'error', query: 'pear' }));
    expect(root).toHaveAttribute('data-state', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent('The search failed.');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(pane({ status: 'error', message: 'The index is busy.', query: 'pear' }));
    expect(screen.getByRole('alert')).toHaveTextContent('The index is busy.');
    rerender(pane({ status: 'unavailable', query: '' }));
    expect(root).toHaveAttribute('data-state', 'unavailable');
    expect(message()).toHaveTextContent('Search is unavailable.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'SEARCH-PANE', { slots: ['message'] });
  });

  it('UIC-SEARCH-PANE-1.2 keeps the last results browsable while a new search runs', () => {
    const { container, rerender } = render(pane({ defaultCurrentKey: 'r2' }));
    rerender(pane({ defaultCurrentKey: 'r2', status: 'pending' }));
    expect(container.querySelector('.ui-search-pane')).toHaveAttribute('data-state', 'pending');
    expect(within(list()).getAllByRole('option')).toHaveLength(3);
    expect(status()).toHaveTextContent('Searching…');
  });

  it('UIC-SEARCH-PANE-1.3 steps through every result with Enter and Shift+Enter, wrapping', async () => {
    const user = userEvent.setup();
    const onCurrentKeyChange = vi.fn();
    render(pane({ onCurrentKeyChange }));
    expect(status()).toHaveTextContent('3 matches');
    await user.click(queryBox());
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r3');
    expect(status()).toHaveTextContent('3 of 3');
    await user.keyboard('{Enter}');
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r1');
    expect(status()).toHaveTextContent('1 of 3');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(status()).toHaveTextContent('3 of 3');
    await user.click(screen.getByRole('button', { name: 'Next match' }));
    expect(status()).toHaveTextContent('1 of 3');
    await user.click(screen.getByRole('button', { name: 'Previous match' }));
    expect(status()).toHaveTextContent('3 of 3');
    expect(queryBox()).toHaveValue('pear');
  });

  it('UIC-SEARCH-PANE-1.3 follows a controlled current result and steps from none to the first', async () => {
    const user = userEvent.setup();
    const onCurrentKeyChange = vi.fn();
    const { rerender } = render(pane({ currentKey: 'r2', onCurrentKeyChange }));
    expect(status()).toHaveTextContent('2 of 3');
    await user.click(screen.getByRole('button', { name: 'Next match' }));
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r3');
    expect(status()).toHaveTextContent('2 of 3');
    rerender(pane({ currentKey: null, onCurrentKeyChange }));
    expect(status()).toHaveTextContent('3 matches');
    await user.click(screen.getByRole('button', { name: 'Next match' }));
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r1');
  });

  it('UIC-SEARCH-PANE-1.3 ignores the Enter that confirms a text composition', () => {
    const onCurrentKeyChange = vi.fn();
    const onClose = vi.fn();
    render(pane({ onCurrentKeyChange, onClose }));
    pressComposingKeys(queryBox());
    expect(onCurrentKeyChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('UIC-SEARCH-PANE-1.4 closes on Escape anywhere and keeps the query and results', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(pane({ onClose, defaultCurrentKey: 'r1' }));
    await user.click(queryBox());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(queryBox()).toHaveValue('pear');
    await user.click(within(list()).getAllByRole('option')[1] as HTMLElement);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(within(list()).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-SEARCH-PANE-1.4 never empties the query on Escape without onClose', async () => {
    const user = userEvent.setup();
    render(pane());
    await user.click(queryBox());
    await user.keyboard('{Escape}');
    expect(queryBox()).toHaveValue('pear');
    expect(list()).toBeInTheDocument();
  });

  it('UIC-SEARCH-PANE-1.4 focuses the query and the replacement through its handle', async () => {
    const handleRef = createRef<SearchPaneHandle>();
    const onReplaceExpandedChange = vi.fn();
    render(
      pane({
        handleRef,
        defaultReplacement: 'plum',
        onReplace: () => undefined,
        onReplaceExpandedChange,
      }),
    );
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
    handleRef.current?.focusReplacement();
    expect(onReplaceExpandedChange).toHaveBeenCalledWith(true);
    const replacement = await screen.findByRole('textbox', { name: 'Replace with' });
    await waitFor(() => expect(replacement).toHaveFocus());
    expect(replacement).toHaveProperty('selectionStart', 0);
    expect(replacement).toHaveProperty('selectionEnd', 4);
    handleRef.current?.focusQuery();
    await waitFor(() => expect(queryBox()).toHaveFocus());
    expect(queryBox()).toHaveProperty('selectionEnd', 4);
  });

  it('UIC-SEARCH-PANE-1.4 UIC-SEARCH-PANE-3.1 takes Ctrl+F and Ctrl+H inside the pane, Ctrl+H only to replace', async () => {
    const user = userEvent.setup();
    const outside = vi.fn((event: KeyboardEvent) => event.defaultPrevented);
    document.addEventListener('keydown', outside);
    const { rerender } = render(pane());
    await user.click(within(list()).getAllByRole('option')[0] as HTMLElement);
    await user.keyboard('{Control>}h{/Control}');
    expect(outside).toHaveLastReturnedWith(false);
    await user.keyboard('{Control>}f{/Control}');
    await waitFor(() => expect(queryBox()).toHaveFocus());
    rerender(pane({ onReplaceAll: () => undefined }));
    await user.keyboard('{Meta>}h{/Meta}');
    expect(outside).toHaveLastReturnedWith(true);
    const replacement = await screen.findByRole('textbox', { name: 'Replace with' });
    await waitFor(() => expect(replacement).toHaveFocus());
    document.removeEventListener('keydown', outside);
  });

  it('UIC-SEARCH-PANE-2.1 UIC-SEARCH-PANE-5.1 lists every result in order and makes a chosen row current', async () => {
    const user = userEvent.setup();
    const onCurrentKeyChange = vi.fn();
    const results = [
      { ...makeResults(1)[0], description: 'Page 4' } as SearchPaneResult,
      ...makeResults(3).slice(1),
    ];
    const { container } = render(pane({ results, onCurrentKeyChange, defaultCurrentKey: 'r1' }));
    const rows = within(list()).getAllByRole('option');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Section 1 Page 4 Step 1: poach the pear gently.',
      'Section 2 Step 2: poach the pear gently.',
      'Section 3 Step 3: poach the pear gently.',
    ]);
    expect(rows[0]).toHaveAttribute('aria-selected', 'true');
    expect(rows[0]).toHaveAttribute('data-selected', 'true');
    await user.click(rows[2] as HTMLElement);
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r3');
    expect(rows[2]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(rows[1]).toHaveFocus();
    expect(rows[2]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r2');
    await user.keyboard('{ArrowUp}{ }');
    expect(onCurrentKeyChange).toHaveBeenLastCalledWith('r1');
    expect(status()).toHaveTextContent('1 of 3');
    expectHooksMatchSpec(container, 'SEARCH-PANE', {
      slots: ['result-description'],
    });
  });

  it('UIC-SEARCH-PANE-2.2 scrolls the current row into view as the current result changes', async () => {
    const user = userEvent.setup();
    const original = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(pane());
      await user.click(queryBox());
      await user.keyboard('{Enter}{Enter}');
      expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts.at(-1)).toHaveTextContent('Step 2');
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('UIC-SEARCH-PANE-2.3 mounts a page of rows while the count and stepping cover every result', async () => {
    const user = userEvent.setup();
    const results = makeResults(650);
    const { container } = render(pane({ results, maxMountedResults: 200 }));
    expect(within(list()).getAllByRole('option')).toHaveLength(200);
    expect(status()).toHaveTextContent('650 matches');
    expect(screen.queryByRole('button', { name: /earlier result/ })).not.toBeInTheDocument();
    const later = screen.getByRole('button', { name: 'Show 450 more results' });
    await user.click(queryBox());
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(status()).toHaveTextContent('650 of 650');
    const rows = within(list()).getAllByRole('option');
    expect(rows).toHaveLength(50);
    expect(rows.at(-1)).toHaveAttribute('aria-selected', 'true');
    expect(later).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show 600 earlier results' }));
    expect(within(list()).getAllByRole('option')[0]).toHaveTextContent('Section 401');
    await user.click(screen.getByRole('button', { name: 'Show 50 more results' }));
    expect(within(list()).getAllByRole('option')[0]).toHaveTextContent('Section 601');
    await user.click(queryBox());
    await user.keyboard('{Enter}');
    expect(status()).toHaveTextContent('1 of 650');
    expect(within(list()).getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
    expectHooksMatchSpec(container, 'SEARCH-PANE', { slots: ['show-later'] });
  });

  it('UIC-SEARCH-PANE-3.1 draws no replace controls in a search-only pane', () => {
    const handleRef = createRef<SearchPaneHandle>();
    const { container } = render(
      pane({ handleRef, results: makeResults(2, { isReplaceable: false }) }),
    );
    expect(screen.queryByRole('button', { name: 'Toggle replace' })).not.toBeInTheDocument();
    handleRef.current?.focusReplacement();
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
    expect(container.querySelector('.ui-search-pane__result-read-only')).toBeNull();
    expect(container.querySelector('[data-read-only]')).toBeNull();
  });

  it('UIC-SEARCH-PANE-3.2 shows and hides the replace controls from its toggle', async () => {
    const user = userEvent.setup();
    const onReplaceExpandedChange = vi.fn();
    const onReplacementChange = vi.fn();
    const { container } = render(
      pane({ onReplace: () => undefined, onReplaceExpandedChange, onReplacementChange }),
    );
    const root = container.querySelector('.ui-search-pane');
    expect(root).toHaveAttribute('data-mode', 'replace');
    const toggle = screen.getByRole('button', { name: 'Toggle replace' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.querySelector('[data-glyph="chevron-right"]')).not.toBeNull();
    await user.click(toggle);
    expect(onReplaceExpandedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(root).toHaveAttribute('data-replace-expanded', 'true');
    await user.type(screen.getByRole('textbox', { name: 'Replace with' }), 'fig');
    expect(onReplacementChange).toHaveBeenLastCalledWith('fig');
    await user.click(toggle);
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
    expect(root).not.toHaveAttribute('data-replace-expanded');
    await user.click(toggle);
    expect(screen.getByRole('textbox', { name: 'Replace with' })).toHaveValue('fig');
    expectHooksMatchSpec(container, 'SEARCH-PANE', { slots: ['replace-toggle'] });
  });

  it('UIC-SEARCH-PANE-3.2 follows a controlled disclosure', () => {
    const { rerender } = render(pane({ onReplace: () => undefined, isReplaceExpanded: true }));
    expect(screen.getByRole('textbox', { name: 'Replace with' })).toBeInTheDocument();
    rerender(pane({ onReplace: () => undefined, isReplaceExpanded: false }));
    expect(screen.queryByRole('textbox', { name: 'Replace with' })).not.toBeInTheDocument();
  });

  it('UIC-SEARCH-PANE-3.3 replaces the current result and every result', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    const onReplaceAll = vi.fn();
    render(
      pane({
        onReplace,
        onReplaceAll,
        defaultReplaceExpanded: true,
        defaultReplacement: 'plum',
      }),
    );
    const replace = screen.getByRole('button', { name: 'Replace' });
    expect(replace).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next match' }));
    expect(replace).toBeEnabled();
    await user.click(replace);
    expect(onReplace).toHaveBeenLastCalledWith('plum', 'r1');
    await user.click(screen.getByRole('textbox', { name: 'Replace with' }));
    await user.keyboard('{Enter}');
    expect(onReplace).toHaveBeenCalledTimes(2);
    expect(status()).toHaveTextContent('1 of 3');
    await user.click(screen.getByRole('button', { name: 'Replace all' }));
    expect(onReplaceAll).toHaveBeenLastCalledWith('plum');
  });

  it('UIC-SEARCH-PANE-3.3 disables each action on its own, and marks results that cannot be replaced', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    const results = [...makeResults(1), ...makeResults(2, { isReplaceable: false }).slice(1)];
    const props = {
      results,
      onReplace,
      onReplaceAll: () => undefined,
      defaultReplaceExpanded: true,
    };
    const { container, rerender } = render(pane({ ...props, defaultCurrentKey: 'r2' }));
    const rows = within(list()).getAllByRole('option');
    expect(rows[1]).toHaveAttribute('data-read-only', 'true');
    expect(rows[1]).toHaveTextContent('Can’t be replaced');
    expect(rows[0]).not.toHaveAttribute('data-read-only');
    expect(screen.getByRole('button', { name: 'Replace' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeEnabled();
    await user.click(screen.getByRole('textbox', { name: 'Replace with' }));
    await user.keyboard('x{Enter}');
    expect(onReplace).not.toHaveBeenCalled();
    rerender(
      pane({
        ...props,
        defaultCurrentKey: 'r2',
        currentKey: 'r1',
        isReplaceDisabled: true,
        isReplaceAllDisabled: true,
      }),
    );
    expect(screen.getByRole('button', { name: 'Replace' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeDisabled();
    rerender(
      pane({ ...props, currentKey: 'r1', results: makeResults(2, { isReplaceable: false }) }),
    );
    expect(screen.getByRole('button', { name: 'Replace all' })).toBeDisabled();
    expectHooksMatchSpec(container, 'SEARCH-PANE', { slots: ['result-read-only'] });
  });

  it('UIC-SEARCH-PANE-5.1 names its parts and keeps them in order', () => {
    const { container } = render(
      pane({
        results: makeResults(5),
        maxMountedResults: 2,
        defaultCurrentKey: 'r3',
        onReplace: () => undefined,
      }),
    );
    const named = [
      screen.getByRole('button', { name: 'Toggle replace' }),
      queryBox(),
      screen.getByRole('button', { name: 'Show 2 earlier results' }),
      list(),
      screen.getByRole('button', { name: 'Show 1 more result' }),
    ];
    const order = [...container.querySelectorAll('button, input, [role="listbox"]')];
    const positions = named.map((element) => order.indexOf(element));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expectHooksMatchSpec(container, 'SEARCH-PANE', { slots: ['show-earlier', 'show-later'] });
  });
});
