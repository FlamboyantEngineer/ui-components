import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { Timeline, type TimelineItem } from './timeline.js';
import { TimelineItemEditor } from './timeline-item-editor.js';

const items: TimelineItem[] = [
  {
    id: 'measure',
    rowId: 'survey',
    label: 'Measure rooms',
    start: '2026-03-02',
    end: '2026-03-06',
    progress: 0.4,
  },
  {
    id: 'walls',
    rowId: 'survey',
    label: 'Paint walls',
    start: '2026-03-10',
    end: '2026-03-20',
    isReadOnly: true,
  },
  { id: 'done', rowId: 'survey', label: 'Handover', start: '2026-03-27', kind: 'milestone' },
];

const measure = items[0] as TimelineItem;

describe('Timeline item menu', () => {
  it('UIC-TIMELINE-2.5 opens an item menu from the keyboard and reports the entry with the item', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <UiProvider locale="en-US">
        <Timeline
          aria-label="Plan"
          rows={[{ id: 'survey', label: 'Survey' }]}
          items={items}
          range={{ start: '2026-03-01', end: '2026-03-31' }}
          itemMenu={(item) =>
            item.isReadOnly
              ? []
              : [
                  { id: 'edit', label: 'Edit' },
                  { id: 'remove', label: 'Remove' },
                ]
          }
          onItemMenuAction={onAction}
        />
      </UiProvider>,
    );
    const item = screen.getByRole('button', { name: 'Measure rooms' });
    item.focus();
    await user.keyboard('{Shift>}{F10}{/Shift}');
    const menu = await screen.findByRole('menu', { name: 'Measure rooms actions' });
    await user.click(within(menu).getByRole('menuitem', { name: 'Edit' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith('edit', measure);
    // An item without entries keeps the browser's menu.
    const fixed = screen.getByRole('button', { name: 'Paint walls' });
    expect(fireEvent.contextMenu(fixed)).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('TimelineItemEditor', () => {
  it('UIC-TIMELINE-2.6 saves a valid edit once and closes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<TimelineItemEditor item={measure} onSave={onSave} onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: 'Edit Measure rooms' });
    const name = within(dialog).getByRole('textbox', { name: 'Name' });
    expect(name).toHaveValue('Measure rooms');
    expect(within(dialog).getByRole('textbox', { name: 'Progress' })).toHaveValue('40%');
    await user.clear(name);
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await user.type(name, 'Measure kitchen');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      id: 'measure',
      label: 'Measure kitchen',
      start: '2026-03-02',
      end: '2026-03-06',
      progress: 0.4,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('UIC-TIMELINE-2.6 leaves the item as it was on Cancel', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<TimelineItemEditor item={measure} onSave={onSave} onClose={onClose} />);
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' twice');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('UIC-TIMELINE-2.6 shows a milestone by its day and a read-only item without Save', () => {
    const { rerender } = render(
      <TimelineItemEditor item={items[2] ?? null} onSave={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByRole('group', { name: 'Day' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Progress' })).not.toBeInTheDocument();
    rerender(<TimelineItemEditor item={items[1] ?? null} onSave={() => {}} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: 'Paint walls' });
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveAttribute('readonly');
    expect(within(dialog).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});

describe('TimelineItemEditor drafts', () => {
  it('UIC-TIMELINE-2.6 starts a new draft for another item and saves it under that id', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { rerender } = render(
      <TimelineItemEditor item={measure} onSave={onSave} onClose={() => {}} />,
    );
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' first');
    const other = { ...measure, id: 'other', label: 'Order tiles' };
    rerender(<TimelineItemEditor item={other} onSave={onSave} onClose={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Order tiles');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'other', label: 'Order tiles' }),
    );
  });
});

const ana = { id: 'ana', name: 'Ana Lima' };
const leo = { id: 'leo', name: 'Leo Park' };

describe('Timeline assignees and links', () => {
  it('UIC-TIMELINE-1.12 names an item’s assignees and links its name in the table', () => {
    const assigned: TimelineItem[] = [
      { ...measure, assignees: [ana, leo], href: '/tasks/measure' },
      { id: 'tile', rowId: 'survey', label: 'Order tiles', start: '2026-03-09', end: '2026-03-10' },
    ];
    const props = {
      'aria-label': 'Plan',
      rows: [{ id: 'survey', label: 'Survey' }],
      items: assigned,
      range: { start: '2026-03-01', end: '2026-03-31' },
    };
    const { container, rerender } = render(
      <UiProvider locale="en-US">
        <Timeline {...props} />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Measure rooms' })).toHaveAccessibleDescription(
      /Assigned to Ana Lima and Leo Park/,
    );
    expect(screen.getByRole('button', { name: 'Order tiles' })).not.toHaveAccessibleDescription(
      /Assigned/,
    );
    expect(container.querySelectorAll('.ui-timeline__assignees')).toHaveLength(1);
    rerender(
      <UiProvider locale="en-US">
        <Timeline {...props} view="table" />
      </UiProvider>,
    );
    expect(screen.getByRole('columnheader', { name: /Assignees/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Measure rooms' })).toHaveAttribute(
      'href',
      '/tasks/measure',
    );
    expect(screen.getByRole('row', { name: /Order tiles/ })).toHaveTextContent('Unassigned');
  });

  it('UIC-TIMELINE-1.12 UIC-TIMELINE-2.6 links the item and saves its chosen assignees', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <TimelineItemEditor
        item={{ ...measure, assignees: [ana], href: '/tasks/measure' }}
        assignablePeople={[ana, leo]}
        onSave={onSave}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('link', { name: 'Open Measure rooms' })).toHaveAttribute(
      'href',
      '/tasks/measure',
    );
    await user.click(screen.getByRole('button', { name: /Remove Ana Lima/ }));
    const picker = screen.getByRole('combobox', { name: 'Assignees' });
    await user.type(picker, 'Leo');
    await user.click(await screen.findByRole('option', { name: /Leo Park/ }));
    // Escape closes the open list first, then Save submits.
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ assignees: [leo] }));
  });
});
