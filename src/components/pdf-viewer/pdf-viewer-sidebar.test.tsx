import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  createEngine,
  holdDestinations,
  pageSize,
  renderReady,
  renderViewer,
  stubLayout,
} from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { PdfOutlineNode } from './pdf-engine.js';

const outline: PdfOutlineNode[] = [
  { title: 'Seasonal Report', dest: [{ num: 0, gen: 0 }, { name: 'Fit' }], url: null, items: [] },
  {
    title: 'Varieties',
    dest: null,
    url: null,
    count: 2,
    items: [
      { title: 'Apple', dest: [{ num: 1, gen: 0 }, { name: 'Fit' }], url: null, items: [] },
      { title: 'Orchard guide', dest: null, url: 'https://example.com/', items: [] },
    ],
  },
  {
    title: 'Markets',
    dest: 'markets',
    url: null,
    items: [{ title: 'Prices', dest: null, url: null, items: [] }],
  },
];

/** Reports every observed element in view and its content 96 pixels wide. */
function stubObservers() {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (callback: IntersectionObserverCallback) {
      return {
        observe: (target: Element) =>
          callback([{ target, isIntersecting: true } as IntersectionObserverEntry], {} as never),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    }),
  );
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(function (callback: ResizeObserverCallback) {
      return {
        observe: (target: Element) =>
          callback(
            [{ target, contentRect: { width: 96, height: 0 } } as unknown as ResizeObserverEntry],
            {} as never,
          ),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    }),
  );
}

describe('PdfViewer sidebar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-10.1 shows and hides the sidebar beside the pages', async () => {
    const engine = createEngine();
    const view = renderViewer({ source: null }, engine);
    const toggle = screen.getByRole('button', { name: 'Sidebar' });
    expect(toggle).toBeDisabled();
    view.update({ source: '/files/Report.pdf' });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(view.container.querySelector('.ui-pdf-viewer__sidebar')).toBeNull();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const sidebar = view.container.querySelector('.ui-pdf-viewer__sidebar');
    expect(sidebar?.parentElement).toHaveClass('ui-pdf-viewer__stage');
    expect(sidebar?.nextElementSibling).toHaveClass('ui-pdf-viewer__scroller');
    const tabs = within(screen.getByRole('tablist', { name: 'Sidebar' })).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Pages', 'Outline']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(toggle);
    expect(view.container.querySelector('.ui-pdf-viewer__sidebar')).toBeNull();
  });

  it('UIC-PDF-VIEWER-10.2 lists the pages as thumbnails and goes to the one chosen', async () => {
    stubLayout();
    stubObservers();
    const engine = createEngine();
    const { container } = await renderReady({ defaultZoom: 100, defaultSidebarOpen: true }, engine);
    const list = screen.getByRole('listbox', { name: 'Pages' });
    expect(list).toHaveClass('ui-pdf-viewer__thumbnails');
    const options = within(list).getAllByRole('option');
    expect(options.map((option) => option.getAttribute('aria-label'))).toEqual([
      'Page 1',
      'Page 2',
      'Page 3',
    ]);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(within(requireDefined(options[1])).getByText('2')).toHaveClass(
      'ui-pdf-viewer__thumbnail-label',
    );

    const canvas = requireDefined(
      requireDefined(options[1]).querySelector<HTMLCanvasElement>('canvas'),
    );
    expect(canvas).toHaveClass('ui-pdf-viewer__thumbnail-canvas');
    expect(canvas.style.width).toBe('96px');
    expect(Number.parseFloat(canvas.style.height)).toBeCloseTo(
      (96 * pageSize.height) / pageSize.width,
    );
    expect(canvas.width).toBe(96);
    await waitFor(() =>
      expect(engine.render).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas,
          viewport: expect.objectContaining({ scale: 96 / pageSize.width }),
        }),
      ),
    );
    expectHooksMatchSpec(container, 'PDF-VIEWER', {
      slots: ['sidebar', 'thumbnails', 'thumbnail', 'thumbnail-canvas', 'thumbnail-label'],
    });

    await userEvent.click(requireDefined(options[2]));
    expect(screen.getByRole('document').scrollTop).toBe(1600);
    expect(screen.getByLabelText('Page')).toHaveValue('3');
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-PDF-VIEWER-10.3 opens on the outline and follows its entries', async () => {
    stubLayout();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const engine = createEngine({
      outline,
      destinations: { markets: [{ num: 2, gen: 0 }, { name: 'Fit' }] },
    });
    const { container } = await renderReady({ defaultZoom: 100, defaultSidebarOpen: true }, engine);
    const tree = screen.getByRole('treegrid', { name: 'Outline' });
    expect(tree).toHaveClass('ui-tree', 'ui-pdf-viewer__outline');
    expect(
      within(tree)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['Seasonal Report', 'Varieties', 'Apple', 'Orchard guide', 'Markets']);
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['outline'] });

    const scroller = screen.getByRole('document');
    await userEvent.click(within(tree).getByRole('row', { name: 'Markets' }));
    await waitFor(() => expect(scroller.scrollTop).toBe(1600));
    await userEvent.click(within(tree).getByRole('row', { name: 'Apple' }));
    await waitFor(() => expect(scroller.scrollTop).toBe(800));
    await userEvent.click(within(tree).getByRole('row', { name: 'Orchard guide' }));
    expect(open).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer');
    await userEvent.click(within(tree).getByRole('row', { name: 'Varieties' }));
    expect(scroller.scrollTop).toBe(800);
  });

  it('UIC-PDF-VIEWER-10.3 follows the latest outline entry when an earlier lookup finishes last', async () => {
    stubLayout();
    const engine = createEngine({ outline });
    const lookups = holdDestinations(engine);
    await renderReady({ defaultZoom: 100, defaultSidebarOpen: true }, engine);
    const tree = screen.getByRole('treegrid', { name: 'Outline' });
    const scroller = screen.getByRole('document');

    await userEvent.click(within(tree).getByRole('row', { name: 'Markets' }));
    await userEvent.click(within(tree).getByRole('row', { name: 'Apple' }));
    await waitFor(() => expect(scroller.scrollTop).toBe(800));
    await lookups.settle('markets', [{ num: 2, gen: 0 }, { name: 'Fit' }]);
    expect(scroller.scrollTop).toBe(800);
  });
});
