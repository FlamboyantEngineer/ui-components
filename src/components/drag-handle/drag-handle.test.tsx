import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { GridList, GridListItem, useDragAndDrop } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { DragHandle } from './drag-handle.js';

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
});
