import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Combobox } from './combobox.js';

afterEach(() => vi.useRealTimers());

describe('Combobox opening', () => {
  it.each(['isDisabled', 'isReadOnly'] as const)(
    'UIC-COMBOBOX-1.3 UIC-COMBOBOX-2.3 cancels an opening when %s arrives before the next frame',
    (lock) => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const items = [{ id: 'apple', label: 'Apple' }];
      const { rerender } = render(<Combobox label="Fruit" defaultItems={items} isOpen />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      rerender(<Combobox label="Fruit" defaultItems={items} isOpen {...{ [lock]: true }} />);
      act(() => vi.advanceTimersToNextFrame());
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      rerender(<Combobox label="Fruit" defaultItems={items} isOpen={false} />);
      act(() => vi.advanceTimersToNextFrame());
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      rerender(<Combobox label="Fruit" defaultItems={items} isOpen />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      act(() => vi.advanceTimersToNextFrame());
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    },
  );
});
