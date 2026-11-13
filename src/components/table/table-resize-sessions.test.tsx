import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { Table, type TableProps } from './table.js';

interface Letter {
  id: string;
  a: string;
  b: string;
}

const letters: Letter[] = [
  { id: 'alpha', a: 'Alpha', b: 'Blue' },
  { id: 'gamma', a: 'Gamma', b: 'Delta' },
];

function Letters({
  storage,
  allowsResizing = true,
  ...props
}: Partial<TableProps<Letter>> & { storage: UiStorage; allowsResizing?: boolean }) {
  return (
    <UiProvider storage={storage}>
      <Table
        aria-label="Letters"
        rows={letters}
        columns={[
          { id: 'a', header: 'A', width: 140, allowsResizing },
          { id: 'b', header: 'B' },
        ]}
        {...props}
      />
    </UiProvider>
  );
}

const tracks = () => screen.getByRole('grid').style.getPropertyValue('--ui-table-columns');
const resizer = () => document.querySelector<HTMLElement>('.ui-table__resizer');

function seeded() {
  const storage = createMemoryStorage();
  storage.setItem('first', '{"a":140}');
  storage.setItem('second', '{"a":220}');
  return storage;
}

/** Records pointer capture on the resizer, which jsdom does not implement. */
function capturing(element: HTMLElement) {
  const capture = { id: null as number | null };
  Object.assign(element, {
    setPointerCapture: (id: number) => {
      capture.id = id;
    },
    hasPointerCapture: (id: number) => capture.id === id,
    releasePointerCapture: (id: number) => {
      if (capture.id === id) capture.id = null;
    },
  });
  return capture;
}

const pointer = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', clientX: number) => {
  const target = resizer();
  if (!target) throw new Error('The column must have a resizer');
  fireEvent[type](target, { pointerId: 3, button: 0, isPrimary: true, clientX });
};

/** Reaches the resizer from its header, as a keyboard reader does, and starts a resize. */
async function startKeyboardResize(user: ReturnType<typeof userEvent.setup>) {
  screen.getByRole('columnheader', { name: /^A/ }).focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('slider', { name: /^Resize A/ })).toHaveFocus();
  await user.keyboard('{Enter}{ArrowRight}');
}

// Full React Aria tables are slow in jsdom on a busy machine.
describe('Table resize sessions', { timeout: 15_000 }, () => {
  it('UIC-TABLE-4.2 cancels a drag when the widths change owner, keeping neither store', () => {
    const storage = seeded();
    const onColumnWidthsChange = vi.fn();
    const view = render(
      <Letters storage={storage} persistKey="first" onColumnWidthsChange={onColumnWidthsChange} />,
    );
    const capture = capturing(resizer() as HTMLElement);
    pointer('pointerDown', 100);
    pointer('pointerMove', 150);
    expect(tracks()).toBe('190px minmax(75px, 1fr)');
    expect(capture.id).toBe(3);
    view.rerender(
      <Letters storage={storage} persistKey="second" onColumnWidthsChange={onColumnWidthsChange} />,
    );
    expect(tracks()).toBe('220px minmax(75px, 1fr)');
    expect(capture.id).toBeNull();
    pointer('pointerMove', 180);
    pointer('pointerUp', 180);
    expect(tracks()).toBe('220px minmax(75px, 1fr)');
    expect(storage.getItem('first')).toBe('{"a":140}');
    expect(storage.getItem('second')).toBe('{"a":220}');
    expect(onColumnWidthsChange).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-4.2 cancels a keyboard resize when the storage adapter changes', async () => {
    const user = userEvent.setup();
    const storage = seeded();
    const other = createMemoryStorage();
    const view = render(<Letters storage={storage} persistKey="first" />);
    await startKeyboardResize(user);
    expect(tracks()).toBe('150px minmax(75px, 1fr)');
    view.rerender(<Letters storage={other} persistKey="first" />);
    expect(tracks()).toBe('140px minmax(75px, 1fr)');
    await user.keyboard('{ArrowRight}{Enter}');
    expect(storage.getItem('first')).toBe('{"a":140}');
  });

  it('UIC-TABLE-4.2 gives the grid its arrow keys back when a resizing column stops resizing', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const onColumnWidthsChange = vi.fn();
    const view = render(<Letters storage={storage} onColumnWidthsChange={onColumnWidthsChange} />);
    await startKeyboardResize(user);
    expect(tracks()).toBe('150px minmax(75px, 1fr)');
    view.rerender(
      <Letters
        storage={storage}
        allowsResizing={false}
        onColumnWidthsChange={onColumnWidthsChange}
      />,
    );
    expect(tracks()).toBe('140px minmax(75px, 1fr)');
    screen.getByRole('rowheader', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('rowheader', { name: 'Gamma' })).toHaveFocus();
    expect(onColumnWidthsChange).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-4.2 drops a drag when the table becomes virtualized', () => {
    const storage = seeded();
    const view = render(<Letters storage={storage} persistKey="first" />);
    capturing(resizer() as HTMLElement);
    pointer('pointerDown', 100);
    pointer('pointerMove', 150);
    view.rerender(<Letters storage={storage} persistKey="first" virtualized />);
    view.rerender(<Letters storage={storage} persistKey="first" />);
    expect(tracks()).toBe('140px minmax(75px, 1fr)');
    expect(storage.getItem('first')).toBe('{"a":140}');
  });

  it('UIC-TABLE-4.2 keeps one report for a completed drag', () => {
    const storage = seeded();
    const onColumnWidthsChange = vi.fn();
    render(
      <Letters storage={storage} persistKey="first" onColumnWidthsChange={onColumnWidthsChange} />,
    );
    capturing(resizer() as HTMLElement);
    pointer('pointerDown', 100);
    pointer('pointerMove', 150);
    pointer('pointerUp', 150);
    expect(tracks()).toBe('190px minmax(75px, 1fr)');
    expect(onColumnWidthsChange).toHaveBeenCalledTimes(1);
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ a: 190, b: '1fr' });
    // Only the width the reader set is stored; the other column keeps following its declared width.
    expect(JSON.parse(storage.getItem('first') ?? '{}')).toEqual({ a: 190 });
  });
});
