import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { VersionHistory, type VersionHistoryVersion } from './version-history.js';
import { listVersionRows } from './version-model.js';

const getNow = () => new Date(2026, 3, 20, 10, 30);
const maria = { name: 'Maria Santos' };
const jon = { name: 'Jon Berg' };

const versions: VersionHistoryVersion[] = [
  { id: 'v6', time: '2026-04-20T10:20:00', person: maria },
  {
    id: 'v5',
    label: 'Final draft',
    time: '2026-04-19T16:00:00',
    person: jon,
    children: [
      { id: 'v4', time: '2026-04-19T15:00:00', person: maria },
      { id: 'v3', time: '2026-04-19T14:00:00', person: jon },
    ],
  },
  { id: 'v2', label: 'First review', time: '2026-04-15', person: maria },
];

const rows = () => screen.getAllByRole('row');
const titles = () =>
  rows().map((row) => row.querySelector('.ui-version-history__label')?.textContent);

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('VersionHistory folded versions', () => {
  it('UIC-VERSION-HISTORY-1.11 folds versions under a version behind a toggle', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <VersionHistory versions={versions} getNow={getNow} onExpandedChange={onExpandedChange} />,
    );
    expect(rows()).toHaveLength(3);
    const toggle = screen.getByRole('button', { name: '2 earlier versions under Final draft' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(rows()[1]).not.toHaveAttribute('data-expanded');
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['v5']));
    expect(rows()).toHaveLength(5);
    expect(rows()[1]).toHaveAttribute('data-expanded', 'true');
    expect(rows()[2]).toHaveAttribute('data-nested', 'true');
    expect(rows()[3]).toHaveAttribute('data-nested', 'true');
    expect(rows()[4]).not.toHaveAttribute('data-nested');
    expectHooksMatchSpec(container, 'VERSION-HISTORY', { slots: ['list', 'version', 'fold'] });
    await user.click(toggle);
    expect(rows()).toHaveLength(3);
  });

  it('UIC-VERSION-HISTORY-1.11 compares and selects folded versions like any other', async () => {
    const user = userEvent.setup();
    const onCompare = vi.fn();
    render(
      <VersionHistory
        versions={versions}
        getNow={getNow}
        defaultExpandedKeys={['v5']}
        defaultSelectedKeys={['v3', 'v6']}
        onCompare={onCompare}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(onCompare).toHaveBeenCalledWith(['v3', 'v6']);
    expect(within(requireDefined(rows()[3])).getByRole('checkbox')).toBeChecked();
  });

  it('UIC-VERSION-HISTORY-1.11 keeps the filters: a kept folded version under a dropped one stands alone', () => {
    const { rerender } = render(
      <VersionHistory
        versions={versions}
        getNow={getNow}
        expandedKeys={['v5']}
        filter={{ namedOnly: true, person: null }}
      />,
    );
    expect(titles()).toEqual(['Final draft', 'First review']);
    expect(screen.queryByRole('button', { name: /earlier version/ })).not.toBeInTheDocument();
    rerender(
      <VersionHistory
        versions={versions}
        getNow={getNow}
        expandedKeys={['v5']}
        filter={{ namedOnly: false, person: 'Maria Santos' }}
      />,
    );
    expect(rows()).toHaveLength(3);
    expect(rows()[1]).not.toHaveAttribute('data-nested');
    expect(
      listVersionRows(versions, {
        filter: { namedOnly: false, person: 'Jon Berg' },
        expandedKeys: new Set(['v5']),
      }).map((row) => [row.version.id, row.isNested, row.foldedCount]),
    ).toEqual([
      ['v5', false, 1],
      ['v3', true, 0],
    ]);
  });
});
