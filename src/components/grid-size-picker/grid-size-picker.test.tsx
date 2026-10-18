import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { GridSizePicker } from './grid-size-picker.js';

function cell(rows: number, columns: number) {
  const name = `${rows === 1 ? '1 row' : `${rows} rows`} by ${columns === 1 ? '1 column' : `${columns} columns`}`;
  return screen.getByRole('gridcell', { name });
}

function readout(container: HTMLElement) {
  return container.querySelector('.ui-grid-size-picker__readout');
}

describe('GridSizePicker', () => {
  it('UIC-GRID-SIZE-PICKER-1.1 UIC-GRID-SIZE-PICKER-2.4 renders a named grid of rows and cells with a readout', () => {
    const { container } = render(
      <GridSizePicker onSelect={() => {}} className="host" data-testid="picker" id="sizes" />,
    );
    const root = container.querySelector('.ui-grid-size-picker');
    expect(root).toHaveClass('host');
    expect(root).toHaveAttribute('data-testid', 'picker');
    expect(root).toHaveAttribute('id', 'sizes');
    const grid = screen.getByRole('grid', { name: 'Table size' });
    expect(within(grid).getAllByRole('row')).toHaveLength(5);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(25);
    expect(readout(container)).toHaveTextContent('1 × 1');
    expect(readout(container)).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'GRID-SIZE-PICKER', {
      slots: 'all',
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-GRID-SIZE-PICKER-1.1 takes a label of its own', () => {
    render(
      <>
        <span id="heading">Insert grid</span>
        <GridSizePicker onSelect={() => {}} aria-labelledby="heading" aria-describedby="heading" />
      </>,
    );
    const grid = screen.getByRole('grid', { name: 'Insert grid' });
    expect(grid).not.toHaveAttribute('aria-label');
    expect(grid).toHaveAttribute('aria-describedby', 'heading');
  });

  it('UIC-GRID-SIZE-PICKER-1.2 previews the hovered cell and the cells within it', async () => {
    const user = userEvent.setup();
    const { container } = render(<GridSizePicker onSelect={() => {}} />);
    expect(cell(1, 1)).toHaveAttribute('data-active', 'true');
    expect(cell(1, 1)).toHaveAttribute('tabindex', '0');
    await user.hover(cell(3, 4));
    expect(readout(container)).toHaveTextContent('3 × 4');
    expect(cell(3, 4)).toHaveAttribute('data-active', 'true');
    expect(cell(3, 4)).toHaveAttribute('tabindex', '0');
    expect(cell(1, 1)).toHaveAttribute('tabindex', '-1');
    expect(cell(2, 2)).toHaveAttribute('data-in-range', 'true');
    expect(cell(3, 4)).toHaveAttribute('data-in-range', 'true');
    expect(cell(4, 4)).not.toHaveAttribute('data-in-range');
    expect(cell(3, 5)).not.toHaveAttribute('data-in-range');
    await user.unhover(cell(3, 4));
    expect(readout(container)).toHaveTextContent('3 × 4');
  });

  it('UIC-GRID-SIZE-PICKER-1.3 grows one row and column past the preview, up to the maximum', async () => {
    const user = userEvent.setup();
    render(
      <GridSizePicker onSelect={() => {}} minRows={3} minColumns={2} maxRows={6} maxColumns={4} />,
    );
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('gridcell')).toHaveLength(6);
    await user.hover(cell(3, 2));
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getAllByRole('gridcell')).toHaveLength(12);
    await user.hover(cell(4, 3));
    await user.hover(cell(5, 4));
    await user.hover(cell(6, 4));
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getAllByRole('gridcell')).toHaveLength(24);
  });

  it('UIC-GRID-SIZE-PICKER-1.3 shows a fixed grid when the minimums meet the maximums', async () => {
    const user = userEvent.setup();
    render(
      <GridSizePicker onSelect={() => {}} minRows={4} minColumns={4} maxRows={4} maxColumns={4} />,
    );
    await user.hover(cell(4, 4));
    expect(screen.getAllByRole('gridcell')).toHaveLength(16);
  });

  it('UIC-GRID-SIZE-PICKER-1.4 chooses the clicked cell, or the preview with Enter and Space', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GridSizePicker onSelect={onSelect} />);
    await user.click(cell(2, 3));
    expect(onSelect).toHaveBeenLastCalledWith({ rows: 2, columns: 3 });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith({ rows: 3, columns: 3 });
    await user.keyboard('{ArrowRight} ');
    expect(onSelect).toHaveBeenLastCalledWith({ rows: 3, columns: 4 });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('UIC-GRID-SIZE-PICKER-2.1 moves the preview and focus with the keyboard and keeps the keys', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    const { container } = render(
      <div onKeyDown={outer}>
        <GridSizePicker onSelect={() => {}} maxRows={8} maxColumns={7} />
      </div>,
    );
    await user.tab();
    expect(cell(1, 1)).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    expect(cell(2, 3)).toHaveFocus();
    expect(readout(container)).toHaveTextContent('2 × 3');
    await user.keyboard('{End}');
    expect(cell(2, 7)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cell(2, 1)).toHaveFocus();
    await user.keyboard('{Control>}{End}{/Control}');
    expect(cell(8, 7)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(cell(8, 7)).toHaveFocus();
    await user.keyboard('{Meta>}{Home}{/Meta}');
    expect(cell(1, 1)).toHaveFocus();
    await user.keyboard('{Escape}');
    const keys = outer.mock.calls.map(([event]) => (event as { key: string }).key);
    expect(keys).toEqual(['Control', 'Meta', 'Escape']);
  });

  it('UIC-GRID-SIZE-PICKER-2.1 mirrors left and right in a right-to-left locale', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="ar">
        <GridSizePicker onSelect={() => {}} />
      </UiProvider>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(cell(1, 3)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(cell(1, 2)).toHaveFocus();
  });

  it('UIC-GRID-SIZE-PICKER-2.2 ignores hovering, clicks and keys while disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(<GridSizePicker onSelect={onSelect} isDisabled />);
    expect(container.querySelector('.ui-grid-size-picker')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    expect(screen.getByRole('grid')).toHaveAttribute('aria-disabled', 'true');
    expect(cell(1, 1)).toHaveAttribute('tabindex', '-1');
    await user.hover(cell(2, 2));
    await user.click(cell(2, 2));
    expect(readout(container)).toHaveTextContent('1 × 1');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(readout(container)).toHaveTextContent('1 × 1');
    expect(onSelect).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'GRID-SIZE-PICKER');
  });

  it('UIC-GRID-SIZE-PICKER-2.3 focuses the previewed cell on mount with autoFocus', () => {
    render(<GridSizePicker onSelect={() => {}} autoFocus />);
    expect(cell(1, 1)).toHaveFocus();
  });
});
