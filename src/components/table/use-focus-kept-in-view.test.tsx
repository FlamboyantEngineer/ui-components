import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusKeptInView } from './use-focus-kept-in-view.js';

class FakeObserver {
  static latest: FakeObserver | null = null;
  constructor(readonly callback: ResizeObserverCallback) {
    FakeObserver.latest = this;
  }
  observe() {}
  disconnect() {}
  report() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

const scrollIntoView = vi.fn();
const original = Element.prototype.scrollIntoView;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', FakeObserver);
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  vi.unstubAllGlobals();
  Element.prototype.scrollIntoView = original;
  scrollIntoView.mockClear();
  FakeObserver.latest = null;
});

function Scroller({ isActive = true }: { isActive?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusKeptInView(ref, isActive);
  return (
    <>
      <div ref={ref} role="region" aria-label="Rows">
        <div>
          <button type="button">Summary</button>
        </div>
      </div>
      <button type="button">Outside</button>
    </>
  );
}

const resize = () => FakeObserver.latest?.report();
const revealed = () => scrollIntoView.mock.contexts.at(-1) as Element | undefined;

describe('useFocusKeptInView', () => {
  it('UIC-TABLE-7.5 reveals the focused cell again when measured rows change the content size', async () => {
    const user = userEvent.setup();
    render(<Scroller />);
    await user.click(screen.getByRole('button', { name: 'Summary' }));
    resize();
    expect(revealed()).toBe(screen.getByRole('button', { name: 'Summary' }));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest', inline: 'nearest' });
  });

  it('UIC-TABLE-7.5 leaves the scroll to the reader after a hand scroll or once focus leaves', async () => {
    const user = userEvent.setup();
    render(<Scroller />);
    const summary = screen.getByRole('button', { name: 'Summary' });
    await user.click(summary);
    fireEvent.wheel(screen.getByRole('region', { name: 'Rows' }));
    resize();
    expect(scrollIntoView).not.toHaveBeenCalled();
    summary.focus();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    resize();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('UIC-TABLE-7.5 does nothing for a table that does not measure its rows', async () => {
    const user = userEvent.setup();
    render(<Scroller isActive={false} />);
    await user.click(screen.getByRole('button', { name: 'Summary' }));
    expect(FakeObserver.latest).toBeNull();
  });
});
