import { screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  createEngine,
  pointsToPixels,
  renderReady,
  stubLayout,
  type TestLink,
} from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';

const links: Record<number, TestLink[]> = {
  0: [
    { rect: [46, 388, 202, 404], dest: 'markets' },
    { rect: [46, 366, 205, 382], url: 'https://example.com/' },
    { rect: [46, 344, 205, 360], action: 'NextPage' },
  ],
};

describe('PdfViewer links', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-PDF-VIEWER-2.4 builds the engine annotation layer of the page links over the text', async () => {
    const engine = createEngine({ links });
    const { container } = await renderReady({ defaultZoom: 100 }, engine);
    const layers = container.querySelectorAll<HTMLElement>('.ui-pdf-viewer__annotation-layer');
    expect(layers).toHaveLength(3);
    const first = requireDefined(layers[0]);
    expect(first.previousElementSibling).toHaveClass('ui-pdf-viewer__text-layer');
    expect(first.style).toMatchObject({
      position: 'absolute',
      inset: '0px',
      pointerEvents: 'none',
    });
    // Only the links: the page's note shows as the bitmap draws it.
    await waitFor(() => expect(within(first).getAllByRole('link')).toHaveLength(3));
    expect(engine.AnnotationLayer).toHaveBeenCalledTimes(1);
    expect(engine.AnnotationLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        div: first,
        viewport: expect.objectContaining({ scale: pointsToPixels }),
        structTreeLayer: null,
      }),
    );
    expect(layers[1]?.childElementCount).toBe(0);
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['annotation-layer'] });
  });

  it('UIC-PDF-VIEWER-2.4 opens web links in a new tab and follows the others in the viewer', async () => {
    stubLayout();
    const engine = createEngine({
      links,
      destinations: { markets: [{ num: 2, gen: 0 }, { name: 'Fit' }] },
    });
    await renderReady({ defaultZoom: 100 }, engine);
    const web = await screen.findByRole('link', { name: 'https://example.com/' });
    expect(web).toHaveAttribute('target', '_blank');
    expect(web).toHaveAttribute('rel', 'noopener noreferrer nofollow');

    // The host stylesheet gives links the pointer the layer passes through.
    const press = userEvent.setup({ pointerEventsCheck: 0 });
    const scroller = screen.getByRole('document');
    await press.click(screen.getByRole('link', { name: 'markets' }));
    await waitFor(() => expect(scroller.scrollTop).toBe(1600));
    expect(screen.getByLabelText('Page')).toHaveValue('3');

    await press.click(screen.getByRole('button', { name: 'Previous page' }));
    await press.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(scroller.scrollTop).toBe(0);
    await press.click(screen.getByRole('link', { name: 'NextPage' }));
    expect(scroller.scrollTop).toBe(800);
  });
});
