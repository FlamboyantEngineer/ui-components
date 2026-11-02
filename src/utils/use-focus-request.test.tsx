import { act, render, renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShadowHost, deepActive, inShadow, shadowRootOf } from '../../test/shadow-fixtures.js';
import { requireDefined } from './require-defined.js';
import { focusWithRetry, useFocusRequest } from './use-focus-request.js';

function Editor({
  blockFrames = 0,
  hideAdded = false,
}: {
  blockFrames?: number;
  hideAdded?: boolean;
}) {
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
      {items
        .filter((id) => !hideAdded || id === 'a')
        .map((id) => (
          <input key={id} id={id} aria-label={id} disabled={blockFrames > 0 && id !== 'a'} />
        ))}
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
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
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(added).toHaveFocus();
    act(() => {
      vi.advanceTimersToNextFrame();
      vi.advanceTimersToNextFrame();
    });
    // Focus that moved away after the element held it is left alone.
    act(() => screen.getByRole('button', { name: 'Add' }).focus());
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(screen.getByRole('button', { name: 'Add' })).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-4.2 stops retrying once the reader acts again', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const user = userEvent.setup();
    render(<Editor />);
    const add = screen.getByRole('button', { name: 'Add' });
    act(() => add.click());
    expect(screen.getByRole('textbox', { name: 'item-1' })).toHaveFocus();
    // A retry is still pending to confirm focus held; the reader presses elsewhere first.
    // Pressing the button focuses it, as the browser does on mousedown.
    await user.pointer({ keys: '[MouseLeft>]', target: add });
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(add).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-4.2 waits for an element that mounts after the edit', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const user = userEvent.setup();
    const { rerender } = render(<Editor hideAdded />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.queryByRole('textbox', { name: 'item-1' })).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    rerender(<Editor />);
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(screen.getByRole('textbox', { name: 'item-1' })).toHaveFocus();
  });

  it('UIC-STEP-LIST-EDITOR-4.2 gives up after sixty attempts when the target never mounts', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const target = vi.fn(() => null);
    const { result, rerender } = renderHook(() => useFocusRequest());
    act(() => result.current(target));
    rerender();
    act(() => {
      vi.advanceTimersByTime(16 * 100);
    });
    expect(target).toHaveBeenCalledTimes(60);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-STEP-LIST-EDITOR-4.2 ignores a cancelled zero-id frame even if it is delivered later', async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return 0;
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const user = userEvent.setup();
    const { rerender } = render(<Editor blockFrames={1} />);
    const add = screen.getByRole('button', { name: 'Add' });
    await user.click(add);
    await user.keyboard('{Tab}');
    rerender(<Editor />);
    act(() => frames.forEach((callback) => callback(0)));
    expect(screen.getByRole('textbox', { name: 'item-1' })).not.toHaveFocus();
    expect(cancel).toHaveBeenCalledWith(0);
  });

  it('UIC-STEP-LIST-EDITOR-4.2 releases retries and input listeners on unmount', () => {
    const element = document.createElement('input');
    const target = vi.fn(() => element);
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return 0;
    });
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { result, rerender, unmount } = renderHook(() => useFocusRequest());
    act(() => result.current(target));
    rerender();
    expect(target).toHaveBeenCalledTimes(1);
    unmount();
    act(() => frames.forEach((callback) => callback(0)));
    expect(target).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith(0);
  });

  it('UIC-STEP-LIST-EDITOR-4.2 uses the focused element document for frames and user cancellation', async () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const owner = requireDefined(frame.contentDocument);
    const view = requireDefined(frame.contentWindow);
    const input = owner.body.appendChild(owner.createElement('input'));
    const requestFrame = vi.fn(() => 0);
    const cancelFrame = vi.fn();
    Object.defineProperty(view, 'requestAnimationFrame', { value: requestFrame });
    Object.defineProperty(view, 'cancelAnimationFrame', { value: cancelFrame });
    const user = userEvent.setup({ document: owner });
    const { result, rerender, unmount } = renderHook(() => useFocusRequest());
    try {
      act(() => result.current(() => input));
      rerender();
      expect(owner.activeElement).toBe(input);
      expect(requestFrame).toHaveBeenCalledTimes(1);
      await user.keyboard('a');
      expect(cancelFrame).toHaveBeenCalledWith(0);
    } finally {
      unmount();
      frame.remove();
    }
  });
  it('UIC-FOCUS-SCOPE-2.8 sees focus it gave inside a shadow root and stops retrying', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    render(
      <ShadowHost name="editor">
        <input aria-label="Name" />
      </ShadowHost>,
    );
    const input = inShadow('editor').getByRole('textbox', { name: 'Name' });
    const focus = vi.spyOn(input, 'focus');
    focusWithRetry(() => shadowRootOf('editor').querySelector<HTMLElement>('input'));
    for (let frame = 0; frame < 6; frame += 1) {
      act(() => {
        vi.advanceTimersToNextFrame();
      });
    }
    expect(deepActive()).toBe(input);
    expect(focus).toHaveBeenCalledOnce();
  });

  describe('ownership after the target takes focus', () => {
    function advanceFrames(count: number) {
      for (let frame = 0; frame < count; frame += 1) {
        act(() => {
          vi.advanceTimersToNextFrame();
        });
      }
    }

    function renderLists() {
      render(
        <div>
          <div role="grid" aria-label="Source">
            <div role="row" tabIndex={-1} aria-label="Moved" />
            <div role="row" tabIndex={-1} aria-label="Sibling" />
          </div>
          <div role="grid" aria-label="Destination">
            <div role="row" tabIndex={-1} aria-label="Arrived" />
            <div role="row" tabIndex={-1} aria-label="Neighbour" />
          </div>
          <button type="button">Handle</button>
          <div role="dialog" aria-label="Details">
            <button type="button">Close</button>
          </div>
        </div>,
      );
      const row = (name: string) => screen.getByRole('row', { name });
      return { row, arrived: row('Arrived') };
    }

    it('UIC-STEP-LIST-EDITOR-4.2 yields to the application focusing another control', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const { row, arrived } = renderLists();
      act(() => row('Moved').focus());
      focusWithRetry(() => arrived);
      expect(arrived).toHaveFocus();
      const handle = screen.getByRole('button', { name: 'Handle' });
      act(() => handle.focus());
      advanceFrames(4);
      expect(handle).toHaveFocus();
    });

    it('UIC-STEP-LIST-EDITOR-4.2 yields to a dialog that takes focus', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const { arrived } = renderLists();
      focusWithRetry(() => arrived);
      const close = screen.getByRole('button', { name: 'Close' });
      act(() => close.focus());
      advanceFrames(4);
      expect(close).toHaveFocus();
    });

    it('UIC-STEP-LIST-EDITOR-4.2 undoes a collection repairing its own focus while the edit settles', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const { row, arrived } = renderLists();
      act(() => row('Moved').focus());
      focusWithRetry(() => arrived);
      // The source collection, then the destination, move focus onto their own items.
      act(() => row('Sibling').focus());
      advanceFrames(1);
      expect(arrived).toHaveFocus();
      act(() => row('Neighbour').focus());
      advanceFrames(1);
      expect(arrived).toHaveFocus();
      act(() => arrived.blur());
      advanceFrames(1);
      expect(arrived).toHaveFocus();
    });

    it('UIC-STEP-LIST-EDITOR-4.2 keeps retrying while the target has not taken focus yet', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const { arrived } = renderLists();
      let ready = false;
      focusWithRetry(() => (ready ? arrived : null));
      act(() => screen.getByRole('button', { name: 'Handle' }).focus());
      ready = true;
      advanceFrames(1);
      expect(arrived).toHaveFocus();
    });

    it('UIC-FOCUS-SCOPE-2.8 yields to focus moved inside a shadow root', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      render(
        <ShadowHost name="editor">
          <div role="grid" aria-label="Items">
            <div role="row" tabIndex={-1} aria-label="Item" />
          </div>
          <button type="button">Other</button>
        </ShadowHost>,
      );
      const item = inShadow('editor').getByRole('row', { name: 'Item' });
      const other = inShadow('editor').getByRole('button', { name: 'Other' });
      focusWithRetry(() => item);
      expect(deepActive()).toBe(item);
      act(() => other.focus());
      advanceFrames(4);
      expect(deepActive()).toBe(other);
    });
  });
});
