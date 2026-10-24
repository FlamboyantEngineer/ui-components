import { act, render, screen } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { GridList, GridListItem, useDragAndDrop } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { armHandleDrag, DragHandle, keepHandleCellDraggable } from './drag-handle.js';

const FRUIT = [
  { id: 'apple', name: 'Apple' },
  { id: 'pear', name: 'Pear' },
  { id: 'fig', name: 'Fig' },
];

function FruitList() {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: () => {},
  });
  return (
    <GridList aria-label="Fruit" items={FRUIT} dragAndDropHooks={dragAndDropHooks}>
      {(item) => (
        <GridListItem textValue={item.name}>
          <DragHandle isDisabled={item.id === 'fig'} />
          {item.name}
        </GridListItem>
      )}
    </GridList>
  );
}

/** Rows that render without `draggable`, so only their handles start pointer drags. */
function HandleRows({ isHandleOnly = true }: { isHandleOnly?: boolean }) {
  return (
    <div onPointerDownCapture={isHandleOnly ? armHandleDrag : keepHandleCellDraggable}>
      <div role="row" aria-label="Apple row">
        <div role="gridcell" tabIndex={-1} aria-label="Apple cell">
          <DragHandle aria-label="Drag Apple" />
          Apple
        </div>
        <div role="gridcell" tabIndex={-1} aria-label="Colour cell">
          Red
        </div>
        <div role="row" aria-label="Seed row">
          <span>Seed</span>
        </div>
      </div>
      <div role="row" aria-label="Fig row">
        <DragHandle aria-label="Drag Fig" isDisabled />
        Fig
      </div>
    </div>
  );
}

/** Holds a primary or secondary press at a position, letting go of any earlier press first. */
async function press(
  user: UserEvent,
  target: Element,
  { x, button = 'MouseLeft' }: { x: number; button?: 'MouseLeft' | 'MouseRight' },
) {
  await user.pointer([{ keys: '[/MouseLeft]' }, { keys: '[/MouseRight]' }]);
  await user.pointer({ keys: `[${button}>]`, target, coords: { clientX: x, clientY: 5 } });
}

function row(name: string) {
  return screen.getByRole('row', { name: `${name} row` });
}

function cell(name: string) {
  return screen.getByRole('gridcell', { name: `${name} cell` });
}

function placeHandles() {
  for (const handle of document.querySelectorAll('.ui-drag-handle')) {
    vi.spyOn(handle, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 20,
      top: 0,
      bottom: 20,
      width: 20,
      height: 20,
      x: 0,
      y: 0,
    } as DOMRect);
  }
}

// Keyboard drag and drop in a full React Aria collection is slow in jsdom on a busy machine.
describe('DragHandle', { timeout: 15_000 }, () => {
  it('UIC-DRAG-HANDLE-1.1 is the row drag button, named by the collection, that starts a keyboard drag', async () => {
    const user = userEvent.setup();
    const { container } = render(<FruitList />);
    const handle = screen.getByRole('button', { name: 'Drag Apple' });
    expect(handle.querySelector('.ui-icon')).toHaveAttribute('data-glyph', 'drag-handle');
    expect(handle.querySelector('.ui-icon')).toHaveAttribute('aria-hidden', 'true');
    screen.getByRole('row', { name: 'Apple' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(handle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveAttribute('data-dragging', 'true');
    await user.keyboard('{Escape}');
    expectHooksMatchSpec(container, 'DRAG-HANDLE');
  });

  it('UIC-DRAG-HANDLE-1.2 stays out of the tab sequence unless asked', () => {
    render(
      <>
        <DragHandle aria-label="Drag Apple" />
        <DragHandle aria-label="Drag Pear" excludeFromTabOrder={false} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Drag Apple' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Drag Pear' })).toHaveAttribute('tabindex', '0');
  });

  it('UIC-DRAG-HANDLE-1.2 keeps the default for an explicitly undefined excludeFromTabOrder', () => {
    render(<DragHandle aria-label="Drag Apple" excludeFromTabOrder={undefined} />);
    expect(screen.getByRole('button', { name: 'Drag Apple' })).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-DRAG-HANDLE-1.3 disables the handle of a row that cannot move', () => {
    const { container } = render(<FruitList />);
    const handle = screen.getByRole('button', { name: 'Drag Fig' });
    expect(handle).toBeDisabled();
    expect(handle).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Drag Pear' })).toBeEnabled();
    expectHooksMatchSpec(container, 'DRAG-HANDLE');
  });

  it('UIC-DRAG-HANDLE-1.4 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <DragHandle aria-label="Drag" className="caller" id="handle" data-row="apple" />,
    );
    const handle = screen.getByRole('button', { name: 'Drag' });
    expect(handle).toHaveClass('ui-drag-handle', 'caller');
    expect(handle).toHaveAttribute('id', 'handle');
    expect(handle).toHaveAttribute('data-row', 'apple');
    expectHooksMatchSpec(container, 'DRAG-HANDLE', { callerAttributes: ['data-row'] });
  });

  it('UIC-DRAG-HANDLE-2.1 makes a row draggable only while its own enabled handle is pressed', async () => {
    const user = userEvent.setup();
    render(<HandleRows />);
    placeHandles();
    const apple = row('Apple');
    await press(user, apple, { x: 60 });
    expect(apple).not.toHaveAttribute('draggable');
    await press(user, apple, { x: 10, button: 'MouseRight' });
    expect(apple).not.toHaveAttribute('draggable');
    await press(user, apple, { x: 10 });
    expect(apple).toHaveAttribute('draggable', 'true');
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(apple).not.toHaveAttribute('draggable');
    await press(user, apple, { x: 10 });
    apple.dispatchEvent(new Event('dragend'));
    expect(apple).not.toHaveAttribute('draggable');
    await press(user, screen.getByText('Seed'), { x: 10 });
    expect(row('Seed')).not.toHaveAttribute('draggable');
    expect(apple).not.toHaveAttribute('draggable');
    await press(user, row('Fig'), { x: 10 });
    expect(row('Fig')).not.toHaveAttribute('draggable');
  });

  it('UIC-DRAG-HANDLE-2.2 keeps a press in the handle cell from focusing it until the next frame', async () => {
    vi.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const nextFrame = () => act(() => vi.advanceTimersToNextFrame());
      const { unmount } = render(<HandleRows isHandleOnly={false} />);
      const appleCell = cell('Apple');
      await press(user, screen.getByText('Apple'), { x: 60 });
      expect(appleCell).not.toHaveAttribute('tabindex');
      await press(user, cell('Colour'), { x: 200 });
      expect(cell('Colour')).toHaveAttribute('tabindex', '-1');
      nextFrame();
      expect(appleCell).toHaveAttribute('tabindex', '-1');
      unmount();
      render(<HandleRows />);
      placeHandles();
      await press(user, cell('Apple'), { x: 10 });
      expect(cell('Apple')).not.toHaveAttribute('tabindex');
      nextFrame();
      expect(cell('Apple')).toHaveAttribute('tabindex', '-1');
    } finally {
      vi.useRealTimers();
    }
  });
});
