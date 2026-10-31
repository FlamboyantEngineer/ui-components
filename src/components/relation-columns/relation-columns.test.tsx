import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { RelationColumns, type RelationColumnsProps } from './relation-columns.js';
import type { RelationColumnsPath, RelationDirection } from './relation-columns-model.js';

interface Entry {
  id: string;
  title: string;
}

const entries: Record<string, Entry> = {
  goal: { id: 'goal', title: 'Faster checkout' },
  need: { id: 'need', title: 'Requirement 12' },
  spec: { id: 'spec', title: 'Design 4' },
  plan: { id: 'plan', title: 'Design 5' },
  test: { id: 'test', title: 'Test 7' },
};
const links: Record<string, Partial<Record<RelationDirection, string[]>>> = {
  goal: { downstream: ['need'] },
  need: { upstream: ['goal'], downstream: ['spec', 'plan'] },
  spec: { upstream: ['need'], downstream: ['test'] },
  plan: { upstream: ['need'] },
  test: { upstream: ['spec'] },
};
const getRelated = (entry: Entry, direction: RelationDirection) =>
  (links[entry.id]?.[direction] ?? []).map((id) => entries[id] as Entry);

function Walk(props: Partial<RelationColumnsProps<Entry>>) {
  return (
    <RelationColumns
      aria-label="Trace"
      item={entries.need as Entry}
      getRelated={getRelated}
      getTextValue={(entry) => entry.title}
      {...props}
    />
  );
}

function Recentring({ onPathChange }: { onPathChange: (path: RelationColumnsPath) => void }) {
  const [key, setKey] = useState('need');
  return (
    <Walk
      item={entries[key] as Entry}
      onPathChange={onPathChange}
      onAction={(next: Key) => setKey(String(next))}
    />
  );
}

const column = (name: string) => screen.getByRole('grid', { name });
const rowNames = (name: string) =>
  within(column(name))
    .queryAllByRole('row')
    .map((row) => row.querySelector('.ui-list-row-content__title')?.textContent ?? row.textContent);
const crumbs = () =>
  [...document.querySelectorAll('.ui-relation-columns__path li')].map((crumb) => crumb.textContent);

describe('RelationColumns', () => {
  it('UIC-RELATION-COLUMNS-1.5 forwards ref to its root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Walk ref={ref} />);
    expect(ref.current).toBe(container.querySelector('.ui-relation-columns'));
  });

  it('UIC-RELATION-COLUMNS-1.1 UIC-RELATION-COLUMNS-1.5 UIC-RELATION-COLUMNS-3.1 shows the item between its upstream and downstream columns', () => {
    const { container } = render(<Walk id="trace" className="mine" data-test="walk" />);
    const root = screen.getByRole('group', { name: 'Trace' });
    expect(root).toHaveClass('ui-relation-columns', 'mine');
    expect(root).toHaveAttribute('id', 'trace');
    expect(root).toHaveAttribute('data-test', 'walk');
    const titles = [...container.querySelectorAll('.ui-relation-columns__column-title')].map(
      (title) => title.textContent,
    );
    expect(titles).toEqual(['Upstream of Requirement 12', 'Item', 'Downstream of Requirement 12']);
    const columns = container.querySelectorAll('.ui-relation-columns__column');
    expect(columns[0]).toHaveAttribute('data-direction', 'upstream');
    expect(columns[0]).toHaveAttribute('data-depth', '1');
    expect(columns[1]).toHaveAttribute('data-direction', 'item');
    expect(rowNames('Item')).toEqual(['Requirement 12']);
    expect(rowNames('Upstream of Requirement 12')).toEqual(['Faster checkout']);
    expect(rowNames('Downstream of Requirement 12')).toEqual(['Design 4', 'Design 5']);
    expect(crumbs()).toEqual(['Requirement 12']);
    expect(screen.getByRole('navigation', { name: 'Relation path Trace' })).toHaveClass(
      'ui-relation-columns__path',
    );
    expectHooksMatchSpec(container, 'RELATION-COLUMNS', {
      slots: [
        'path',
        'columns',
        'column',
        'column-header',
        'column-title',
        'column-count',
        'list',
        'item',
        'item-count',
      ],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-RELATION-COLUMNS-1.2 counts the items of each column and the items further along', () => {
    render(<Walk />);
    const header = column('Downstream of Requirement 12')
      .closest('.ui-relation-columns__column')
      ?.querySelector('.ui-relation-columns__column-count');
    expect(header).toHaveTextContent('22 items');
    const design = within(column('Downstream of Requirement 12')).getAllByRole(
      'row',
    )[0] as HTMLElement;
    expect(design.querySelector('.ui-relation-columns__item-count')).toHaveTextContent(
      '11 downstream',
    );
    const goal = within(column('Upstream of Requirement 12')).getAllByRole('row')[0] as HTMLElement;
    expect(goal.querySelector('.ui-relation-columns__item-count')).toHaveTextContent('00 upstream');
  });

  it('UIC-RELATION-COLUMNS-1.3 UIC-RELATION-COLUMNS-1.4 opens the next column on a choice and trims it from the trail', async () => {
    const onPathChange = vi.fn<(path: RelationColumnsPath) => void>();
    render(<Walk onPathChange={onPathChange} />);
    await userEvent.click(
      within(column('Downstream of Requirement 12')).getByRole('row', { name: /Design 4/ }),
    );
    expect(onPathChange).toHaveBeenLastCalledWith({ upstream: [], downstream: ['spec'] });
    expect(rowNames('Downstream of Design 4')).toEqual(['Test 7']);
    await userEvent.click(
      within(column('Downstream of Design 4')).getByRole('row', { name: /Test 7/ }),
    );
    expect(column('Downstream of Test 7')).toHaveAttribute('data-empty', 'true');
    expect(
      column('Downstream of Test 7')
        .closest('.ui-relation-columns__column')
        ?.querySelector('.ui-relation-columns__empty'),
    ).toHaveTextContent('No downstream items');
    await userEvent.click(
      within(column('Upstream of Requirement 12')).getByRole('row', { name: /Faster checkout/ }),
    );
    expect(crumbs()).toEqual(['Faster checkout', 'Requirement 12', 'Design 4', 'Test 7']);
    expect(screen.getByRole('grid', { name: 'Upstream of Faster checkout' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Design 4' }));
    expect(onPathChange).toHaveBeenLastCalledWith({ upstream: ['goal'], downstream: ['spec'] });
    expect(screen.queryByRole('grid', { name: 'Downstream of Test 7' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Requirement 12' }));
    expect(onPathChange).toHaveBeenLastCalledWith({ upstream: [], downstream: [] });
    expect(crumbs()).toEqual(['Requirement 12']);
  });

  it('UIC-RELATION-COLUMNS-1.3 follows a controlled path', () => {
    render(<Walk path={{ upstream: [], downstream: ['plan'] }} />);
    expect(screen.getByRole('grid', { name: 'Downstream of Design 5' })).toBeInTheDocument();
    expect(
      within(column('Downstream of Requirement 12')).getByRole('row', { name: /Design 5/ }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-RELATION-COLUMNS-1.6 starts the walk again from an activated item', async () => {
    const onPathChange = vi.fn<(path: RelationColumnsPath) => void>();
    render(<Recentring onPathChange={onPathChange} />);
    const design = within(column('Downstream of Requirement 12')).getByRole('row', {
      name: /Design 4/,
    });
    await userEvent.click(design);
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('grid', { name: 'Item' })).toHaveTextContent('Design 4');
    expect(rowNames('Downstream of Design 4')).toEqual(['Test 7']);
    expect(screen.queryByRole('grid', { name: 'Downstream of Test 7' })).not.toBeInTheDocument();
  });

  it('UIC-RELATION-COLUMNS-2.1 moves between items and columns with the arrow keys', async () => {
    render(<Walk defaultPath={{ upstream: [], downstream: ['plan'] }} />);
    await userEvent.click(within(column('Item')).getByRole('row'));
    await userEvent.keyboard('{ArrowRight}');
    expect(
      within(column('Downstream of Requirement 12')).getByRole('row', { name: /Design 5/ }),
    ).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(
      within(column('Downstream of Requirement 12')).getByRole('row', { name: /Design 4/ }),
    ).toHaveFocus();
    expect(rowNames('Downstream of Design 4')).toEqual(['Test 7']);
    await userEvent.keyboard('{ArrowRight}');
    expect(
      within(column('Downstream of Design 4')).getByRole('row', { name: /Test 7/ }),
    ).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(within(column('Upstream of Requirement 12')).getByRole('row')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(within(column('Upstream of Requirement 12')).getByRole('row')).toHaveFocus();
  });

  it('UIC-RELATION-COLUMNS-2.1 mirrors the arrow keys in right-to-left text', async () => {
    render(
      <UiProvider locale="ar-EG">
        <Walk />
      </UiProvider>,
    );
    await userEvent.click(within(column('Item')).getByRole('row'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(within(column('Downstream of Requirement 12')).getAllByRole('row')[0]).toHaveFocus();
  });
});
