import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tree } from './tree.js';
import type { TreeProps, TreeSectionData } from './tree-props.js';

interface Entry {
  id: string;
  name: string;
  group?: string;
  children?: Entry[];
}

const GROUPS: Record<string, TreeSectionData> = {
  plans: { id: 'plans', label: 'Plans' },
  notes: { id: 'notes', label: 'Notes' },
  // Another section with the same label as `notes`.
  archive: { id: 'archive', label: 'Notes' },
};

const ENTRIES: Entry[] = [
  {
    id: 'roadmap',
    name: 'Roadmap',
    group: 'plans',
    children: [{ id: 'milestones', name: 'Milestones' }],
  },
  { id: 'minutes', name: 'Minutes', group: 'notes' },
  { id: 'budget', name: 'Budget', group: 'plans' },
  { id: 'drafts', name: 'Drafts', group: 'archive' },
];

const getSection = (entry: Entry) => (entry.group ? GROUPS[entry.group] : undefined);

function SectionTree(props: Partial<TreeProps<Entry>>) {
  return (
    <Tree
      aria-label="Library"
      items={ENTRIES}
      getTextValue={(entry) => entry.name}
      getSection={getSection}
      {...props}
    />
  );
}

const focusedName = () => document.activeElement?.getAttribute('aria-label');
const sectionNames = () =>
  screen.queryAllByRole('rowgroup').map((group) => group.getAttribute('aria-labelledby'));
const sectionRows = (label: string, index = 0) => {
  const group = screen.getAllByRole('rowgroup', { name: label })[index];
  if (!group) throw new Error(`No section ${label}`);
  return within(group)
    .getAllByRole('row')
    .map((row) => row.getAttribute('aria-label') ?? row.textContent);
};

describe('Tree category sections', () => {
  it('UIC-TREE-8.1 groups top-level items under named heading rows in first-item order', () => {
    const { container } = render(<SectionTree defaultExpandedKeys={['roadmap']} />);
    const tree = screen.getByRole('treegrid', { name: 'Library' });
    expect(tree).toHaveAttribute('data-sectioned', 'true');
    expect(sectionRows('Plans')).toEqual(['Plans', 'Roadmap', 'Milestones', 'Budget']);
    expect(sectionRows('Notes', 0)).toEqual(['Notes', 'Minutes']);
    // Same label, distinct section.
    expect(sectionRows('Notes', 1)).toEqual(['Notes', 'Drafts']);
    expect(sectionNames()).toHaveLength(3);
    expect(screen.getByRole('row', { name: 'Roadmap' })).toHaveAttribute('aria-level', '1');
    expect(screen.getByRole('row', { name: 'Milestones' })).toHaveAttribute('aria-level', '2');
    const heading = screen.getByRole('rowheader', { name: 'Plans' }).closest('[role="row"]');
    expect(heading).toHaveClass('ui-tree__section-header');
    expect(heading).not.toHaveAttribute('aria-level');
    expect(heading).not.toHaveAttribute('aria-selected');
    expectHooksMatchSpec(container, 'TREE', {
      slots: ['section', 'section-header', 'item', 'expand', 'expand-spacer', 'label'],
    });
  });

  it('UIC-TREE-8.1 shows items without a section first, outside any section', () => {
    const loose = [{ id: 'inbox', name: 'Inbox' }, ...ENTRIES];
    render(<SectionTree items={loose} />);
    const rows = screen.getAllByRole('row');
    expect(rows[0]).toHaveAccessibleName('Inbox');
    expect(rows[0]?.closest('[role="rowgroup"]')).toBeNull();
  });

  it('UIC-TREE-8.1 moves across sections by arrows, Home, End and typeahead past the headings', async () => {
    const user = userEvent.setup();
    render(<SectionTree />);
    await user.tab();
    expect(focusedName()).toBe('Roadmap');
    await user.keyboard('{ArrowDown}');
    expect(focusedName()).toBe('Budget');
    await user.keyboard('{ArrowDown}');
    expect(focusedName()).toBe('Minutes');
    await user.keyboard('{ArrowUp}');
    expect(focusedName()).toBe('Budget');
    await user.keyboard('{End}');
    expect(focusedName()).toBe('Drafts');
    await user.keyboard('{Home}');
    expect(focusedName()).toBe('Roadmap');
    await user.keyboard('d');
    expect(focusedName()).toBe('Drafts');
  });

  it('UIC-TREE-8.1 never selects or activates a heading, and selecting all reaches every section', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onAction = vi.fn();
    render(
      <SectionTree
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        onAction={onAction}
      />,
    );
    await user.click(screen.getByRole('rowheader', { name: 'Plans' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    await user.click(screen.getByRole('row', { name: 'Minutes' }));
    await user.keyboard('{Control>}a{/Control}');
    const keys = onSelectionChange.mock.lastCall?.[0] as Set<string> | 'all';
    const selected = screen
      .getAllByRole('row')
      .filter((row) => row.getAttribute('aria-selected') === 'true')
      .map((row) => row.getAttribute('aria-label'));
    expect(keys === 'all' || keys.size === 4).toBe(true);
    expect(selected).toEqual(['Roadmap', 'Budget', 'Minutes', 'Drafts']);
  });

  it('UIC-TREE-8.1 drops sections whose items the filter hides, and shows the empty notice', () => {
    const { rerender } = render(<SectionTree filterText="mile" emptyMessage="No matches" />);
    expect(sectionRows('Plans')).toEqual(['Plans', 'Roadmap', 'Milestones']);
    expect(screen.queryByRole('rowgroup', { name: 'Notes' })).not.toBeInTheDocument();
    rerender(<SectionTree filterText="zzz" emptyMessage="No matches" />);
    expect(screen.queryAllByRole('rowgroup')).toEqual([]);
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('UIC-TREE-8.1 keeps the current and disabled rows, and ignores reorder', () => {
    const onMove = vi.fn();
    render(<SectionTree currentKey="minutes" disabledKeys={['budget']} reorder={{ onMove }} />);
    expect(screen.getByRole('row', { name: 'Minutes' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('row', { name: 'Budget' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('treegrid')).not.toHaveAttribute('data-reordering');
    expect(document.querySelector('.ui-tree__drag-handle')).toBeNull();
  });
});
