import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { GridList, GridListItem, useDragAndDrop } from 'react-aria-components';
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
      <div role="row" data-testid="apple">
        <div role="gridcell" tabIndex={-1} data-testid="apple-cell">
          <DragHandle aria-label="Drag Apple" />
          Apple
        </div>
        <div role="gridcell" tabIndex={-1} data-testid="apple-colour">
          Red
        </div>
        <div role="row" data-testid="seed">
          <span>Seed</span>
        </div>
      </div>
      <div role="row" data-testid="fig">
        <DragHandle aria-label="Drag Fig" isDisabled />
        Fig
      </div>
    </div>
  );
}

/** A primary or other press at a position, which jsdom's plain events do not carry. */
function press(target: Element, { x, button = 0 }: { x: number; button?: number }) {
  const event = createEvent.pointerDown(target);
  Object.defineProperties(event, {
    clientX: { value: x },
    clientY: { value: 5 },
    button: { value: button },
  });
  fireEvent(target, event);
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

  it('UIC-DRAG-HANDLE-2.1 makes a row draggable only while its own enabled handle is pressed', () => {
    render(<HandleRows />);
    placeHandles();
    const apple = screen.getByTestId('apple');
    press(apple, { x: 60 });
    expect(apple).not.toHaveAttribute('draggable');
    press(apple, { x: 10, button: 2 });
    expect(apple).not.toHaveAttribute('draggable');
    press(apple, { x: 10 });
    expect(apple).toHaveAttribute('draggable', 'true');
    fireEvent.pointerUp(document);
    expect(apple).not.toHaveAttribute('draggable');
    press(apple, { x: 10 });
    apple.dispatchEvent(new Event('dragend'));
    expect(apple).not.toHaveAttribute('draggable');
    press(screen.getByText('Seed'), { x: 10 });
    expect(screen.getByTestId('seed')).not.toHaveAttribute('draggable');
    expect(apple).not.toHaveAttribute('draggable');
    press(screen.getByTestId('fig'), { x: 10 });
    expect(screen.getByTestId('fig')).not.toHaveAttribute('draggable');
  });

  it('UIC-DRAG-HANDLE-2.2 keeps a press in the handle cell from focusing it until the next frame', async () => {
    const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const { unmount } = render(<HandleRows isHandleOnly={false} />);
    const cell = screen.getByTestId('apple-cell');
    press(screen.getByText('Apple'), { x: 60 });
    expect(cell).not.toHaveAttribute('tabindex');
    press(screen.getByTestId('apple-colour'), { x: 200 });
    expect(screen.getByTestId('apple-colour')).toHaveAttribute('tabindex', '-1');
    await nextFrame();
    expect(cell).toHaveAttribute('tabindex', '-1');
    unmount();
    render(<HandleRows />);
    placeHandles();
    press(screen.getByTestId('apple-cell'), { x: 10 });
    expect(screen.getByTestId('apple-cell')).not.toHaveAttribute('tabindex');
    await nextFrame();
    expect(screen.getByTestId('apple-cell')).toHaveAttribute('tabindex', '-1');
  });
});
