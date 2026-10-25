import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SegmentedBar, type SegmentedBarShape } from './segmented-bar.js';

class VisibilityObserver {
  static instances: VisibilityObserver[] = [];
  target: Element | null = null;
  constructor(private readonly callback: IntersectionObserverCallback) {
    VisibilityObserver.instances.push(this);
  }
  observe(target: Element) {
    this.target = target;
  }
  disconnect() {}
  report(isIntersecting: boolean) {
    this.callback(
      [{ target: this.target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const segments = [
  { id: 'first', label: 'First', value: 3 },
  { id: 'zero', label: 'Zero', value: 0 },
  { id: 'last', label: 'Last', value: 1 },
];

function latestObserver() {
  const observer = VisibilityObserver.instances.at(-1);
  if (!observer) throw new Error('No visibility observer.');
  return observer;
}

function pendingAnimation() {
  let finish = () => {};
  let cancel = () => {};
  const finished = new Promise<void>((resolve, reject) => {
    finish = resolve;
    cancel = () => reject(new DOMException('Cancelled', 'AbortError'));
  });
  const read = vi
    .spyOn(Element.prototype, 'getAnimations')
    .mockReturnValue([{ finished } as unknown as Animation]);
  return { finish, cancel, read };
}

beforeEach(() => {
  VisibilityObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', VisibilityObserver);
});

afterEach(() => vi.unstubAllGlobals());

describe('SegmentedBar entry animation', () => {
  it('UIC-SEGMENTED-BAR-4.1 is static by default', () => {
    render(<SegmentedBar label="Parts" segments={segments} />);
    const bar = screen.getByRole('group', { name: 'Parts' });
    expect(bar).not.toHaveAttribute('data-animated');
    expect(bar.querySelector('[data-animation-state]')).toHaveAttribute(
      'data-animation-state',
      'complete',
    );
    expect(VisibilityObserver.instances).toHaveLength(0);
  });

  it.each<SegmentedBarShape>(['linear', 'donut', 'pie'])(
    'UIC-SEGMENTED-BAR-4.1 %s plays once on first visibility and keeps truthful labels',
    async (shape) => {
      const animation = pendingAnimation();
      const view = (value: number) => (
        <SegmentedBar
          shape={shape}
          label="Parts"
          segments={[...segments, { id: 'new', label: 'New', value }]}
          total={8}
          animated
          showLegend
        />
      );
      const { rerender } = render(view(0));
      const bar = screen.getByRole('group', { name: 'Parts' });
      const drawing = bar.querySelector('[data-animation-state]')!;
      expect(bar).toHaveAttribute('data-animated', 'true');
      expect(drawing).toHaveAttribute('data-animation-state', 'waiting');
      expect(within(bar).getAllByRole('listitem')[0]).toHaveTextContent('First 3 37.5%');
      act(() => latestObserver().report(false));
      expect(drawing).toHaveAttribute('data-animation-state', 'waiting');
      const observer = latestObserver();
      act(() => observer.report(true));
      expect(drawing).toHaveAttribute('data-animation-state', 'running');
      expect(animation.read).toHaveBeenCalledWith({ subtree: true });
      await act(async () => animation.finish());
      expect(drawing).toHaveAttribute('data-animation-state', 'complete');
      rerender(view(2));
      act(() => {
        observer.report(false);
        observer.report(true);
      });
      expect(drawing).toHaveAttribute('data-animation-state', 'complete');
      expect(animation.read).toHaveBeenCalledTimes(1);
      expect(within(bar).getAllByRole('listitem').at(-1)).toHaveTextContent('New 2 25%');
      expectHooksMatchSpec(bar, 'SEGMENTED-BAR');
    },
  );

  it('UIC-SEGMENTED-BAR-4.2 exposes ordered geometry, skipping zero shares', () => {
    render(<SegmentedBar label="Parts" segments={segments} total={8} />);
    const bar = screen.getByRole('group', { name: 'Parts' });
    const drawing = bar.querySelector<HTMLElement>('[data-animation-state]')!;
    expect(drawing.style.getPropertyValue('--ui-segment-total')).toBe('50');
    const parts = [...bar.querySelectorAll<HTMLElement>('.ui-segmented-bar__segment')];
    expect(
      parts.map((part) => [
        part.style.getPropertyValue('--ui-segment-share'),
        part.style.getPropertyValue('--ui-segment-start'),
      ]),
    ).toEqual([
      ['37.5', '0'],
      ['12.5', '37.5'],
    ]);
    expectHooksMatchSpec(bar, 'SEGMENTED-BAR');
  });

  it('UIC-SEGMENTED-BAR-4.1 completes immediately without CSS animations or intersection observation', () => {
    const { rerender } = render(
      <SegmentedBar key="observed" label="Parts" segments={segments} animated />,
    );
    act(() => latestObserver().report(true));
    expect(document.querySelector('[data-animation-state]')).toHaveAttribute(
      'data-animation-state',
      'complete',
    );
    vi.stubGlobal('IntersectionObserver', undefined);
    rerender(<SegmentedBar key="fallback" label="Parts" segments={segments} animated />);
    expect(document.querySelector('[data-animation-state]')).toHaveAttribute(
      'data-animation-state',
      'complete',
    );
  });

  it('UIC-SEGMENTED-BAR-4.1 finishes when CSS motion is cancelled', async () => {
    const animation = pendingAnimation();
    render(<SegmentedBar label="Parts" segments={segments} animated />);
    act(() => latestObserver().report(true));
    await act(async () => animation.cancel());
    expect(document.querySelector('[data-animation-state]')).toHaveAttribute(
      'data-animation-state',
      'complete',
    );
  });
});
