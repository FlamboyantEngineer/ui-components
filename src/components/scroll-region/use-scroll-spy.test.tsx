import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollRegion } from './scroll-region.js';
import { resolveScrollSpy, useScrollSpy } from './use-scroll-spy.js';

const sectionTops: Record<string, number> = {};
let viewportBox = { top: 100, scrollTop: 0, scrollHeight: 1000, clientHeight: 200 };

function stubLayout(viewport: HTMLElement) {
  Object.defineProperties(viewport, {
    scrollTop: { configurable: true, get: () => viewportBox.scrollTop },
    scrollHeight: { configurable: true, get: () => viewportBox.scrollHeight },
    clientHeight: { configurable: true, get: () => viewportBox.clientHeight },
  });
  viewport.getBoundingClientRect = () => ({ top: viewportBox.top }) as DOMRect;
  for (const section of viewport.querySelectorAll<HTMLElement>('section')) {
    section.getBoundingClientRect = () =>
      ({ top: (sectionTops[section.id] ?? 0) - viewportBox.scrollTop }) as DOMRect;
  }
}

function Contents({ ids, offset }: { ids: readonly string[]; offset?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useScrollSpy(ref, { ids, offset });
  return (
    <>
      <nav aria-label="Contents">{active ?? 'none'}</nav>
      <ScrollRegion ref={ref} id="chapters">
        {['apples', 'pears', 'plums'].map((id) => (
          <section key={id} id={id}>
            {id}
          </section>
        ))}
      </ScrollRegion>
    </>
  );
}

function toc() {
  return screen.getByRole('navigation', { name: 'Contents' });
}

afterEach(() => {
  viewportBox = { top: 100, scrollTop: 0, scrollHeight: 1000, clientHeight: 200 };
  vi.unstubAllGlobals();
});

describe('useScrollSpy', () => {
  it('UIC-SCROLL-REGION-4.5 reports the last section whose top reached the viewport top', () => {
    Object.assign(sectionTops, { apples: 100, pears: 400, plums: 700 });
    const { rerender } = render(<Contents ids={['apples', 'pears', 'plums']} />);
    const viewport = document.getElementById('chapters')!;
    stubLayout(viewport);
    fireEvent.scroll(viewport);
    expect(toc()).toHaveTextContent('apples');
    viewportBox.scrollTop = 300;
    fireEvent.scroll(viewport);
    expect(toc()).toHaveTextContent('pears');
    viewportBox.scrollTop = 250;
    fireEvent.scroll(viewport);
    expect(toc()).toHaveTextContent('apples');
    rerender(<Contents ids={['apples', 'pears', 'plums']} offset={60} />);
    expect(toc()).toHaveTextContent('pears');
    viewportBox.scrollTop = 800;
    fireEvent.scroll(viewport);
    expect(toc()).toHaveTextContent('plums');
  });

  it('UIC-SCROLL-REGION-4.5 starts at the first section and skips missing ids', () => {
    Object.assign(sectionTops, { apples: 300, pears: 600, plums: 900 });
    render(<Contents ids={['missing', 'apples', 'pears']} />);
    const viewport = document.getElementById('chapters')!;
    stubLayout(viewport);
    fireEvent.scroll(viewport);
    expect(toc()).toHaveTextContent('apples');
    expect(resolveScrollSpy(viewport, { ids: ['missing'] })).toBeUndefined();
    viewportBox.scrollHeight = 200;
    expect(resolveScrollSpy(viewport, { ids: ['apples', 'pears'] })).toBe('apples');
  });

  it('UIC-SCROLL-REGION-4.5 follows viewport resizes', () => {
    const callbacks: Array<() => void> = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    Object.assign(sectionTops, { apples: 100, pears: 400, plums: 700 });
    render(<Contents ids={['apples', 'pears', 'plums']} />);
    const viewport = document.getElementById('chapters')!;
    stubLayout(viewport);
    viewportBox.top = 400;
    act(() => callbacks.forEach((callback) => callback()));
    expect(toc()).toHaveTextContent('pears');
  });
});
