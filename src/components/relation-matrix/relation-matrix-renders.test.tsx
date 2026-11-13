import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { GlyphComponent } from '../../core/glyph-types.js';
import { RelationMatrix } from './relation-matrix.js';

const size = 20;
const rows = Array.from({ length: size }, (_, index) => ({
  id: `r${index}`,
  label: `Row ${index}`,
}));
const columns = Array.from({ length: size }, (_, index) => ({
  id: `c${index}`,
  label: `Column ${index}`,
}));
const relations = rows.flatMap((row) =>
  columns.map((column) => ({ row: row.id, column: column.id, kind: 'link' })),
);

/** A kind's glyph that counts how often a mark draws it. */
function countingKind() {
  const drawn = { count: 0 };
  const glyph: GlyphComponent = () => {
    drawn.count += 1;
    return null;
  };
  return { drawn, kinds: [{ id: 'link', label: 'Linked', glyph }] };
}

describe('RelationMatrix renders', () => {
  it('UIC-RELATION-MATRIX-2.1 draws again only the cells focus leaves and enters on an arrow key', async () => {
    const user = userEvent.setup();
    const { drawn, kinds } = countingKind();
    render(
      <RelationMatrix
        aria-label="Links"
        rows={rows}
        columns={columns}
        relations={relations}
        kinds={kinds}
      />,
    );
    expect(drawn.count).toBe(size * size);
    await user.click(screen.getAllByRole('gridcell')[0] as HTMLElement);
    drawn.count = 0;
    await user.keyboard('{ArrowRight}');
    expect(drawn.count).toBeLessThanOrEqual(2);
  });

  it('UIC-RELATION-MATRIX-3.1 draws nothing again for a scroll that keeps the same cells in view', () => {
    const { drawn, kinds } = countingKind();
    const { container } = render(
      <RelationMatrix
        aria-label="Links"
        rows={rows}
        columns={columns}
        relations={relations}
        kinds={kinds}
        virtualized
      />,
    );
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.scrollTop = 1;
    fireEvent.scroll(grid);
    drawn.count = 0;
    // One more pixel within the same row keeps the same rows and columns in view.
    grid.scrollTop = 2;
    fireEvent.scroll(grid);
    expect(drawn.count).toBe(0);
  });
});
