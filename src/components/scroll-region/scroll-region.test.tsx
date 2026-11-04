import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Table } from '../table/table.js';
import { ScrollRegion, useScrollRegionHeaderRef } from './scroll-region.js';
import { MIN_THUMB_SIZE, THUMB_ARROW_STEP } from './scroll-region-defaults.js';
import { readScrollEdges } from './use-scroll-edges.js';

interface Geometry {
  clientHeight: number;
  scrollHeight: number;
  clientWidth: number;
  scrollWidth: number;
}

const geometryKeys = ['clientHeight', 'clientWidth', 'scrollHeight', 'scrollWidth'] as const;
const viewports = new Map<string, Geometry>();
const tracks = { vertical: 80, horizontal: 110 };
let frames: Map<number, FrameRequestCallback>;
let resizeCallbacks: Array<() => void>;
let disconnects: number;

function geometryOf(element: HTMLElement, key: (typeof geometryKeys)[number]): number {
  if (element.classList.contains('ui-scroll-region__viewport')) {
    return viewports.get(element.id)?.[key] ?? 0;
  }
  if (element.classList.contains('ui-scroll-region__track')) {
    const orientation = element.dataset.orientation;
    if (key === 'clientHeight' && orientation === 'vertical') return tracks.vertical;
    if (key === 'clientWidth' && orientation === 'horizontal') return tracks.horizontal;
  }
  return 0;
}

class FakeResizeObserver {
  constructor(callback: () => void) {
    resizeCallbacks.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    disconnects += 1;
  }
}

beforeEach(() => {
  viewports.clear();
  tracks.vertical = 80;
  tracks.horizontal = 110;
  frames = new Map();
  resizeCallbacks = [];
  disconnects = 0;
  let frameId = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  for (const key of geometryKeys) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get(this: HTMLElement) {
        return geometryOf(this, key);
      },
    });
  }
});

afterEach(() => {
  for (const key of geometryKeys) Reflect.deleteProperty(HTMLElement.prototype, key);
  vi.unstubAllGlobals();
});

function flushFrames() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  });
}

function resizeAll() {
  act(() => resizeCallbacks.forEach((callback) => callback()));
  flushFrames();
}

/** jsdom keeps no scroll position: give a viewport one that its scroll range clamps. */
function trackScrollTop(viewport: HTMLElement) {
  let top = 0;
  Object.defineProperty(viewport, 'scrollTop', {
    configurable: true,
    get: () => top,
    set(value: number) {
      top = Math.max(0, Math.min(value, viewport.scrollHeight - viewport.clientHeight));
    },
  });
}

function scrollTo(viewport: HTMLElement, top: number) {
  act(() => {
    viewport.scrollTop = top;
  });
  fireEvent.scroll(viewport);
}

/**
 * Fakes the timeouts and returns a user-event session that runs on the fake clock. Testing Library
 * drains each user-event call with a zero timeout that it advances only on Jest's clock, so point
 * that at Vitest's; `afterEach` unstubs it.
 */
function fakeTimeouts() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

function thumb(viewportId: string, orientation = 'vertical') {
  return document.querySelector<HTMLElement>(
    `[role="scrollbar"][aria-controls="${viewportId}"][aria-orientation="${orientation}"]`,
  );
}

function StickyHeader() {
  const ref = useScrollRegionHeaderRef();
  return (
    <thead ref={ref}>
      <tr>
        <th>Fruit</th>
      </tr>
    </thead>
  );
}

function table(): ReactNode {
  return (
    <table>
      <StickyHeader />
      <tbody>
        <tr>
          <td>Apple</td>
        </tr>
      </tbody>
    </table>
  );
}

describe('ScrollRegion', () => {
  it('UIC-SCROLL-REGION-1.1 frames a viewport that takes native props while the root takes hooks', () => {
    const ref = createRef<HTMLDivElement>();
    const onScroll = vi.fn();
    const { container, rerender } = render(
      <ScrollRegion
        ref={ref}
        id="fruit"
        className="caller"
        aria-label="Fruit"
        role="region"
        tabIndex={0}
        onScroll={onScroll}
        data-testid="region"
      >
        <p>Apple</p>
      </ScrollRegion>,
    );
    const root = requireDefined(container.firstElementChild);
    const viewport = requireDefined(root.firstElementChild);
    expect(root).toHaveClass('ui-scroll-region', 'caller');
    expect(root).toHaveAttribute('data-testid', 'region');
    expect(root).not.toHaveAttribute('id');
    expect(viewport).toHaveClass('ui-scroll-region__viewport');
    expect(viewport).not.toHaveAttribute('data-testid');
    expect(ref.current).toBe(viewport);
    expect(screen.getByRole('region', { name: 'Fruit' })).toBe(viewport);
    expect(viewport).toHaveAttribute('id', 'fruit');
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(viewport).toHaveTextContent('Apple');
    fireEvent.scroll(viewport);
    expect(onScroll).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'SCROLL-REGION', { slots: ['viewport'] });

    rerender(
      <ScrollRegion ref={ref} id="fruit" hidden scrollbar="overlay" axis="both">
        <p>Apple</p>
      </ScrollRegion>,
    );
    expect(requireDefined(container.firstElementChild).firstElementChild).toBe(viewport);
    expect((container.firstElementChild as HTMLElement).hidden).toBe(true);
  });

  it('UIC-SCROLL-REGION-1.2 publishes its axis, scroll chaining, scrollbar mode, containment and grid', () => {
    const { container, rerender } = render(<ScrollRegion>Text</ScrollRegion>);
    const root = requireDefined(container.firstElementChild);
    expect(root).toHaveAttribute('data-axis', 'y');
    expect(root).toHaveAttribute('data-overscroll', 'contain');
    expect(root).toHaveAttribute('data-scrollbar', 'native');
    expect(root).toHaveAttribute('data-grow', 'true');
    expect(root).not.toHaveAttribute('data-clip');
    expect(root).not.toHaveAttribute('data-fill');
    expect(root).not.toHaveAttribute('data-columns');
    expect(root).not.toHaveAttribute('data-space');
    expectHooksMatchSpec(container, 'SCROLL-REGION');

    for (const axis of ['x', 'y', 'both', 'none'] as const) {
      rerender(<ScrollRegion axis={axis}>Text</ScrollRegion>);
      expect(root).toHaveAttribute('data-axis', axis);
      if (axis === 'none') expect(root).toHaveAttribute('data-clip', 'true');
      else expect(root).not.toHaveAttribute('data-clip');
    }
    rerender(
      <ScrollRegion
        axis="none"
        clip={false}
        grow="none"
        fill
        overscroll="auto"
        columns="fit"
        minColumnWidth="md"
        space="md"
        align="start"
      >
        Text
      </ScrollRegion>,
    );
    expect(root).not.toHaveAttribute('data-clip');
    expect(root).toHaveAttribute('data-grow', 'none');
    expect(root).toHaveAttribute('data-fill', 'true');
    expect(root).toHaveAttribute('data-overscroll', 'auto');
    expect(root).toHaveAttribute('data-columns', 'fit');
    expect(root).toHaveAttribute('data-min-column-width', 'md');
    expect(root).toHaveAttribute('data-space', 'md');
    expect(root).toHaveAttribute('data-align', 'start');
    expectHooksMatchSpec(container, 'SCROLL-REGION');
    rerender(<ScrollRegion columns={1}>Text</ScrollRegion>);
    expect(root).toHaveAttribute('data-space', 'none');
    expect(root).toHaveAttribute('data-align', 'stretch');
    expect(root).not.toHaveAttribute('data-min-column-width');
  });

  it('UIC-SCROLL-REGION-2.1 UIC-SCROLL-REGION-2.2 draws focusable overlay thumbs on overflowing axes only', () => {
    viewports.set('region', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    const { container } = render(
      <ScrollRegion id="region" scrollbar="overlay" aria-label="Fruit">
        Content
      </ScrollRegion>,
    );
    flushFrames();
    flushFrames();
    const root = requireDefined(container.firstElementChild);
    const viewport = requireDefined(document.getElementById('region'));
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('data-scrollbar', 'overlay');
    expect(root).toHaveAttribute('data-overflow-y', 'true');
    expect(root).not.toHaveAttribute('data-overflow-x');
    const track = requireDefined(container.querySelector<HTMLElement>('.ui-scroll-region__track'));
    expect(track).toHaveAttribute('data-orientation', 'vertical');
    expect(track.style.pointerEvents).toBe('');
    const vertical = requireDefined(thumb('region'));
    expect(vertical).toHaveClass('ui-scroll-region__thumb');
    expect(vertical.style.pointerEvents).toBe('auto');
    expect(vertical.style.top).toBe('0px');
    expect(vertical.style.height).toBe('26.666666666666668px');
    expect(thumb('region', 'horizontal')).toBeNull();
    expect((root as HTMLElement).style.getPropertyValue('--ui-scroll-region-header-size')).toBe(
      '0px',
    );
    expectHooksMatchSpec(container, 'SCROLL-REGION', { slots: ['viewport', 'track', 'thumb'] });
  });

  it('UIC-SCROLL-REGION-2.2 measures a right-to-left horizontal thumb from the left edge', () => {
    viewports.set('wide', {
      clientHeight: 100,
      scrollHeight: 100,
      clientWidth: 100,
      scrollWidth: 400,
    });
    render(
      <ScrollRegion id="wide" axis="x" scrollbar="overlay" dir="rtl">
        Content
      </ScrollRegion>,
    );
    const viewport = requireDefined(document.getElementById('wide'));
    viewport.style.direction = 'rtl';
    fireEvent.scroll(viewport);
    flushFrames();
    flushFrames();
    const horizontal = requireDefined(thumb('wide', 'horizontal'));
    // Track 110, thumb max(24, 110 * 100 / 400) = 27.5, at the right end at scroll start.
    expect(horizontal.style.width).toBe('27.5px');
    expect(horizontal.style.left).toBe('82.5px');
    expect(horizontal).toHaveAttribute('aria-valuenow', '300');
  });

  it.each([false, true])(
    'UIC-TABLE-7.2 UIC-SCROLL-REGION-2.5 measures native Table headers and releases them (groups=%s)',
    async (grouped) => {
      viewports.set('catalog', {
        clientHeight: 100,
        scrollHeight: 300,
        clientWidth: 120,
        scrollWidth: 120,
      });
      vi.spyOn(HTMLTableSectionElement.prototype, 'getBoundingClientRect').mockImplementation(
        function (this: HTMLTableSectionElement) {
          return { height: this.rows.length * 20 } as DOMRect;
        },
      );
      const nativeTable = (
        <Table
          aria-label="City catalog"
          stickyHeader
          rows={[{ id: 'oslo', city: 'Oslo', country: 'Norway' }]}
          columns={[
            { id: 'city', header: 'City' },
            { id: 'country', header: 'Country' },
          ]}
          columnGroups={
            grouped ? [{ id: 'location', header: 'Location', columns: ['city', 'country'] }] : []
          }
        />
      );
      const region = (inset: 'header' | 'none', content = nativeTable) => (
        <ScrollRegion id="catalog" scrollbar="overlay" scrollbarInset={inset}>
          {content}
        </ScrollRegion>
      );
      const { container, rerender } = render(region('header'));
      await screen.findByRole('columnheader', { name: 'City' });
      flushFrames();
      flushFrames();
      const root = requireDefined(container.firstElementChild) as HTMLElement;
      const measuredHeader = () => root.style.getPropertyValue('--ui-scroll-region-header-size');
      expect(measuredHeader()).toBe(grouped ? '40px' : '20px');
      expect(thumb('catalog')).toHaveAttribute('aria-valuemax', '200');

      rerender(region('none'));
      flushFrames();
      flushFrames();
      expect(measuredHeader()).toBe('0px');
      rerender(region('header'));
      flushFrames();
      flushFrames();
      expect(measuredHeader()).toBe(grouped ? '40px' : '20px');
      rerender(region('header', <p>No cities</p>));
      flushFrames();
      flushFrames();
      expect(measuredHeader()).toBe('0px');
    },
  );

  it('UIC-SCROLL-REGION-2.3 UIC-SCROLL-REGION-2.5 names thumbs, steps by key and keeps below a registered header', async () => {
    const user = userEvent.setup();
    viewports.set('first', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    viewports.set('second', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    vi.spyOn(HTMLTableSectionElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 20,
    } as DOMRect);
    const { container } = render(
      <UiProvider messages={{ scrollVertically: 'Faire défiler' }}>
        <ScrollRegion id="first" scrollbar="overlay" scrollbarInset="header">
          {table()}
        </ScrollRegion>
        <ScrollRegion id="second" scrollbar="overlay">
          Second
        </ScrollRegion>
      </UiProvider>,
    );
    flushFrames();
    flushFrames();
    const first = requireDefined(document.getElementById('first'));
    const second = requireDefined(document.getElementById('second'));
    const firstRoot = container.children[0] as HTMLElement;
    expect(firstRoot.style.getPropertyValue('--ui-scroll-region-header-size')).toBe('20px');
    const vertical = requireDefined(thumb('first'));
    expect(vertical).toHaveAccessibleName('Faire défiler');
    expect(vertical).toHaveAttribute('aria-valuemin', '0');
    expect(vertical).toHaveAttribute('aria-valuemax', '200');
    expect(vertical).toHaveAttribute('aria-valuenow', '0');
    expect(vertical).toHaveAttribute('tabindex', '0');
    expect(vertical.style.height).toBe(`${MIN_THUMB_SIZE}px`);

    vertical.focus();
    await user.keyboard('{End}');
    flushFrames();
    expect(first.scrollTop).toBe(200);
    expect(vertical).toHaveAttribute('aria-valuenow', '200');
    expect(vertical.style.top).toBe('56px');
    expect(second.scrollTop).toBe(0);
    expect(thumb('second')).toHaveAttribute('aria-valuenow', '0');

    await user.keyboard('{PageUp}');
    expect(first.scrollTop).toBe(120);
    await user.keyboard('{ArrowUp}');
    expect(first.scrollTop).toBe(120 - THUMB_ARROW_STEP);
    await user.keyboard('{ArrowLeft}');
    expect(first.scrollTop).toBe(80);
    await user.keyboard('{Home}');
    expect(first.scrollTop).toBe(0);
    await user.keyboard('{PageDown}{ArrowDown}');
    expect(first.scrollTop).toBe(120);
  });

  it('UIC-SCROLL-REGION-2.4 drags a thumb with pointer capture and forwards the wheel to the viewport', async () => {
    const user = userEvent.setup();
    viewports.set('region', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    render(
      <ScrollRegion id="region" scrollbar="overlay">
        Content
      </ScrollRegion>,
    );
    flushFrames();
    flushFrames();
    const viewport = requireDefined(document.getElementById('region'));
    const scrollBy = vi.fn();
    viewport.scrollBy = scrollBy as typeof viewport.scrollBy;
    const vertical = requireDefined(thumb('region'));
    let captured: number | null = null;
    Object.assign(vertical, {
      setPointerCapture: (id: number) => {
        captured = id;
      },
      hasPointerCapture: (id: number) => captured === id,
      releasePointerCapture: () => {
        captured = null;
      },
    });
    // Track 80, thumb 26.67: travel 53.33 pixels covers 200 pixels of scrolling.
    await user.pointer({ keys: '[MouseLeft>]', target: vertical, coords: { clientY: 10 } });
    // user-event's mouse is pointer 1.
    expect(captured).toBe(1);
    expect(vertical).toHaveFocus();
    await user.pointer({ target: vertical, coords: { clientY: 10 + 80 / 3 } });
    expect(viewport.scrollTop).toBeCloseTo(100);
    await user.pointer({ keys: '[/MouseLeft]', target: vertical });
    expect(captured).toBeNull();
    await user.pointer({ target: vertical, coords: { clientY: 200 } });
    expect(viewport.scrollTop).toBeCloseTo(100);

    fireEvent.wheel(vertical, { deltaY: 3, deltaMode: 1 });
    expect(scrollBy).toHaveBeenCalledWith({ left: 0, top: 48 });
  });

  it('UIC-SCROLL-REGION-2.4 keeps the page still while the wheel over a thumb can scroll the viewport', () => {
    viewports.set('region', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    render(
      <ScrollRegion id="region" scrollbar="overlay">
        Content
      </ScrollRegion>,
    );
    flushFrames();
    flushFrames();
    const viewport = requireDefined(document.getElementById('region'));
    trackScrollTop(viewport);
    viewport.scrollBy = vi.fn(({ top = 0 }: ScrollToOptions) => {
      viewport.scrollTop += top;
    }) as typeof viewport.scrollBy;
    const vertical = requireDefined(thumb('region'));
    // A cancelled wheel event does not scroll the page.
    expect(fireEvent.wheel(vertical, { deltaY: 40 })).toBe(false);
    expect(viewport.scrollTop).toBe(40);
    expect(fireEvent.wheel(vertical, { deltaY: 400 })).toBe(false);
    expect(viewport.scrollTop).toBe(200);
    // At the viewport's end the wheel goes on to the page, as on a native scrollbar.
    expect(fireEvent.wheel(vertical, { deltaY: 40 })).toBe(true);
    expect(fireEvent.wheel(vertical, { deltaY: -40 })).toBe(false);
    expect(viewport.scrollTop).toBe(160);
  });

  it.each([{ ctrlKey: true }, { metaKey: true }])(
    'UIC-SCROLL-REGION-2.4 leaves a zoom wheel over a thumb to the browser (%o)',
    (modifier) => {
      viewports.set('region', {
        clientHeight: 100,
        scrollHeight: 300,
        clientWidth: 120,
        scrollWidth: 120,
      });
      const outer = vi.fn();
      render(
        <div onWheel={outer}>
          <ScrollRegion id="region" scrollbar="overlay">
            Content
          </ScrollRegion>
        </div>,
      );
      flushFrames();
      flushFrames();
      const viewport = requireDefined(document.getElementById('region'));
      trackScrollTop(viewport);
      viewport.scrollBy = vi.fn() as typeof viewport.scrollBy;
      const vertical = requireDefined(thumb('region'));
      expect(fireEvent.wheel(vertical, { deltaY: 40, ...modifier })).toBe(true);
      expect(viewport.scrollBy).not.toHaveBeenCalled();
      expect(viewport.scrollTop).toBe(0);
      expect(outer).toHaveBeenCalledOnce();
      expect(fireEvent.wheel(vertical, { deltaY: 40 })).toBe(false);
      expect(viewport.scrollBy).toHaveBeenCalledOnce();
      expect(outer).toHaveBeenCalledOnce();
    },
  );

  it('UIC-SCROLL-REGION-2.5 gives no header ref outside an inset overlay region', () => {
    const refs: unknown[] = [];
    function Probe() {
      refs.push(useScrollRegionHeaderRef());
      return null;
    }
    render(
      <>
        <Probe />
        <ScrollRegion>
          <Probe />
        </ScrollRegion>
        <ScrollRegion scrollbar="overlay">
          <Probe />
        </ScrollRegion>
        <ScrollRegion scrollbar="overlay" scrollbarInset="header">
          <Probe />
        </ScrollRegion>
      </>,
    );
    expect(refs.slice(0, 3)).toEqual([undefined, undefined, undefined]);
    expect(typeof refs[3]).toBe('function');
  });

  it('UIC-SCROLL-REGION-2.6 lifts the horizontal track over the empty space below short content', () => {
    const geometry = { clientHeight: 400, scrollHeight: 400, clientWidth: 120, scrollWidth: 600 };
    viewports.set('region', geometry);
    const { container } = render(
      <ScrollRegion id="region" axis="both" scrollbar="overlay">
        <div>Three rows</div>
      </ScrollRegion>,
    );
    const viewport = requireDefined(document.getElementById('region'));
    viewport.getBoundingClientRect = () => ({ top: 50, bottom: 450, height: 400 }) as DOMRect;
    screen.getByText('Three rows').getBoundingClientRect = () =>
      ({ top: 50, bottom: 200, height: 150 }) as DOMRect;
    fireEvent.scroll(viewport);
    flushFrames();
    flushFrames();
    const root = container.firstElementChild as HTMLElement;
    expect(thumb('region', 'horizontal')).not.toBeNull();
    expect(thumb('region')).toBeNull();
    expect(root.style.getPropertyValue('--ui-scroll-region-content-lift')).toBe('250px');
    geometry.scrollHeight = 900;
    fireEvent.scroll(viewport);
    flushFrames();
    expect(root.style.getPropertyValue('--ui-scroll-region-content-lift')).toBe('0px');
  });

  it('UIC-SCROLL-REGION-2.7 refreshes on resize, returns focus when a thumb leaves and cleans up', () => {
    const geometry = { clientHeight: 100, scrollHeight: 300, clientWidth: 120, scrollWidth: 120 };
    viewports.set('region', geometry);
    const { unmount } = render(
      <ScrollRegion id="region" scrollbar="overlay">
        Content
      </ScrollRegion>,
    );
    flushFrames();
    flushFrames();
    // The overlay geometry and the edges share one observer.
    expect(resizeCallbacks).toHaveLength(1);
    const viewport = requireDefined(document.getElementById('region'));
    const vertical = requireDefined(thumb('region'));
    act(() => vertical.focus());
    geometry.scrollHeight = 80;
    resizeAll();
    expect(thumb('region')).toBeNull();
    expect(viewport).toHaveFocus();
    expect(document.getElementById('region')).toBe(viewport);
    // A resize reads at once; a scroll waits for one frame however many times it fires.
    act(() => resizeCallbacks.forEach((callback) => callback()));
    expect(frames.size).toBe(0);
    fireEvent.scroll(viewport);
    fireEvent.scroll(viewport);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(disconnects).toBeGreaterThan(0);
  });

  it('UIC-SCROLL-REGION-2.7 follows mutations and scrolling without ResizeObserver', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const geometry = { clientHeight: 100, scrollHeight: 300, clientWidth: 120, scrollWidth: 120 };
    viewports.set('region', geometry);
    const { unmount } = render(
      <ScrollRegion id="region" scrollbar="overlay">
        Content
      </ScrollRegion>,
    );
    flushFrames();
    flushFrames();
    expect(thumb('region')).not.toBeNull();
    const viewport = requireDefined(document.getElementById('region'));
    geometry.scrollHeight = 80;
    await act(async () => viewport.append(document.createElement('p')));
    flushFrames();
    expect(thumb('region')).toBeNull();
    geometry.scrollHeight = 300;
    fireEvent.scroll(viewport);
    flushFrames();
    flushFrames();
    expect(thumb('region')).not.toBeNull();
    unmount();
    expect(frames.size).toBe(0);
  });

  it('UIC-SCROLL-REGION-3.1 paints the overview beside the native scrollbar and releases it with the markers', () => {
    const geometry = { clientHeight: 100, scrollHeight: 1000, clientWidth: 100, scrollWidth: 100 };
    viewports.set('notes', geometry);
    const markers = [{ top: 500, height: 10, color: 'red', priority: 0 }];
    const { container, rerender } = render(<ScrollRegion id="notes" overview={markers} />);
    flushFrames();
    const root = container.firstElementChild as HTMLElement;
    const viewport = requireDefined(document.getElementById('notes'));
    expect(root).toHaveAttribute('data-overview', 'true');
    const image = root.style.getPropertyValue('--ui-scroll-region-overview-image');
    expect(image).toContain('red 50% 52%');
    const layer = requireDefined(
      container.querySelector<HTMLElement>('.ui-scroll-region__overview'),
    );
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.style.height).toBe('100px');
    expect(layer.style.pointerEvents).toBe('none');
    expectHooksMatchSpec(container, 'SCROLL-REGION', { slots: ['viewport', 'overview'] });

    act(() => {
      viewport.scrollTop = 100;
    });
    fireEvent.scroll(viewport);
    expect(frames.size).toBe(0);
    geometry.clientHeight = 200;
    resizeAll();
    expect(document.getElementById('notes')).toBe(viewport);
    expect(root.style.getPropertyValue('--ui-scroll-region-overview-image')).toContain(
      'red 50% 51%',
    );
    expect(layer.style.height).toBe('200px');
    // The overview shares the region's one observer with its edges.
    expect(resizeCallbacks).toHaveLength(1);

    rerender(<ScrollRegion id="notes" />);
    resizeAll();
    expect(document.getElementById('notes')).toBe(viewport);
    expect(root).not.toHaveAttribute('data-overview');
    expect(root.style.getPropertyValue('--ui-scroll-region-overview-image')).toBe('');
    expect(container.querySelector('.ui-scroll-region__overview')).toBeNull();
  });

  it('UIC-SCROLL-REGION-3.1 paints nothing for fitting content or in overlay mode', () => {
    viewports.set('short', {
      clientHeight: 100,
      scrollHeight: 100,
      clientWidth: 100,
      scrollWidth: 100,
    });
    viewports.set('overlay', {
      clientHeight: 100,
      scrollHeight: 1000,
      clientWidth: 100,
      scrollWidth: 100,
    });
    const markers = [{ top: 10, height: 10, color: 'blue', priority: 0 }];
    const { container } = render(
      <>
        <ScrollRegion id="short" overview={markers} />
        <ScrollRegion id="overlay" scrollbar="overlay" overview={markers} />
      </>,
    );
    flushFrames();
    flushFrames();
    expect(container.querySelector('[data-overview]')).toBeNull();
    expect(container.querySelector('.ui-scroll-region__overview')).toBeNull();
  });

  it('UIC-SCROLL-REGION-3.3 paints named layers', () => {
    viewports.set('notes', {
      clientHeight: 100,
      scrollHeight: 1000,
      clientWidth: 100,
      scrollWidth: 100,
    });
    const layers = [
      { name: 'b', markers: [{ top: 0, height: 10, color: 'blue', priority: 0 }] },
      { name: 'a', markers: [{ top: 0, height: 10, color: 'red', priority: 0 }] },
    ];
    const { container } = render(<ScrollRegion id="notes" overviewLayers={layers} />);
    flushFrames();
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        '--ui-scroll-region-overview-image',
      ),
    ).toContain('color-mix(in srgb, red 50%, blue) 0% 2%');
  });

  it('UIC-SCROLL-REGION-2.8 shows scroll-mode tracks while scrolling and for the hide delay', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      viewports.set('log', {
        clientHeight: 100,
        scrollHeight: 300,
        clientWidth: 120,
        scrollWidth: 120,
      });
      const { container } = render(
        <ScrollRegion
          id="log"
          scrollbar="overlay"
          scrollbarVisibility="scroll"
          scrollbarHideDelay={400}
        >
          Lines
        </ScrollRegion>,
      );
      flushFrames();
      const root = requireDefined(container.firstElementChild);
      expect(root).toHaveAttribute('data-scrollbar-visibility', 'scroll');
      expect(root).toHaveAttribute('data-overflow-y', 'true');
      expect(container.querySelector('.ui-scroll-region__track')).toBeNull();
      fireEvent.scroll(requireDefined(document.getElementById('log')));
      expect(container.querySelector('.ui-scroll-region__track')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(399);
      });
      fireEvent.scroll(requireDefined(document.getElementById('log')));
      act(() => {
        vi.advanceTimersByTime(399);
      });
      expect(container.querySelector('.ui-scroll-region__track')).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(container.querySelector('.ui-scroll-region__track')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-SCROLL-REGION-2.8 shows hover-mode tracks while hovered, lingering, or with a focused thumb', async () => {
    const user = fakeTimeouts();
    try {
      viewports.set('menu', {
        clientHeight: 100,
        scrollHeight: 300,
        clientWidth: 120,
        scrollWidth: 120,
      });
      const { container } = render(
        <ScrollRegion id="menu" scrollbar="overlay" scrollbarVisibility="hover">
          Dishes
        </ScrollRegion>,
      );
      flushFrames();
      const root = requireDefined(container.firstElementChild);
      const track = () => container.querySelector('.ui-scroll-region__track');
      expect(track()).toBeNull();
      // A touch pointer enters as it goes down.
      await user.pointer({ keys: '[TouchA>]', target: root });
      expect(track()).toBeNull();
      await user.pointer({ keys: '[/TouchA]' });
      expect(track()).toBeNull();
      await user.hover(root);
      expect(root).toHaveAttribute('data-hovering', 'true');
      expect(track()).not.toBeNull();
      await user.unhover(root);
      expect(root).not.toHaveAttribute('data-hovering');
      act(() => {
        vi.advanceTimersByTime(599);
      });
      expect(track()).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(track()).toBeNull();

      // eslint-disable-next-line testing-library/prefer-user-event -- user-event has no pen pointer
      fireEvent.pointerEnter(root, { pointerType: 'pen' });
      flushFrames();
      act(() => requireDefined(thumb('menu')).focus());
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event has no pen pointer
      fireEvent.pointerLeave(root, { pointerType: 'pen' });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(track()).not.toBeNull();
      act(() => requireDefined(thumb('menu')).blur());
      expect(track()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-SCROLL-REGION-2.7 UIC-SCROLL-REGION-2.8 lets tracks hide after a focused thumb left with its axis', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const geometry = { clientHeight: 100, scrollHeight: 300, clientWidth: 120, scrollWidth: 120 };
      viewports.set('log', geometry);
      const { container } = render(
        <ScrollRegion id="log" scrollbar="overlay" scrollbarVisibility="scroll">
          Lines
        </ScrollRegion>,
      );
      flushFrames();
      const viewport = requireDefined(document.getElementById('log'));
      const track = () => container.querySelector('.ui-scroll-region__track');
      fireEvent.scroll(viewport);
      flushFrames();
      act(() => requireDefined(thumb('log')).focus());
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(track()).not.toBeNull();
      geometry.scrollHeight = 80;
      resizeAll();
      expect(thumb('log')).toBeNull();
      expect(viewport).toHaveFocus();
      geometry.scrollHeight = 300;
      resizeAll();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(track()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-SCROLL-REGION-2.8 keeps a leaving track mounted through its exit animation', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    let finish = () => {};
    let animate = false;
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: () =>
        animate ? [{ finished: new Promise<void>((resolve) => (finish = resolve)) }] : [],
    });
    try {
      viewports.set('feed', {
        clientHeight: 100,
        scrollHeight: 300,
        clientWidth: 120,
        scrollWidth: 120,
      });
      const { container } = render(
        <ScrollRegion id="feed" scrollbar="overlay" scrollbarVisibility="scroll">
          Posts
        </ScrollRegion>,
      );
      flushFrames();
      animate = true;
      fireEvent.scroll(requireDefined(document.getElementById('feed')));
      const track = requireDefined(container.querySelector('.ui-scroll-region__track'));
      expect(track).toHaveAttribute('data-entering', 'true');
      await act(async () => finish());
      expect(track).not.toHaveAttribute('data-entering');
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(track).toHaveAttribute('data-exiting', 'true');
      expectHooksMatchSpec(container, 'SCROLL-REGION', { slots: ['viewport', 'track', 'thumb'] });
      await act(async () => finish());
      expect(container.querySelector('.ui-scroll-region__track')).toBeNull();
    } finally {
      delete (Element.prototype as Partial<Element>).getAnimations;
      vi.useRealTimers();
    }
  });

  it('UIC-SCROLL-REGION-2.8 draws always-mode tracks on fitting axes with a thumb out of the tab order', () => {
    viewports.set('note', {
      clientHeight: 100,
      scrollHeight: 100,
      clientWidth: 120,
      scrollWidth: 120,
    });
    const { container } = render(
      <ScrollRegion id="note" axis="both" scrollbar="overlay" scrollbarVisibility="always">
        Short
      </ScrollRegion>,
    );
    expect(thumb('note')).not.toBeNull();
    flushFrames();
    flushFrames();
    expect(container.firstElementChild).not.toHaveAttribute('data-overflow-y');
    const vertical = requireDefined(thumb('note'));
    expect(vertical).toHaveAttribute('tabindex', '-1');
    expect(vertical).toHaveAttribute('aria-valuemax', '0');
    expect(vertical.style.height).toBe(`${tracks.vertical}px`);
    expect(thumb('note', 'horizontal')).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-SCROLL-REGION-2.9 pages toward a press on the track beside the thumb', async () => {
    const user = userEvent.setup();
    viewports.set('long', {
      clientHeight: 100,
      scrollHeight: 400,
      clientWidth: 120,
      scrollWidth: 120,
    });
    const { container } = render(
      <ScrollRegion id="long" scrollbar="overlay">
        Chapters
      </ScrollRegion>,
    );
    flushFrames();
    flushFrames();
    const viewport = requireDefined(document.getElementById('long'));
    trackScrollTop(viewport);
    const track = requireDefined(container.querySelector<HTMLElement>('.ui-scroll-region__track'));
    const vertical = requireDefined(thumb('long'));
    vertical.getBoundingClientRect = () => ({ top: 40, left: 0, bottom: 60 }) as DOMRect;
    const press = (target: HTMLElement, clientY: number, keys = '[MouseLeft]') =>
      user.pointer({ keys, target, coords: { clientY } });
    await press(track, 90);
    expect(viewport.scrollTop).toBe(100);
    await press(track, 90);
    await press(track, 90);
    await press(track, 90);
    expect(viewport.scrollTop).toBe(300);
    await press(track, 10);
    expect(viewport.scrollTop).toBe(200);
    await press(track, 10, '[MouseRight]');
    await press(vertical, 10);
    expect(viewport.scrollTop).toBe(200);
  });

  it('UIC-SCROLL-REGION-4.1 publishes edge distances in native mode and none without an axis', () => {
    viewports.set('edges', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    const { container, rerender } = render(<ScrollRegion id="edges">Rows</ScrollRegion>);
    const root = container.firstElementChild as HTMLElement;
    const viewport = requireDefined(document.getElementById('edges'));
    trackScrollTop(viewport);
    expect(root).not.toHaveAttribute('data-overflow-y-start');
    expect(root).toHaveAttribute('data-overflow-y-end', 'true');
    expect(root.style.getPropertyValue('--ui-scroll-region-overflow-y-end')).toBe('200px');
    scrollTo(viewport, 60);
    expect(frames.size).toBe(0);
    expect(root).toHaveAttribute('data-overflow-y-start', 'true');
    expect(root.style.getPropertyValue('--ui-scroll-region-overflow-y-start')).toBe('60px');
    expect(root.style.getPropertyValue('--ui-scroll-region-overflow-y-end')).toBe('140px');
    expect(root.style.getPropertyValue('--ui-scroll-region-overflow-x-start')).toBe('0px');
    expect(root.style.getPropertyValue('--ui-scroll-region-overflow-x-end')).toBe('0px');
    expectHooksMatchSpec(container, 'SCROLL-REGION');
    scrollTo(viewport, 200);
    expect(root).not.toHaveAttribute('data-overflow-y-end');

    rerender(
      <ScrollRegion id="edges" axis="none">
        Rows
      </ScrollRegion>,
    );
    expect(root).not.toHaveAttribute('data-overflow-y-start');
    expect(root.style.getPropertyValue('--ui-scroll-region-overflow-y-start')).toBe('');
  });

  it('UIC-SCROLL-REGION-4.1 measures horizontal edges from the inline start', () => {
    const element = (scrollLeft: number, direction: string) =>
      ({
        scrollTop: 0,
        scrollLeft,
        scrollWidth: 300,
        clientWidth: 100,
        scrollHeight: 50,
        clientHeight: 50,
        ownerDocument: { defaultView: { getComputedStyle: () => ({ direction }) } },
      }) as unknown as HTMLElement;
    expect(readScrollEdges(element(50, 'ltr'))).toEqual({
      yStart: 0,
      yEnd: 0,
      xStart: 50,
      xEnd: 150,
    });
    expect(readScrollEdges(element(-50, 'rtl'))).toEqual({
      yStart: 0,
      yEnd: 0,
      xStart: 50,
      xEnd: 150,
    });
    expect(readScrollEdges(element(0.4, 'ltr')).xStart).toBe(0);
  });

  it('UIC-SCROLL-REGION-4.1 follows resizes and child changes', async () => {
    const geometry = { clientHeight: 100, scrollHeight: 100, clientWidth: 120, scrollWidth: 120 };
    viewports.set('grow', geometry);
    const { container } = render(<ScrollRegion id="grow">Rows</ScrollRegion>);
    const root = requireDefined(container.firstElementChild);
    expect(root).not.toHaveAttribute('data-overflow-y-end');
    geometry.scrollHeight = 180;
    resizeAll();
    expect(root).toHaveAttribute('data-overflow-y-end', 'true');
    geometry.scrollHeight = 100;
    await act(async () =>
      requireDefined(document.getElementById('grow')).append(document.createElement('p')),
    );
    expect(root).not.toHaveAttribute('data-overflow-y-end');
  });

  it('UIC-SCROLL-REGION-4.2 publishes scrolling and hovering', async () => {
    const user = fakeTimeouts();
    try {
      viewports.set('busy', {
        clientHeight: 100,
        scrollHeight: 300,
        clientWidth: 120,
        scrollWidth: 120,
      });
      const { container } = render(
        <ScrollRegion id="busy" scrollbarHideDelay={200}>
          Rows
        </ScrollRegion>,
      );
      const root = requireDefined(container.firstElementChild);
      fireEvent.scroll(requireDefined(document.getElementById('busy')));
      expect(root).toHaveAttribute('data-scrolling', 'true');
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(root).not.toHaveAttribute('data-scrolling');
      await user.hover(root);
      expect(root).toHaveAttribute('data-hovering', 'true');
      expectHooksMatchSpec(container, 'SCROLL-REGION');
      await user.unhover(root);
      expect(root).not.toHaveAttribute('data-hovering');
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-SCROLL-REGION-4.3 calls the edge callbacks when scrolling reaches the top or bottom', () => {
    viewports.set('feed', {
      clientHeight: 100,
      scrollHeight: 300,
      clientWidth: 120,
      scrollWidth: 120,
    });
    const onTopReached = vi.fn();
    const onBottomReached = vi.fn();
    render(
      <ScrollRegion id="feed" onTopReached={onTopReached} onBottomReached={onBottomReached}>
        Posts
      </ScrollRegion>,
    );
    const viewport = requireDefined(document.getElementById('feed'));
    trackScrollTop(viewport);
    expect(onTopReached).not.toHaveBeenCalled();
    scrollTo(viewport, 120);
    scrollTo(viewport, 200);
    expect(onBottomReached).toHaveBeenCalledTimes(1);
    scrollTo(viewport, 200);
    expect(onBottomReached).toHaveBeenCalledTimes(1);
    scrollTo(viewport, 0);
    expect(onTopReached).toHaveBeenCalledTimes(1);
  });

  it('UIC-SCROLL-REGION-4.4 follows new content at the bottom until the reader scrolls up', () => {
    const geometry = { clientHeight: 100, scrollHeight: 300, clientWidth: 120, scrollWidth: 120 };
    viewports.set('chat', geometry);
    const onBottomReached = vi.fn();
    const { rerender } = render(
      <ScrollRegion id="chat" stickToBottom onBottomReached={onBottomReached}>
        Messages
      </ScrollRegion>,
    );
    const viewport = requireDefined(document.getElementById('chat'));
    trackScrollTop(viewport);
    rerender(
      <ScrollRegion id="chat" stickToBottom onBottomReached={onBottomReached}>
        Messages
      </ScrollRegion>,
    );
    resizeAll();
    expect(viewport.scrollTop).toBe(200);
    fireEvent.scroll(viewport);
    geometry.scrollHeight = 400;
    resizeAll();
    expect(viewport.scrollTop).toBe(300);
    fireEvent.scroll(viewport);
    expect(onBottomReached).not.toHaveBeenCalled();
    scrollTo(viewport, 120);
    geometry.scrollHeight = 500;
    resizeAll();
    expect(viewport.scrollTop).toBe(120);
    scrollTo(viewport, 400);
    geometry.scrollHeight = 600;
    resizeAll();
    expect(viewport.scrollTop).toBe(500);
  });

  it('UIC-SCROLL-REGION-4.4 stays pinned through a browser scroll that comes with new content', () => {
    const geometry = { clientHeight: 100, scrollHeight: 300, clientWidth: 120, scrollWidth: 120 };
    viewports.set('anchored', geometry);
    render(
      <ScrollRegion id="anchored" stickToBottom>
        <p>Entries</p>
      </ScrollRegion>,
    );
    const viewport = requireDefined(document.getElementById('anchored'));
    trackScrollTop(viewport);
    resizeAll();
    fireEvent.scroll(viewport);
    expect(viewport.scrollTop).toBe(200);
    // Scroll anchoring moves the viewport a little as the content grows, before any frame.
    geometry.scrollHeight = 500;
    scrollTo(viewport, 210);
    expect(viewport.scrollTop).toBe(400);
    fireEvent.scroll(viewport);
    scrollTo(viewport, 100);
    geometry.scrollHeight = 600;
    resizeAll();
    expect(viewport.scrollTop).toBe(100);
  });

  it('UIC-SCROLL-REGION-2.7 UIC-SCROLL-REGION-4.1 UIC-SCROLL-REGION-4.4 follows nested content changes that resize no child', async () => {
    const geometry = { clientHeight: 200, scrollHeight: 400, clientWidth: 300, scrollWidth: 300 };
    viewports.set('log', geometry);
    const { container } = render(
      <ScrollRegion id="log" stickToBottom scrollbar="overlay">
        <div style={{ height: 100 }}>
          <pre>line 1</pre>
        </div>
      </ScrollRegion>,
    );
    const root = container.firstElementChild as HTMLElement;
    const viewport = requireDefined(document.getElementById('log'));
    trackScrollTop(viewport);
    resizeAll();
    expect(viewport.scrollTop).toBe(200);
    fireEvent.scroll(viewport);
    const lines = requireDefined(viewport.querySelector('pre'));
    const vertical = requireDefined(thumb('log'));
    expect(vertical).toHaveAttribute('aria-valuemax', '200');
    const edge = () => root.style.getPropertyValue('--ui-scroll-region-overflow-y-end');
    // Changes deeper than the children: text, then a style, each read once a frame.
    const change = async (scrollHeight: number, apply: () => void) => {
      geometry.scrollHeight = scrollHeight;
      await act(async () => apply());
      flushFrames();
    };
    await change(800, () => {
      requireDefined(lines.firstChild).textContent = 'line 1\nline 2';
    });
    expect(viewport.scrollTop).toBe(600);
    expect(vertical).toHaveAttribute('aria-valuemax', '600');
    expect(edge()).toBe('0px');
    fireEvent.scroll(viewport);
    await change(900, () => lines.setAttribute('style', 'font-size: 2em'));
    expect(viewport.scrollTop).toBe(700);
    expect(vertical).toHaveAttribute('aria-valuemax', '700');

    // A reader who scrolled up stays put and sees the content below grow and shrink.
    scrollTo(viewport, 100);
    await change(1000, () => {
      requireDefined(lines.firstChild).textContent = 'line 1\nline 2\nline 3';
    });
    expect(viewport.scrollTop).toBe(100);
    expect(edge()).toBe('700px');
    expect(vertical).toHaveAttribute('aria-valuemax', '800');
    await change(500, () => lines.removeAttribute('style'));
    expect(viewport.scrollTop).toBe(100);
    expect(edge()).toBe('200px');
    expect(vertical).toHaveAttribute('aria-valuemax', '300');
  });
});
