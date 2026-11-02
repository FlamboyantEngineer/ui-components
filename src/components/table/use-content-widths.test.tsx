import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useContentWidths } from './use-content-widths.js';

function Measurement({ value }: { value: string }) {
  const { ref, widths } = useContentWidths([{ id: 'name', width: 'content' }]);
  return (
    <div ref={ref}>
      <table className="ui-table__grid" id="measured-table">
        <thead>
          <tr>
            <th data-column="name">Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-column="name">{value}</td>
          </tr>
        </tbody>
      </table>
      <output role="status" aria-label="Content measurements">
        {JSON.stringify(widths)}
      </output>
    </div>
  );
}

/**
 * Client rects as a browser draws them under an ancestor scale: a cell 8 layout pixels a character
 * wide, any element of a stated pixel width that wide, and the rest 800, all times `scale`.
 */
function stubRects(scale: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const stated = this.style.width.endsWith('px') ? Number.parseFloat(this.style.width) : 800;
    const layout = this.hasAttribute('data-column') ? (this.textContent?.length ?? 0) * 8 : stated;
    return new DOMRect(0, 0, layout * scale, 24 * scale);
  });
}

afterEach(() => vi.restoreAllMocks());

describe('content column measurements', () => {
  it('UIC-TABLE-4.5 measures committed headers and updates after cell text changes without retaining clones', async () => {
    stubRects(1);
    const { rerender } = render(<Measurement value="Pear" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":32}'));
    rerender(<Measurement value="A longer name" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":104}'));
    rerender(<Measurement value="Fig" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":32}'));
    expect(document.querySelectorAll('.ui-table__grid')).toHaveLength(1);
    expect(document.querySelectorAll('#measured-table')).toHaveLength(1);
  });

  it('UIC-TABLE-4.5 measures layout pixels once under an ancestor scale or zoom', async () => {
    for (const scale of [0.5, 2, 1.5]) {
      vi.restoreAllMocks();
      stubRects(scale);
      const { unmount } = render(<Measurement value="A longer name" />);
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":104}'));
      unmount();
    }
  });

  it('UIC-TABLE-4.5 leaves hidden or unlaid-out tables unmeasured', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect());
    render(<Measurement value="Pear" />);
    expect(screen.getByRole('status')).toHaveTextContent('{}');
  });
});
