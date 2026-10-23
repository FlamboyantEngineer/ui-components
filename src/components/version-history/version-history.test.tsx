import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  VersionHistory,
  type VersionHistoryFilter,
  type VersionHistoryVersion,
} from './version-history.js';
import {
  filterVersions,
  limitSelection,
  listVersionPeople,
  orderForComparison,
} from './version-model.js';

const getNow = () => new Date(2026, 3, 20, 10, 30);
const maria = { name: 'Maria Santos' };
const jon = { name: 'Jon Berg' };
const lena = { name: 'Lena Ortiz' };

const versions: VersionHistoryVersion[] = [
  { id: 'v5', time: '2026-04-20T10:20:00', person: maria },
  {
    id: 'v4',
    label: ' Final draft ',
    time: '2026-04-19T16:00:00',
    person: jon,
    summary: 'Tightened the introduction',
  },
  { id: 'v3', time: '2026-04-18T09:00:00', person: maria },
  { id: 'v2', label: 'First review', time: '2026-04-15', person: lena },
  { id: 'v1', time: 'unreadable' },
];

const rows = () => screen.getAllByRole('row');
const titles = () =>
  rows().map((row) => row.querySelector('.ui-version-history__label')?.textContent);
const checkbox = (index: number) => within(rows()[index]!).getByRole('checkbox');

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

async function openMenu(index: number) {
  await userEvent.click(within(rows()[index]!).getByRole('button', { name: /^Actions for/ }));
  return screen.getByRole('menu');
}

// Menus and dialogs driven by userEvent are slow in jsdom on a busy machine.
describe('VersionHistory', { timeout: 15_000 }, () => {
  it('UIC-VERSION-HISTORY-1.1 keeps numeric and text IDs distinct when a version is removed', () => {
    const entries: VersionHistoryVersion[] = [
      { id: 1, label: 'Numeric version', time: '2026-04-20' },
      { id: '1', label: 'Text version', time: '2026-04-20' },
    ];
    const { rerender } = render(<VersionHistory versions={entries} getNow={getNow} />);
    const textVersion = screen.getByText('Text version');
    rerender(<VersionHistory versions={entries.slice(1)} getNow={getNow} />);
    expect(screen.getByText('Text version')).toBe(textVersion);
    expect(screen.queryByText('Numeric version')).not.toBeInTheDocument();
  });

  it('UIC-VERSION-HISTORY-1.1 lists the versions in a grid', () => {
    const { container } = render(<VersionHistory versions={versions} getNow={getNow} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('ui-version-history');
    const grid = screen.getByRole('grid');
    expect(grid).toHaveClass('ui-list-view', 'ui-version-history__list');
    expect(rows()).toHaveLength(5);
    expect(rows()[0]).toHaveClass('ui-list-view-item', 'ui-version-history__version');
    expectHooksMatchSpec(container, 'VERSION-HISTORY', {
      slots: ['toolbar', 'named-only', 'person', 'list', 'version', 'label', 'attribution'],
    });
  });

  it('UIC-VERSION-HISTORY-1.2 titles each version and marks the current one', () => {
    const { container } = render(
      <VersionHistory versions={versions} currentKey="v5" getNow={getNow} showAvatar />,
    );
    expect(titles()[0]).toMatch(/^Apr 20, 2026, 10:20\sAM$/);
    expect(titles()[1]).toBe('Final draft');
    expect(titles()[2]).toMatch(/^Apr 18, 2026, 9:00\sAM$/);
    expect(titles()[3]).toBe('First review');
    expect(titles()[4]).toBe('Unknown time');
    expect(rows().map((row) => row.getAttribute('data-named'))).toEqual([
      null,
      'true',
      null,
      'true',
      null,
    ]);
    expect(rows()[0]).toHaveAttribute('data-current', 'true');
    expect(rows()[0]!.querySelector('.ui-version-history__current')).toHaveTextContent('Current');
    expect(container.querySelectorAll('.ui-version-history__current')).toHaveLength(1);
    expect(rows()[1]!.querySelector('.ui-version-history__attribution')).toHaveTextContent(
      '18 hours ago by JBJon Berg',
    );
    expect(rows()[1]!.querySelector('.ui-version-history__summary')).toHaveTextContent(
      'Tightened the introduction',
    );
    expect(rows()[0]!.querySelector('.ui-version-history__summary')).toBeNull();
    expectHooksMatchSpec(container, 'VERSION-HISTORY', { slots: ['current', 'summary'] });
  });

  it('UIC-VERSION-HISTORY-1.3 selects at most two versions', async () => {
    const onSelectionChange = vi.fn<(keys: Set<Key>) => void>();
    render(
      <VersionHistory
        versions={versions}
        getNow={getNow}
        defaultSelectedKeys={['v4']}
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(rows()[1]).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(checkbox(2));
    expect([...onSelectionChange.mock.lastCall![0]]).toEqual(['v4', 'v3']);
    await userEvent.click(rows()[0]!);
    expect([...onSelectionChange.mock.lastCall![0]]).toEqual(['v3', 'v5']);
    expect(rows().map((row) => row.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'true',
      'false',
      'false',
    ]);
    await userEvent.keyboard('{Control>}a{/Control}');
    expect(rows().filter((row) => row.getAttribute('aria-selected') === 'true')).toHaveLength(2);
    expect(limitSelection(new Set(['a', 'b']), new Set(['b', 'c', 'a']))).toEqual(
      new Set(['b', 'c']),
    );
    expect([...limitSelection(new Set(['a']), new Set())]).toEqual([]);
  });

  it('UIC-VERSION-HISTORY-1.3 follows a controlled selection', async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <VersionHistory
        versions={versions}
        selectedKeys={['v2']}
        onSelectionChange={onSelectionChange}
      />,
    );
    await userEvent.click(checkbox(0));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['v2', 'v5']));
    expect(rows()[0]).toHaveAttribute('aria-selected', 'false');
    rerender(<VersionHistory versions={versions} selectedKeys={['v1', 'v3']} />);
    expect(rows()[2]).toHaveAttribute('aria-selected', 'true');
    expect(rows()[3]).toHaveAttribute('aria-selected', 'false');
  });

  it('UIC-VERSION-HISTORY-1.4 compares two selected versions, older first', async () => {
    const onCompare = vi.fn();
    const { container } = render(
      <VersionHistory versions={versions} getNow={getNow} onCompare={onCompare} />,
    );
    const compare = screen.getByRole('button', { name: 'Compare' });
    expect(compare).toHaveClass('ui-button', 'ui-version-history__compare');
    expect(compare).toBeDisabled();
    await userEvent.click(checkbox(1));
    expect(compare).toBeDisabled();
    await userEvent.click(checkbox(3));
    expect(compare).toBeEnabled();
    await userEvent.click(compare);
    expect(onCompare).toHaveBeenCalledWith(['v2', 'v4']);
    expect(orderForComparison(versions, new Set(['v1', 'v5']))).toEqual(['v1', 'v5']);
    expect(orderForComparison(versions, new Set(['v5']))).toBeNull();
    expectHooksMatchSpec(container, 'VERSION-HISTORY', { slots: ['compare'] });
  });

  it('UIC-VERSION-HISTORY-1.5 restores a version after a confirmation', async () => {
    let settle = () => {};
    const onRestore = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    const { container } = render(
      <VersionHistory versions={versions} currentKey="v5" getNow={getNow} onRestore={onRestore} />,
    );
    expect(
      within(rows()[0]!).queryByRole('button', { name: /^Actions for/ }),
    ).not.toBeInTheDocument();
    const trigger = within(rows()[1]!).getByRole('button', { name: 'Actions for Final draft' });
    expect(trigger.closest('.ui-version-history__actions')).not.toBeNull();
    expectHooksMatchSpec(container, 'VERSION-HISTORY', { slots: ['actions'] });
    await openMenu(1);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Restore this version' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Restore Final draft?' });
    expect(dialog).toHaveTextContent('Its content replaces the current content.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));
    expect(onRestore).toHaveBeenCalledWith('v4');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    settle();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

    await openMenu(2);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Restore this version' }));
    const second = await screen.findByRole('alertdialog', { name: /^Restore Apr 18, 2026/ });
    await userEvent.click(within(second).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('UIC-VERSION-HISTORY-1.6 names and renames versions', async () => {
    const onRename = vi.fn();
    render(<VersionHistory versions={versions} currentKey="v5" onRename={onRename} />);
    let menu = await openMenu(0);
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Name this version']);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Name this version' }));
    let dialog = await screen.findByRole('dialog', { name: 'Name this version' });
    const field = within(dialog).getByRole('textbox', { name: 'Version name' });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue('');
    await userEvent.type(field, '  Release candidate ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onRename).toHaveBeenCalledWith('v5', 'Release candidate');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    menu = await openMenu(1);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Rename version' }));
    dialog = await screen.findByRole('dialog', { name: 'Rename version' });
    const named = within(dialog).getByRole('textbox', { name: 'Version name' });
    expect(named).toHaveValue('Final draft');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onRename).toHaveBeenCalledTimes(1);

    await openMenu(3);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Rename version' }));
    dialog = await screen.findByRole('dialog', { name: 'Rename version' });
    const cleared = within(dialog).getByRole('textbox', { name: 'Version name' });
    await userEvent.clear(cleared);
    await userEvent.type(cleared, '{Enter}');
    expect(onRename).toHaveBeenLastCalledWith('v2', '');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('UIC-VERSION-HISTORY-1.6 saves a name once per Enter or Control+Enter and shows a failure', async () => {
    const user = userEvent.setup();
    let fail!: (error: unknown) => void;
    const onRename = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    );
    render(<VersionHistory versions={versions} currentKey="v5" onRename={onRename} />);
    await user.click(within(rows()[0]!).getByRole('button', { name: /^Actions for/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Name this version' }));
    const dialog = await screen.findByRole('dialog', { name: 'Name this version' });
    const action = within(dialog).getByRole('button', { name: 'Save' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Version name' }), 'Blue');
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith('v5', 'Blue');
    expect(action).toHaveAttribute('data-pending', 'true');
    await act(async () => fail(new Error('Name taken')));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Name taken');
    expect(screen.getByRole('dialog', { name: 'Name this version' })).toBeInTheDocument();
  });

  it('UIC-VERSION-HISTORY-1.7 filters to named versions and to one person', async () => {
    const onFilterChange = vi.fn<(filter: VersionHistoryFilter) => void>();
    const { container } = render(
      <VersionHistory versions={versions} getNow={getNow} onFilterChange={onFilterChange} />,
    );
    const named = screen.getByRole('switch', { name: 'Named versions only' });
    expect(named.closest('.ui-version-history__named-only')).toHaveClass('ui-switch');
    await userEvent.click(named);
    expect(onFilterChange).toHaveBeenLastCalledWith({ namedOnly: true, person: null });
    expect(titles()).toEqual(['Final draft', 'First review']);
    await userEvent.click(named);
    const person = screen.getByRole('button', { name: 'Edited by anyone' });
    expect(person.closest('.ui-version-history__person')).not.toBeNull();
    await userEvent.click(person);
    expect(
      within(screen.getByRole('menu'))
        .getAllByRole('menuitemradio')
        .map((item) => item.textContent),
    ).toEqual(['Anyone', 'Maria Santos', 'Jon Berg', 'Lena Ortiz']);
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Maria Santos' }));
    expect(onFilterChange).toHaveBeenLastCalledWith({ namedOnly: false, person: 'Maria Santos' });
    expect(rows()).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Edited by Maria Santos' })).toBeInTheDocument();
    await userEvent.click(named);
    expect(screen.getByRole('grid')).toHaveTextContent('No versions match the filters.');
    expect(container.querySelector('.ui-version-history__version')).toBeNull();
    expect(listVersionPeople([...versions, { id: 'x', time: '', person: { name: ' ' } }])).toEqual([
      'Maria Santos',
      'Jon Berg',
      'Lena Ortiz',
    ]);
    expect(filterVersions(versions, { namedOnly: true, person: 'Lena Ortiz' })).toEqual([
      versions[3],
    ]);
  });

  it('UIC-VERSION-HISTORY-1.7 follows a controlled filter and hides the filters on request', () => {
    const { container, rerender } = render(
      <VersionHistory versions={versions} filter={{ namedOnly: false, person: 'Jon Berg' }} />,
    );
    expect(titles()).toEqual(['Final draft']);
    rerender(<VersionHistory versions={versions} showFilters={false} />);
    expect(container.querySelector('.ui-version-history__toolbar')).toBeNull();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    rerender(<VersionHistory versions={versions} showFilters={false} onCompare={() => {}} />);
    expect(container.querySelector('.ui-version-history__toolbar')).toHaveTextContent(/^Compare$/);
    rerender(
      <VersionHistory versions={versions} defaultFilter={{ namedOnly: true, person: null }} />,
    );
    expect(rows()).toHaveLength(5);
  });

  it('UIC-VERSION-HISTORY-1.8 disables versions', async () => {
    render(
      <VersionHistory
        versions={versions.map((version) =>
          version.id === 'v3' ? { ...version, isDisabled: true } : version,
        )}
        onRestore={() => {}}
      />,
    );
    expect(rows()[2]).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(rows()[2]!).queryByRole('button', { name: /^Actions for/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(rows()[2]!);
    expect(rows()[2]).not.toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-VERSION-HISTORY-1.9 shows loading, errors and the empty list', async () => {
    const onRetry = vi.fn();
    const { container, rerender } = render(<VersionHistory versions={[]} isLoading />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-loading', 'true');
    expect(within(screen.getByRole('grid')).getByRole('status')).toHaveTextContent('Loading');
    rerender(<VersionHistory versions={[]} />);
    expect(root).not.toHaveAttribute('data-loading');
    expect(screen.getByRole('grid')).toHaveTextContent('No versions yet.');
    rerender(<VersionHistory versions={[]} renderEmptyState={() => 'Never saved'} />);
    expect(screen.getByRole('grid')).toHaveTextContent(/^Never saved$/);
    rerender(
      <VersionHistory versions={versions} error="The history could not load." onRetry={onRetry} />,
    );
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    const error = container.querySelector('.ui-version-history__error');
    expect(error).toHaveClass('ui-empty-state');
    expect(error).toHaveAttribute('data-variant', 'error');
    expect(error).toHaveTextContent('The history could not load.');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'VERSION-HISTORY', { slots: ['error'] });
  });

  it('UIC-VERSION-HISTORY-1.9 loads older versions inside the list', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(
      <VersionHistory versions={versions} onLoadMore={() => {}} isLoading />,
    );
    expect(container.querySelector('.ui-list-view__loader')).toHaveTextContent('Loading');
    vi.unstubAllGlobals();
  });

  it('UIC-VERSION-HISTORY-1.10 forwards id, ref, class names and caller attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <VersionHistory
        versions={versions}
        id="history"
        ref={ref}
        className="host"
        data-test="history"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'history');
    expect(root).toHaveClass('ui-version-history', 'host');
    expect(root).toHaveAttribute('data-test', 'history');
    expectHooksMatchSpec(container, 'VERSION-HISTORY', { callerAttributes: ['data-test'] });
  });

  it('UIC-VERSION-HISTORY-2.1 names the list and moves through it by keyboard', async () => {
    const { rerender } = render(
      <UiProvider strings={{ versionHistory: 'Saved versions' }}>
        <VersionHistory versions={versions} showFilters={false} onRestore={() => {}} />
      </UiProvider>,
    );
    const grid = screen.getByRole('grid', { name: 'Saved versions' });
    await userEvent.tab();
    expect(rows()[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(rows()[1]).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(rows()[1]).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(within(rows()[1]!).getByRole('checkbox')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(
      within(rows()[1]!).getByRole('button', { name: 'Actions for Final draft' }),
    ).toHaveFocus();
    expect(grid).toBeInTheDocument();
    rerender(
      <VersionHistory versions={versions} aria-label="Report versions" aria-describedby="x" />,
    );
    expect(screen.getByRole('grid', { name: 'Report versions' })).toHaveAttribute(
      'aria-describedby',
      'x',
    );
  });
});
