import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createEngine, renderReady } from '../../../test/pdf-fixtures.js';

describe('PdfViewer pinch zoom', () => {
  it('UIC-PDF-VIEWER-3.6 scales the pages with a pinch, zooms when it ends and scrolls with a drag', async () => {
    const engine = createEngine();
    const onZoomChange = vi.fn();
    const { container, unmount } = await renderReady({ defaultZoom: 100, onZoomChange }, engine);
    const options = engine.touch.options;
    if (!options) throw new Error('no touch manager');
    expect(options.container).toBe(screen.getByRole('document'));
    const column = container.querySelector<HTMLElement>('.ui-pdf-viewer__pages')!;

    act(() => options.onPinching([30, 40], 100, 150));
    expect(column.style.transform).toBe('scale(1.5)');
    expect(column.style.transformOrigin).toBe('30px 40px');
    act(() => options.onPinching([30, 40], 150, 300));
    expect(column.style.transform).toBe('scale(3)');
    expect(onZoomChange).toHaveBeenLastCalledWith(100);
    act(() => options.onPinchEnd());
    expect(onZoomChange).toHaveBeenLastCalledWith(300);
    expect(column.style.transform).toBe('');

    act(() => {
      options.onPinching([0, 0], 100, 2000);
      options.onPinchEnd();
    });
    expect(onZoomChange).toHaveBeenLastCalledWith(1000);
    act(() => {
      options.onPinching([0, 0], 0, 150);
      options.onPinchEnd();
    });
    expect(onZoomChange).toHaveBeenLastCalledWith(1000);

    const scroller = screen.getByRole('document');
    scroller.scrollTop = 200;
    act(() => options.onPanning(0, 50));
    expect(scroller.scrollTop).toBe(150);

    const manager = engine.touchManagers[0];
    unmount();
    await waitFor(() => expect(manager?.destroy).toHaveBeenCalled());
    expect(options.signal.aborted).toBe(true);
  });

  it('UIC-PDF-VIEWER-3.6 drops an interrupted pinch and ignores callbacks from the closed document', async () => {
    const engine = createEngine();
    const onZoomChange = vi.fn();
    const view = await renderReady({ defaultZoom: 100, onZoomChange }, engine);
    const options = engine.touch.options!;
    const column = view.container.querySelector<HTMLElement>('.ui-pdf-viewer__pages')!;
    const scroller = screen.getByRole('document');
    scroller.scrollTop = 100;
    act(() => options.onPinching([30, 40], 100, 200));
    expect(column.style.transform).toBe('scale(2)');
    view.update({ source: null, defaultZoom: 100, onZoomChange });
    expect(options.signal.aborted).toBe(true);
    expect(column.style.transform).toBe('');
    expect(column.style.transformOrigin).toBe('');
    scroller.scrollTop = 100;
    act(() => {
      options.onPinching([30, 40], 100, 300);
      options.onPinchEnd();
      options.onPanning(0, 20);
    });
    expect(column.style.transform).toBe('');
    expect(scroller.scrollTop).toBe(100);
    expect(onZoomChange).toHaveBeenLastCalledWith(100);

    view.update({ source: '/files/Next.pdf', defaultZoom: 100, onZoomChange });
    await waitFor(() => expect(engine.touch.options).not.toBe(options));
    const next = engine.touch.options!;
    act(() => {
      next.onPinching([30, 40], 100, 150);
      next.onPinchEnd();
    });
    expect(onZoomChange).toHaveBeenLastCalledWith(150);
    act(() => next.onPinching([30, 40], 100, 200));
    const nextColumn = view.container.querySelector<HTMLElement>('.ui-pdf-viewer__pages')!;
    view.unmount();
    expect(nextColumn.style.transform).toBe('');
    expect(nextColumn.style.transformOrigin).toBe('');
  });
});
