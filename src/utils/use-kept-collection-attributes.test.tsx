import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  useKeptCollectionAttributes,
  type KeptCollectionAttributes,
} from './use-kept-collection-attributes.js';

function Collection(props: KeptCollectionAttributes) {
  const ref = useKeptCollectionAttributes<HTMLDivElement>(props);
  // Stands for React Aria, which sets its own id and no description on a collection taking drops.
  return <div ref={ref} role="grid" aria-label="Rows" id="generated" />;
}

describe('useKeptCollectionAttributes', () => {
  it('UIC-LIST-ROW-3.5 keeps the caller id and description, and drops a description that goes', () => {
    const { rerender } = render(<Collection id="rows" aria-describedby="help" />);
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('id', 'rows');
    expect(grid).toHaveAttribute('aria-describedby', 'help');
    rerender(<Collection id="rows" aria-describedby="other" />);
    expect(grid).toHaveAttribute('aria-describedby', 'other');
    rerender(<Collection id="rows" />);
    expect(grid).not.toHaveAttribute('aria-describedby');
    expect(grid).toHaveAttribute('id', 'rows');
  });
});
