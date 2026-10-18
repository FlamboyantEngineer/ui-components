import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFocusRequest } from './use-focus-request.js';

function Editor({ blockFrames = 0 }: { blockFrames?: number }) {
  const [items, setItems] = useState(['a']);
  const requestFocus = useFocusRequest();
  const add = () => {
    const id = `item-${items.length}`;
    setItems([...items, id]);
    requestFocus(() => document.getElementById(id));
  };
  return (
    <div>
      <button type="button" onClick={add}>
        Add
      </button>
      {items.map((id) => (
        <input key={id} id={id} aria-label={id} disabled={blockFrames > 0 && id !== 'a'} />
      ))}
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useFocusRequest', () => {
  it('UIC-STEP-LIST-EDITOR-4.2 focuses the requested element after the render that draws it', () => {
    render(<Editor />);
    act(() => screen.getByRole('button', { name: 'Add' }).click());
    expect(screen.getByRole('textbox', { name: 'item-1' })).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-4.2 retries on later frames until the element takes focus', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const { rerender } = render(<Editor blockFrames={1} />);
    act(() => screen.getByRole('button', { name: 'Add' }).click());
    const added = screen.getByRole('textbox', { name: 'item-1' });
    expect(added).not.toHaveFocus();
    rerender(<Editor blockFrames={0} />);
    act(() => vi.advanceTimersToNextFrame());
    expect(added).toHaveFocus();
    // Focus that moved away after the element held it is left alone.
    act(() => screen.getByRole('button', { name: 'Add' }).focus());
    act(() => vi.advanceTimersToNextFrame());
    expect(screen.getByRole('button', { name: 'Add' })).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-4.2 stops retrying once the reader acts again', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    render(<Editor />);
    const add = screen.getByRole('button', { name: 'Add' });
    act(() => add.click());
    expect(screen.getByRole('textbox', { name: 'item-1' })).toHaveFocus();
    // A retry is still pending to confirm focus held; the reader presses elsewhere first.
    act(() => {
      fireEvent.pointerDown(add);
      add.focus();
    });
    act(() => vi.advanceTimersToNextFrame());
    expect(add).toHaveFocus();
  });
});
