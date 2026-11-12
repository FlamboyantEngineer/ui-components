import { act, render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ScrollOverview, type ScrollOverviewProps } from './scroll-overview.js';

type OverviewOptions = Omit<ScrollOverviewProps, 'scrollRef'>;

/** A scroll container 100 pixels tall over 1000 pixels of content, with the overview after it. */
function Scroller({ children, ...overview }: OverviewOptions & { children?: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div
        ref={(element) => {
          scrollRef.current = element;
          if (!element) return;
          Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true });
          Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true });
        }}
      >
        {children}
      </div>
      <ScrollOverview scrollRef={scrollRef} {...overview} />
    </>
  );
}

function strip(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLElement>('.ui-scroll-overview'));
}

function placeAt(element: Element, top: number, height: number) {
  element.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: top, width: 10, height });
}

describe('ScrollOverview', () => {
  it('UIC-SCROLL-OVERVIEW-1.1 paints range markers scaled to the visible height', () => {
    const { container } = render(
      <Scroller markers={[{ top: 500, height: 10, color: 'red', priority: 0 }]} />,
    );
    const root = strip(container);
    expect(root.style.getPropertyValue('--ui-scroll-overview-image')).toContain('red 50% 52%');
    expect(root.style.height).toBe('100px');
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root.style.pointerEvents).toBe('none');
    expect(root).not.toHaveAttribute('data-empty');
    expectHooksMatchSpec(container, 'SCROLL-OVERVIEW');
  });

  it('UIC-SCROLL-OVERVIEW-1.1 publishes data-empty with nothing to paint', () => {
    const { container } = render(<Scroller markers={[]} />);
    expect(strip(container)).toHaveAttribute('data-empty', 'true');
    expect(strip(container).style.getPropertyValue('--ui-scroll-overview-image')).toBe('none');
  });

  it('UIC-SCROLL-OVERVIEW-1.2 measures element markers and follows them as the content changes', async () => {
    const target = document.createElement('p');
    function WithTarget() {
      return (
        <Scroller markers={[{ element: target, color: 'green', priority: 0 }]}>
          <div ref={(host) => void host?.append(target)} />
        </Scroller>
      );
    }
    placeAt(target, 300, 20);
    const { container } = render(<WithTarget />);
    await waitFor(() =>
      expect(strip(container).style.getPropertyValue('--ui-scroll-overview-image')).toContain(
        'green 30% 32%',
      ),
    );
    placeAt(target, 700, 20);
    await act(async () => target.append('moved'));
    await waitFor(() =>
      expect(strip(container).style.getPropertyValue('--ui-scroll-overview-image')).toContain(
        'green 70% 72%',
      ),
    );
  });

  it('UIC-SCROLL-OVERVIEW-1.2 measures again only when the markers change, not for equal inline ones', () => {
    const target = document.createElement('p');
    const measure = vi.fn(() => DOMRect.fromRect({ x: 0, y: 300, width: 10, height: 20 }));
    target.getBoundingClientRect = measure;
    const overview = (color: string) => (
      <Scroller markers={[{ element: target, color, priority: 0 }]}>
        <div ref={(host) => void host?.append(target)} />
      </Scroller>
    );
    const { container, rerender } = render(overview('green'));
    const measured = measure.mock.calls.length;
    expect(measured).toBeGreaterThan(0);
    rerender(overview('green'));
    rerender(overview('green'));
    expect(measure).toHaveBeenCalledTimes(measured);
    rerender(overview('blue'));
    expect(measure.mock.calls.length).toBeGreaterThan(measured);
    expect(strip(container).style.getPropertyValue('--ui-scroll-overview-image')).toContain('blue');
  });

  it('UIC-SCROLL-OVERVIEW-1.2 leaves out an element outside the container', () => {
    const outside = document.createElement('p');
    document.body.append(outside);
    placeAt(outside, 300, 20);
    const { container } = render(
      <Scroller markers={[{ element: outside, color: 'green', priority: 0 }]} />,
    );
    expect(strip(container)).toHaveAttribute('data-empty', 'true');
    outside.remove();
  });

  it('UIC-SCROLL-OVERVIEW-1.3 scrolls to a pressed marker and reports it as given', async () => {
    const user = userEvent.setup();
    const onMarkerActivate = vi.fn();
    const near = { top: 500, height: 10, color: 'red', priority: 1 };
    const first = { top: 500, height: 10, color: 'blue', priority: 0 };
    const { container } = render(
      <Scroller markers={[near, first]} onMarkerActivate={onMarkerActivate} />,
    );
    const root = strip(container);
    const scroller = requireDefined(root.previousElementSibling as HTMLElement | null);
    scroller.scrollTo = vi.fn() as typeof scroller.scrollTo;
    expect(root).toHaveAttribute('data-interactive', 'true');
    expect(root.style.pointerEvents).toBe('');
    await user.pointer({ keys: '[MouseLeft]', target: root, coords: { clientY: 10 } });
    expect(onMarkerActivate).not.toHaveBeenCalled();
    await user.pointer({ keys: '[MouseLeft]', target: root, coords: { clientY: 50 } });
    expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 500 });
    expect(onMarkerActivate).toHaveBeenCalledWith(first);
  });
});
