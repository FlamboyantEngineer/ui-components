import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { capturePointer } from './pointer-drag.js';
import { usePointerDrag } from './use-pointer-drag.js';

interface GestureProps {
  onStart?: ((id: number) => void) | undefined;
  onMove: (delta: number) => void;
  onEnd: (isCancelled: boolean) => void;
  capture?: boolean | undefined;
  accepts?: boolean | undefined;
}

function Gesture({ onStart, onMove, onEnd, capture = true, accepts = true }: GestureProps) {
  const handlers = usePointerDrag<HTMLButtonElement, { x: number }>({
    capture,
    onStart: (event) => {
      onStart?.(event.pointerId);
      return accepts ? { x: event.clientX } : null;
    },
    onMove: (event, start) => {
      if (!capture) capturePointer(event);
      onMove(event.clientX - start.x);
    },
    onEnd: (_event, _start, isCancelled) => onEnd(isCancelled),
  });
  return <button {...handlers}>Move</button>;
}

function observeCapture(element: Element) {
  const pointers = new Set<number>();
  const capture = vi.fn((id: number) => pointers.add(id));
  const release = vi.fn((id: number) => pointers.delete(id));
  Object.defineProperties(element, {
    setPointerCapture: { configurable: true, value: capture },
    hasPointerCapture: { configurable: true, value: (id: number) => pointers.has(id) },
    releasePointerCapture: { configurable: true, value: release },
  });
  return { capture, release };
}

describe('usePointerDrag', () => {
  it('UIC-DRAG-INTERACTIONS-1.1 UIC-DRAG-INTERACTIONS-1.2 follows one primary pointer and ignores a second pointer', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    render(<Gesture onStart={onStart} onMove={onMove} onEnd={onEnd} />);
    const button = screen.getByRole('button', { name: 'Move' });
    const { capture, release } = observeCapture(button);
    await user.pointer({ keys: '[TouchA>]', target: button, coords: { x: 10, y: 10 } });
    await user.pointer([
      { keys: '[TouchB>]', target: button },
      { pointerName: 'TouchB', target: button, coords: { x: 100, y: 10 } },
      { keys: '[/TouchB]' },
    ]);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    await user.pointer({ pointerName: 'TouchA', target: button, coords: { x: 30, y: 10 } });
    expect(onMove).toHaveBeenLastCalledWith(20);
    await user.pointer({ keys: '[/TouchA]' });
    expect(onEnd).toHaveBeenCalledExactlyOnceWith(false);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledExactlyOnceWith(onStart.mock.calls[0]![0]);
  });

  it('UIC-DRAG-INTERACTIONS-1.3 cancels once for cancellation or lost capture and ignores later endings', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onEnd = vi.fn();
    render(<Gesture onStart={onStart} onMove={vi.fn()} onEnd={onEnd} />);
    const button = screen.getByRole('button', { name: 'Move' });
    const { release } = observeCapture(button);
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    const pointerId = onStart.mock.calls[0]![0];
    fireEvent.pointerCancel(button, { pointerId });
    fireEvent.lostPointerCapture(button, { pointerId });
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onEnd).toHaveBeenCalledExactlyOnceWith(true);
    expect(release).toHaveBeenCalledTimes(1);
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    fireEvent.lostPointerCapture(button, { pointerId });
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onEnd.mock.calls).toEqual([[true], [true]]);
  });

  it('UIC-DRAG-INTERACTIONS-1.3 UIC-DRAG-INTERACTIONS-1.4 releases a deferred capture on unmount without reporting a drop', async () => {
    const user = userEvent.setup();
    const onEnd = vi.fn();
    const { unmount } = render(<Gesture capture={false} onMove={vi.fn()} onEnd={onEnd} />);
    const button = screen.getByRole('button', { name: 'Move' });
    const { capture, release } = observeCapture(button);
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    expect(capture).not.toHaveBeenCalled();
    await user.pointer({ target: button, coords: { x: 20, y: 10 } });
    expect(capture).toHaveBeenCalledTimes(1);
    unmount();
    expect(release).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('UIC-DRAG-INTERACTIONS-1.1 UIC-DRAG-INTERACTIONS-1.5 refuses a press and uses current callbacks throughout a later gesture', async () => {
    const user = userEvent.setup();
    const previous = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const { rerender } = render(<Gesture accepts={false} onMove={previous} onEnd={previous} />);
    const button = screen.getByRole('button', { name: 'Move' });
    await user.pointer({ keys: '[MouseLeft]', target: button });
    expect(previous).not.toHaveBeenCalled();
    rerender(<Gesture onMove={previous} onEnd={previous} />);
    await user.pointer({ keys: '[MouseLeft>]', target: button, coords: { x: 10, y: 10 } });
    rerender(<Gesture onMove={onMove} onEnd={onEnd} />);
    await user.pointer({ target: button, coords: { x: 25, y: 10 } });
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(previous).not.toHaveBeenCalled();
    expect(onMove).toHaveBeenCalledExactlyOnceWith(15);
    expect(onEnd).toHaveBeenCalledExactlyOnceWith(false);
  });
});
