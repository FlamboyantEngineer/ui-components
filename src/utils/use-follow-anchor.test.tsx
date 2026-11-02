import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useFollowAnchor } from './use-follow-anchor.js';

/** Records each `shouldUpdatePosition` value the overlay would receive after a commit. */
function Harness({ isOpen, target, log }: { isOpen: boolean; target?: unknown; log: boolean[] }) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const shouldUpdatePosition = useFollowAnchor({ anchorRef, isOpen, target });
  useLayoutEffect(() => {
    log.push(shouldUpdatePosition);
  });
  return <button ref={anchorRef}>Anchor</button>;
}

/** A collection publishes a second position target after its controlled value commits. */
function LayoutTarget({ value, log }: { value: string; log: boolean[] }) {
  const [committedValue, setCommittedValue] = useState(value);
  const target = useMemo(() => ({ value, committedValue }), [value, committedValue]);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reproduce a parent publishing updated child props after its first DOM commit.
    setCommittedValue(value);
  }, [value]);
  return <Harness isOpen target={target} log={log} />;
}

/** Whether the log turned position updates off and back on after `from`. */
function hasReplaced(log: boolean[], from: number): boolean {
  const index = log.indexOf(false, from);
  return index >= 0 && log.slice(index + 1).includes(true);
}

describe('useFollowAnchor', () => {
  it('UIC-OVERLAY-POSITION-3.6 places an open overlay again after a scroll of its page', async () => {
    const log: boolean[] = [];
    render(<Harness isOpen log={log} />);
    // Let the observers' first reports settle.
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    const from = log.length;
    fireEvent.scroll(window);
    await waitFor(() => expect(hasReplaced(log, from)).toBe(true));
    expect(log.at(-1)).toBe(true);
    expect(screen.getByRole('button', { name: 'Anchor' })).toBeInTheDocument();
  });

  it('UIC-OVERLAY-POSITION-3.6 places it again for a new target, and follows nothing while closed', async () => {
    const log: boolean[] = [];
    const { rerender } = render(<Harness isOpen={false} target="1,2" log={log} />);
    fireEvent.scroll(window);
    rerender(<Harness isOpen={false} target="3,4" log={log} />);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(log.every(Boolean)).toBe(true);

    rerender(<Harness isOpen target="3,4" log={log} />);
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    const from = log.length;
    rerender(<Harness isOpen target="5,6" log={log} />);
    expect(hasReplaced(log, from)).toBe(true);
    expect(log.at(-1)).toBe(true);
  });

  it('UIC-OVERLAY-POSITION-3.6 resumes when a parent layout update changes an already-paused target', () => {
    const log: boolean[] = [];
    const { rerender } = render(<LayoutTarget value="first" log={log} />);
    const from = log.length;
    rerender(<LayoutTarget value="second" log={log} />);
    expect(hasReplaced(log, from)).toBe(true);
    expect(log.at(-1)).toBe(true);
    expect(screen.getByRole('button', { name: 'Anchor' })).toBeInTheDocument();
  });
});
