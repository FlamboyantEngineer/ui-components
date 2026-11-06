import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './table.js';

interface Bed {
  id: string;
  name: string;
}

const beds: Bed[] = ['Bed 1', 'Bed 2', 'Bed 3'].map((name) => ({
  id: name.toLowerCase().replace(' ', '-'),
  name,
}));

const columns = [{ id: 'name', header: 'Name' }];

/** The rows drawn at these tops, as a row stuck at the bottom of a scrolled area is drawn. */
function drawRows(table: string, tops: number[]) {
  const rows = screen
    .getByRole('grid', { name: table })
    .querySelectorAll<HTMLElement>('tbody [role="row"]');
  let reads = 0;
  rows.forEach((row, index) => {
    vi.spyOn(row, 'getBoundingClientRect').mockImplementation(() => {
      // A delegate that steps back and forth reads positions forever; fail instead of hanging.
      reads += 1;
      if (reads > 1000) throw new Error('Keyboard drop navigation does not end');
      const top = tops[index] ?? 0;
      return {
        top,
        bottom: top + 20,
        left: 0,
        right: 200,
        width: 200,
        height: 20,
        x: 0,
        y: top,
      } as DOMRect;
    });
  });
}

describe('Ordered keyboard drop targets', { timeout: 15_000 }, () => {
  it('UIC-TABLE-5.1 steps through rows in order when a stuck row is drawn above the one before it', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(
      <>
        <Table aria-label="Beds" rows={beds} columns={columns} />
        <Table aria-label="Moves" rows={beds} columns={columns} reorder={{ onMove }} />
      </>,
    );
    drawRows('Beds', [0, 200, 100]);
    drawRows('Moves', [0, 200, 100]);
    const moves = screen.getByRole('grid', { name: 'Moves' });
    screen.getAllByRole('row', { name: 'Bed 1' })[1]?.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Drag Bed 1' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(moves.querySelectorAll('.ui-table__drop-indicator').length).toBeGreaterThan(0);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.lastCall?.[0]).toMatchObject({ keys: ['bed-1'], targetKey: 'bed-3' });
  });
});
