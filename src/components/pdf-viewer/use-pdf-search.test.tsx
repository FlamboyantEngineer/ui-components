import { act, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderReady, searchStatus as status } from '../../../test/pdf-fixtures.js';
import type { PdfSearchControls } from './use-pdf-search.js';

const currentMatchPage = (container: HTMLElement) => {
  const current = container.querySelector('.ui-pdf-viewer__match[data-current]');
  const pages = [...container.querySelectorAll('.ui-pdf-viewer__page')];
  return pages.indexOf(current?.closest('.ui-pdf-viewer__page') as Element);
};

function CallerFind({ search }: { search: PdfSearchControls }) {
  return (
    <div>
      <button onClick={() => search.setQuery('pear')}>Find pears</button>
      <output aria-label="Matches">
        {search.isPending ? 'busy' : `${search.current + 1}/${search.total}`}
      </output>
      <button onClick={search.findPrevious}>Back</button>
      <button onClick={search.findNext}>Forward</button>
    </div>
  );
}

describe('PdfViewer find owned by the caller', () => {
  it('UIC-PDF-VIEWER-5.4 searches the caller query and reports typed queries', async () => {
    const onSearchQueryChange = vi.fn();
    const view = await renderReady({ searchQuery: 'pear', onSearchQueryChange });
    const field = screen.getByRole('searchbox', { name: 'Find in document' });
    expect(field).toHaveValue('pear');
    await waitFor(() => expect(status()).toHaveTextContent('1 of 2'));

    await userEvent.type(field, 's');
    expect(onSearchQueryChange).toHaveBeenLastCalledWith('pears');
    expect(field).toHaveValue('pear');

    view.update({ searchQuery: 'harvest', onSearchQueryChange });
    expect(field).toHaveValue('harvest');
    await waitFor(() => expect(status()).toHaveTextContent('1 of 4'));
    await userEvent.keyboard('{Escape}');
    expect(onSearchQueryChange).toHaveBeenLastCalledWith('');
  });

  it('UIC-PDF-VIEWER-5.5 follows the caller match, wrapping it, and proposes steps', async () => {
    const onMatchIndexChange = vi.fn();
    const props = { searchQuery: 'harvest', onMatchIndexChange };
    const view = await renderReady({ ...props, matchIndex: 0 });
    await waitFor(() => expect(status()).toHaveTextContent('1 of 4'));
    expect(onMatchIndexChange).toHaveBeenLastCalledWith(0);

    await userEvent.click(screen.getByRole('button', { name: 'Next match' }));
    expect(onMatchIndexChange).toHaveBeenLastCalledWith(1);
    expect(status()).toHaveTextContent('1 of 4');
    await userEvent.type(screen.getByRole('searchbox'), '{Shift>}{Enter}{/Shift}');
    expect(onMatchIndexChange).toHaveBeenLastCalledWith(3);

    view.update({ ...props, matchIndex: 6 });
    expect(status()).toHaveTextContent('3 of 4');
    expect(currentMatchPage(view.container)).toBe(1);
    view.update({ ...props, matchIndex: -1 });
    expect(status()).toHaveTextContent('4 of 4');
    expect(currentMatchPage(view.container)).toBe(2);
  });

  it('UIC-PDF-VIEWER-5.6 draws the caller find controls in place of its own', async () => {
    const onSearchQueryChange = vi.fn();
    const renderSearch = (search: PdfSearchControls) => <CallerFind search={search} />;
    const view = await renderReady({ renderSearch, onSearchQueryChange });
    const toolbar = screen.getByRole('toolbar');
    expect(within(toolbar).queryByRole('searchbox')).not.toBeInTheDocument();
    expect(view.container.querySelector('.ui-pdf-viewer .ui-find-bar__status')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Find pears' }));
    expect(onSearchQueryChange).toHaveBeenLastCalledWith('pear');
    await waitFor(() =>
      expect(within(toolbar).getByRole('status', { name: 'Matches' })).toHaveTextContent('1/2'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Forward' }));
    expect(within(toolbar).getByRole('status', { name: 'Matches' })).toHaveTextContent('2/2');
    expect(currentMatchPage(view.container)).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(currentMatchPage(view.container)).toBe(0);

    view.update({ renderSearch: () => null, searchQuery: 'harvest' });
    expect(within(toolbar).queryByRole('button', { name: 'Forward' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(view.container.querySelectorAll('.ui-pdf-viewer__match')).toHaveLength(4),
    );
  });

  it('UIC-PDF-VIEWER-5.7 toggles the find options from their menu', async () => {
    const onSearchOptionsChange = vi.fn();
    const view = await renderReady({ onSearchOptionsChange });
    await userEvent.type(screen.getByRole('searchbox'), 'Pear');
    expect(status()).toHaveTextContent('1 of 2');
    expect(view.container.querySelectorAll('.ui-pdf-viewer__match')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Find options' }));
    const menu = screen.getByRole('menu');
    const options = within(menu).getAllByRole('menuitemcheckbox');
    expect(options.map((option) => option.textContent)).toEqual([
      'Highlight all',
      'Match case',
      'Ignore accents',
      'Whole words',
    ]);
    expect(options.map((option) => option.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    await userEvent.click(within(menu).getByRole('menuitemcheckbox', { name: 'Match case' }));
    expect(onSearchOptionsChange).toHaveBeenLastCalledWith({
      highlightAll: true,
      matchCase: true,
      ignoreAccents: false,
      wholeWords: false,
    });
    expect(status()).toHaveTextContent('1 of 1');
    await userEvent.click(within(menu).getByRole('menuitemcheckbox', { name: 'Highlight all' }));
    await userEvent.keyboard('{Escape}');
    // Focus goes back to the menu button once the menu has closed.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Find options' })).toHaveFocus());
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.type(screen.getByRole('searchbox'), 'harvest');
    expect(status()).toHaveTextContent('1 of 4');
    const matches = view.container.querySelectorAll('.ui-pdf-viewer__match');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toHaveAttribute('data-current', 'true');
  });

  it('UIC-PDF-VIEWER-5.7 UIC-PDF-VIEWER-5.6 lets the caller own the find options', async () => {
    const onSearchOptionsChange = vi.fn();
    const seen: PdfSearchControls[] = [];
    const renderSearch = (search: PdfSearchControls) => {
      seen.push(search);
      return <CallerFind search={search} />;
    };
    const props = { searchQuery: 'pear', onSearchOptionsChange, renderSearch };
    const view = await renderReady({ ...props, searchOptions: { matchCase: true } });
    const matches = within(screen.getByRole('toolbar')).getByRole('status', { name: 'Matches' });
    await waitFor(() => expect(matches).toHaveTextContent('1/1'));
    expect(seen.at(-1)?.options).toEqual({
      highlightAll: true,
      matchCase: true,
      ignoreAccents: false,
      wholeWords: false,
    });
    act(() => seen.at(-1)?.setOptions({ wholeWords: true }));
    expect(onSearchOptionsChange).toHaveBeenLastCalledWith({ wholeWords: true });
    expect(matches).toHaveTextContent('1/1');

    view.update({ ...props, searchOptions: { wholeWords: true } });
    await waitFor(() => expect(matches).toHaveTextContent('1/2'));
  });
});
