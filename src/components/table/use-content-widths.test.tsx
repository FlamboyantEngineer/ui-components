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

afterEach(() => vi.restoreAllMocks());

describe('content column measurements', () => {
  it('UIC-TABLE-4.5 measures committed headers and updates after cell text changes without retaining clones', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return new DOMRect(
        0,
        0,
        this.hasAttribute('data-column') ? (this.textContent?.length ?? 0) * 8 : 800,
        24,
      );
    });
    const { rerender } = render(<Measurement value="Pear" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":32}'));
    rerender(<Measurement value="A longer name" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":104}'));
    rerender(<Measurement value="Fig" />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('{"name":32}'));
    expect(document.querySelectorAll('.ui-table__grid')).toHaveLength(1);
    expect(document.querySelectorAll('#measured-table')).toHaveLength(1);
  });

  it('UIC-TABLE-4.5 leaves hidden or unlaid-out tables unmeasured', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect());
    render(<Measurement value="Pear" />);
    expect(screen.getByRole('status')).toHaveTextContent('{}');
  });
});
