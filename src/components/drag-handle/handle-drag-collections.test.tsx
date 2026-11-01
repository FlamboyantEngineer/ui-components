import { render, screen } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Board } from '../board/board.js';
import { ListView, ListViewItem } from '../list-row/list-view.js';
import { TextField } from '../text-field/text-field.js';
import { Tree } from '../tree/tree.js';

interface Note {
  id: string;
  title: string;
}

const notes: Note[] = [
  { id: 'wash', title: 'Wash' },
  { id: 'peel', title: 'Peel' },
];

const noteField = (note: Note) => (
  <TextField label={`Note for ${note.title}`} defaultValue="draft" />
);

function press(user: UserEvent, target: Element, x: number) {
  return user.pointer({ keys: '[MouseLeft>]', target, coords: { clientX: x, clientY: 10 } });
}

function release(user: UserEvent) {
  return user.pointer({ keys: '[/MouseLeft]' });
}

/** Places the row's handle at the left edge, as React Aria keeps it out of pointer hit testing. */
function placeHandle(row: HTMLElement) {
  const handle = row.querySelector('.ui-drag-handle');
  if (!handle) throw new Error('The row has no drag handle.');
  vi.spyOn(handle, 'getBoundingClientRect').mockReturnValue({
    ...{ left: 0, right: 20, top: 0, bottom: 20, width: 20, height: 20, x: 0, y: 0 },
  } as DOMRect);
}

const surfaces: Record<string, (handle: boolean) => ReactNode> = {
  Board: (handle) => (
    <Board
      aria-label="Chores"
      columns={[{ id: 'open', title: 'Open' }]}
      items={notes}
      getColumn={() => 'open'}
      getTextValue={(note) => note.title}
      renderCard={noteField}
      onMove={() => {}}
      dragTrigger={handle ? 'handle' : undefined}
    />
  ),
  ListView: (handle) => (
    <ListView
      aria-label="Chores"
      items={notes}
      reorder={{ onMove: () => {}, dragTrigger: handle ? 'handle' : undefined }}
    >
      {(note) => <ListViewItem id={note.id} title={note.title} trailing={noteField(note)} />}
    </ListView>
  ),
  Tree: (handle) => (
    <Tree<Note>
      aria-label="Chores"
      items={notes}
      getTextValue={(note) => note.title}
      renderActions={noteField}
      reorder={{ onMove: () => {}, dragTrigger: handle ? 'handle' : undefined }}
    />
  ),
};

const rowOf = (field: HTMLElement) => field.closest<HTMLElement>('[role="row"]') as HTMLElement;

describe('handle-only drags', () => {
  it.each(Object.keys(surfaces))(
    'UIC-BOARD-2.2 UIC-LIST-ROW-3.5 UIC-TREE-REORDER-1.1 drags a %s row by its handle only',
    async (name) => {
      const user = userEvent.setup();
      render(<>{surfaces[name]?.(true)}</>);
      const field = screen.getByRole('textbox', { name: 'Note for Wash' });
      const row = rowOf(field);
      expect(row).not.toHaveAttribute('draggable');
      placeHandle(row);
      await press(user, field, 60);
      expect(row).not.toHaveAttribute('draggable');
      await release(user);
      await press(user, row, 10);
      expect(row).toHaveAttribute('draggable', 'true');
      await release(user);
      expect(row).not.toHaveAttribute('draggable');
    },
  );

  it.each(Object.keys(surfaces))(
    'UIC-BOARD-2.2 UIC-LIST-ROW-3.5 UIC-TREE-REORDER-1.1 keeps a %s row draggable from anywhere by default',
    (name) => {
      render(<>{surfaces[name]?.(false)}</>);
      const row = rowOf(screen.getByRole('textbox', { name: 'Note for Wash' }));
      expect(row).toHaveAttribute('draggable', 'true');
    },
  );

  it('UIC-TREE-REORDER-1.2 never drags a tree row while its name field is open', async () => {
    const user = userEvent.setup();
    render(
      <Tree<Note>
        aria-label="Chores"
        items={notes}
        getTextValue={(note) => note.title}
        onRename={() => {}}
        reorder={{ onMove: () => {} }}
      />,
    );
    const row = screen.getByRole('row', { name: 'Wash' });
    expect(row).toHaveAttribute('draggable', 'true');
    await user.click(row);
    await user.keyboard('{F2}');
    expect(screen.getByRole('textbox', { name: 'Rename Wash' })).toHaveFocus();
    expect(row).not.toHaveAttribute('draggable');
    expect(row.querySelector('.ui-drag-handle')).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(row).toHaveAttribute('draggable', 'true');
  });
});
