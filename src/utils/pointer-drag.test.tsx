import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { armElementDrag, listenPointerRelease } from './pointer-drag.js';
import { requireDefined } from './require-defined.js';

/** Lets the task that dispatched the last event pass. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('native drag lifecycle', () => {
  it('UIC-DRAG-INTERACTIONS-2.2 ignores another pointer and reports cancellation separately from release', async () => {
    const user = userEvent.setup();
    render(<button>Drag</button>);
    const button = screen.getByRole('button', { name: 'Drag' });
    const onRelease = vi.fn();
    const onCancel = vi.fn();
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    const stop = listenPointerRelease({ element: button, pointerId: 1, onRelease, onCancel });
    fireEvent.pointerCancel(button, { pointerId: 2 });
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.pointerCancel(button, { pointerId: 1 });
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
    stop();
  });

  it('UIC-DRAG-INTERACTIONS-2.1 arms once, stays armed through native drag cancellation and disarms on drag end or release', async () => {
    const user = userEvent.setup();
    render(<button>Drag</button>);
    const button = screen.getByRole('button', { name: 'Drag' });
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    armElementDrag(button);
    armElementDrag(button);
    expect(button).toHaveAttribute('draggable', 'true');
    // A native drag cancels its pointer stream as it starts, before or after dragstart.
    fireEvent.pointerCancel(button);
    fireEvent.dragStart(button);
    await nextTask();
    expect(button).toHaveAttribute('draggable', 'true');
    fireEvent.dragEnd(button);
    expect(button).not.toHaveAttribute('draggable');
    armElementDrag(button);
    fireEvent.dragStart(button);
    fireEvent.pointerCancel(button);
    await nextTask();
    expect(button).toHaveAttribute('draggable', 'true');
    fireEvent.dragEnd(button);
    expect(button).not.toHaveAttribute('draggable');
    armElementDrag(button);
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(button).not.toHaveAttribute('draggable');
  });

  it('UIC-DRAG-INTERACTIONS-2.1 disarms a cancelled press that starts no drag, even once removed', async () => {
    const { unmount } = render(<button>Drag</button>);
    const button = screen.getByRole('button', { name: 'Drag' });
    const removeListener = vi.spyOn(button.ownerDocument, 'removeEventListener');
    armElementDrag(button);
    fireEvent.pointerCancel(button);
    expect(button).toHaveAttribute('draggable', 'true');
    await nextTask();
    expect(button).not.toHaveAttribute('draggable');
    expect(removeListener).toHaveBeenCalledWith('pointerup', expect.any(Function), true);
    // A later drag of the element is not one it armed.
    fireEvent.dragStart(button);
    fireEvent.dragEnd(button);
    expect(button).not.toHaveAttribute('draggable');
    armElementDrag(button);
    unmount();
    fireEvent.pointerCancel(button.ownerDocument);
    await nextTask();
    expect(button).not.toHaveAttribute('draggable');
    removeListener.mockRestore();
  });

  it('UIC-DRAG-INTERACTIONS-2.2 listens for an uncaptured release in its own document and stops after release', async () => {
    const outer = userEvent.setup();
    render(
      <>
        <button>Outer</button>
        <iframe title="Inner" />
      </>,
    );
    const frame = screen.getByTitle<HTMLIFrameElement>('Inner');
    const document = requireDefined(frame.contentDocument);
    const button = document.createElement('button');
    button.textContent = 'Inner';
    document.body.append(button);
    const user = userEvent.setup({ document });
    const onRelease = vi.fn();
    const onCancel = vi.fn();
    const target = within(document.body).getByRole('button', { name: 'Inner' });
    await user.pointer({ keys: '[MouseLeft>]', target });
    const stop = listenPointerRelease({ element: target, onRelease, onCancel });
    await outer.click(screen.getByRole('button', { name: 'Outer' }));
    expect(onRelease).not.toHaveBeenCalled();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onRelease).toHaveBeenCalledTimes(1);
    await user.click(target);
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    stop();
  });
});
