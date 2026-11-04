import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreviewState, type PreviewStateOptions } from './use-preview-state.js';

const unmounts: (() => void)[] = [];

function renderPreview(options: Partial<PreviewStateOptions> = {}, isStrict = false) {
  const view = renderHook((props: PreviewStateOptions) => usePreviewState(props), {
    initialProps: { delay: 600, closeDelay: 100, ...options },
    wrapper: isStrict ? StrictMode : undefined,
  });
  unmounts.push(view.unmount);
  return view;
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('usePreviewState', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    for (const unmount of unmounts.splice(0)) unmount();
    advance(60_000);
    vi.useRealTimers();
  });

  it('UIC-HOVER-CARD-1.2 restores the opening delay after the open trigger unmounts', () => {
    const { result: firstState, unmount: unmountFirst } = renderPreview();
    act(() => firstState.current.open());
    advance(600);
    expect(firstState.current.isOpen).toBe(true);
    unmountFirst();
    advance(60_000);

    const { result: nextState } = renderPreview();
    act(() => nextState.current.open());
    expect(nextState.current.isOpen).toBe(false);
    advance(599);
    expect(nextState.current.isOpen).toBe(false);
    advance(1);
    expect(nextState.current.isOpen).toBe(true);
  });

  it('UIC-HOVER-CARD-1.2 UIC-HOVER-CARD-1.4 cools down after an external close without reporting a change', () => {
    const onOpenChange = vi.fn();
    const { rerender: rerenderFirst } = renderPreview({ isOpen: true, onOpenChange });
    rerenderFirst({ delay: 600, closeDelay: 100, isOpen: false, onOpenChange });
    advance(60_000);
    expect(onOpenChange).not.toHaveBeenCalled();

    const { result: nextState } = renderPreview();
    act(() => nextState.current.open());
    expect(nextState.current.isOpen).toBe(false);
    advance(600);
    expect(nextState.current.isOpen).toBe(true);
  });

  it.each([100, 800])(
    'UIC-HOVER-CARD-1.2 keeps the handoff window until max(500, %i) milliseconds after close',
    (closeDelay) => {
      const { result: firstState } = renderPreview({ closeDelay });
      act(() => firstState.current.open(true));
      act(() => firstState.current.close(true));
      advance(Math.max(500, closeDelay) - 1);

      const { result: nextState } = renderPreview();
      act(() => nextState.current.open());
      expect(nextState.current.isOpen).toBe(true);
    },
  );

  it.each([100, 800])(
    'UIC-HOVER-CARD-1.2 restores the delay at max(500, %i) milliseconds without duplicate cleanup extending it',
    (closeDelay) => {
      const { result: firstState, unmount: unmountFirst } = renderPreview({ closeDelay });
      act(() => firstState.current.open(true));
      act(() => firstState.current.close(true));
      advance(Math.max(500, closeDelay) - 1);
      unmountFirst();
      advance(1);

      const { result: nextState } = renderPreview();
      act(() => nextState.current.open());
      expect(nextState.current.isOpen).toBe(false);
      advance(600);
      expect(nextState.current.isOpen).toBe(true);
    },
  );

  it('UIC-HOVER-CARD-1.2 uses the latest close delay when the open trigger unmounts', () => {
    const { rerender: rerenderFirst, unmount: unmountFirst } = renderPreview({ defaultOpen: true });
    rerenderFirst({ delay: 600, closeDelay: 800, defaultOpen: true });
    unmountFirst();
    advance(799);
    const { result: nextState } = renderPreview();
    act(() => nextState.current.open());
    expect(nextState.current.isOpen).toBe(true);
  });

  it('UIC-HOVER-CARD-1.2 keeps a replacement warm when the previous trigger unmounts', () => {
    const { result: firstState, unmount: unmountFirst } = renderPreview();
    act(() => firstState.current.open(true));
    const { result: nextState } = renderPreview();
    act(() => nextState.current.open());
    expect(firstState.current.isOpen).toBe(false);
    expect(nextState.current.isOpen).toBe(true);
    expect(nextState.current.shouldSkipAnimation).toBe(true);
    expect(nextState.current.isCurrent()).toBe(true);
    unmountFirst();
    advance(2000);

    const { result: lastState } = renderPreview();
    act(() => lastState.current.open());
    expect(lastState.current.isOpen).toBe(true);
    expect(nextState.current.isOpen).toBe(false);
  });

  it.each([{ defaultOpen: true }, { isOpen: true }])(
    'UIC-HOVER-CARD-1.2 UIC-HOVER-CARD-1.4 keeps a %j card warm through Strict Mode replay and cools on final unmount',
    (options) => {
      const onOpenChange = vi.fn();
      const { result: firstState, unmount: unmountFirst } = renderPreview(
        { ...options, onOpenChange },
        true,
      );
      advance(2000);
      expect(firstState.current.isOpen).toBe(true);
      expect(firstState.current.isCurrent()).toBe(true);
      expect(onOpenChange).not.toHaveBeenCalled();
      const { result: nextState, unmount: unmountNext } = renderPreview();
      act(() => nextState.current.open());
      expect(nextState.current.isOpen).toBe(true);
      unmountFirst();
      unmountNext();
      advance(60_000);
      const { result: lastState } = renderPreview();
      act(() => lastState.current.open());
      expect(lastState.current.isOpen).toBe(false);
      advance(600);
      expect(lastState.current.isOpen).toBe(true);
    },
  );

  it('UIC-HOVER-CARD-1.2 cancels a pending opening when its trigger unmounts', () => {
    const onOpenChange = vi.fn();
    const { result: firstState, unmount: unmountFirst } = renderPreview({ onOpenChange });
    act(() => firstState.current.open());
    advance(599);
    unmountFirst();
    advance(60_000);
    expect(onOpenChange).not.toHaveBeenCalled();
    const { result: nextState } = renderPreview();
    act(() => nextState.current.open());
    expect(nextState.current.isOpen).toBe(false);
  });
});
