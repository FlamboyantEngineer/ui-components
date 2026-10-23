import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { MediaViewer, type MediaViewerItem, type MediaViewerProps } from './media-viewer.js';

const items: MediaViewerItem[] = [
  {
    id: 'harbour',
    src: '/media/harbour.jpg',
    name: 'Harbour.jpg',
    type: 'image/jpeg',
    caption: 'Boats at dawn',
    thumbnailUrl: '/media/harbour-small.jpg',
    downloadUrl: '/media/harbour.jpg',
  },
  { id: 'bridge', src: '/media/bridge.png', name: 'Bridge.png', alt: 'A stone bridge' },
  { id: 'guide', src: '/media/guide.pdf', name: 'Guide.pdf', type: 'application/pdf' },
];

function Viewer(props: Partial<MediaViewerProps>) {
  return <MediaViewer items={items} isOpen {...props} />;
}

function title() {
  return document.querySelector('.ui-modal__title')?.textContent;
}

/** Reports the viewport's client size to the stage, as a browser would. */
function stubViewportSize(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(height);
  class ReportingObserver {
    constructor(readonly callback: ResizeObserverCallback) {}
    observe(element: Element) {
      const entry = { target: element, contentRect: { width, height } };
      this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ReportingObserver);
}

/** Loads the shown image with its own size. */
function loadImage(width: number, height: number) {
  const image = document.querySelector<HTMLImageElement>('.ui-media-viewer__image');
  if (!image) throw new Error('no image');
  Object.defineProperty(image, 'naturalWidth', { value: width, configurable: true });
  Object.defineProperty(image, 'naturalHeight', { value: height, configurable: true });
  fireEvent.load(image);
  return image;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('MediaViewer', () => {
  it('UIC-MEDIA-VIEWER-1.2 UIC-MEDIA-VIEWER-1.3 keeps numeric and text thumbnail identities and selections', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const typedItems = [
      { id: 1, name: 'Numeric image', src: '/numeric.png' },
      { id: '1', name: 'Text image', src: '/text.png' },
    ];
    const { rerender } = render(
      <Viewer items={typedItems} onSelectionChange={onSelectionChange} />,
    );
    const numeric = screen.getByRole('button', { name: 'Numeric image' });
    const text = screen.getByRole('button', { name: 'Text image' });
    rerender(<Viewer items={[...typedItems].reverse()} onSelectionChange={onSelectionChange} />);
    expect(screen.getByRole('button', { name: 'Numeric image' })).toBe(numeric);
    expect(screen.getByRole('button', { name: 'Text image' })).toBe(text);
    await user.click(text);
    expect(title()).toBe('Text image');
    await user.click(numeric);
    expect(title()).toBe('Numeric image');
    expect(onSelectionChange.mock.calls).toEqual([['1'], [1]]);
  });
  it('UIC-MEDIA-VIEWER-1.1 opens a full-size modal titled by the item, with its caption', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Viewer onOpenChange={onOpenChange} data-test="viewer" className="extra" />);
    const dialog = screen.getByRole('dialog', { name: 'Harbour.jpg' });
    expect(dialog).toHaveAccessibleDescription('Boats at dawn');
    const root = document.querySelector('.ui-media-viewer');
    expect(root).toHaveClass('ui-modal', 'extra');
    expect(root).toHaveAttribute('data-size', 'full');
    expect(root).toHaveAttribute('data-body-layout', 'column');
    expect(root).toHaveAttribute('data-test', 'viewer');
    expect(document.querySelector('.ui-modal__actions')).toBeNull();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expectHooksMatchSpec(document.body, 'MEDIA-VIEWER', { callerAttributes: ['data-test'] });
  });

  it('UIC-MEDIA-VIEWER-1.1 renders nothing without items', () => {
    render(<MediaViewer items={[]} isOpen />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-MEDIA-VIEWER-1.2 moves through the set with the previous and next buttons', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Viewer defaultSelectedKey="bridge" onSelectionChange={onSelectionChange} />);
    const counter = document.querySelector('.ui-media-viewer__counter');
    expect(counter).toHaveTextContent('2 of 3');
    expect(counter).toHaveAttribute('aria-live', 'polite');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith('guide');
    expect(title()).toBe('Guide.pdf');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(title()).toBe('Harbour.jpg');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(
      document.querySelector('.ui-media-viewer__previous [data-glyph="chevron-left"]'),
    ).not.toBeNull();
  });

  it('UIC-MEDIA-VIEWER-1.2 follows a controlled key and hides the set controls for one item', () => {
    const { rerender } = render(<Viewer selectedKey="guide" />);
    expect(title()).toBe('Guide.pdf');
    rerender(<MediaViewer items={[items[0] as MediaViewerItem]} isOpen />);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(document.querySelector('.ui-media-viewer__counter')).toBeNull();
    expect(document.querySelector('.ui-media-viewer__thumbnails')).toBeNull();
  });

  it('UIC-MEDIA-VIEWER-1.3 shows a thumbnail per item and moves to a pressed one', async () => {
    const user = userEvent.setup();
    render(<Viewer />);
    const strip = screen.getByRole('group', { name: 'Thumbnails' });
    const buttons = within(strip).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Harbour.jpg',
      'Bridge.png',
      'Guide.pdf',
    ]);
    expect(buttons[0]).toHaveAttribute('aria-current', 'true');
    expect(buttons[0]?.querySelector('img')).toHaveAttribute('src', '/media/harbour-small.jpg');
    expect(buttons[1]?.querySelector('img')).toHaveAttribute('src', '/media/bridge.png');
    expect(buttons[2]?.querySelector('[data-glyph="file"]')).not.toBeNull();
    await user.click(buttons[2] as HTMLElement);
    expect(title()).toBe('Guide.pdf');
    expect(buttons[2]).toHaveAttribute('aria-current', 'true');
    expect(buttons[0]).not.toHaveAttribute('aria-current');
    expectHooksMatchSpec(document.body, 'MEDIA-VIEWER', {
      slots: ['thumbnails', 'thumbnail', 'thumbnail-image', 'thumbnail-icon'],
    });
  });

  it('UIC-MEDIA-VIEWER-1.4 moves with the arrow keys and zooms with + and -', async () => {
    const user = userEvent.setup();
    render(<Viewer />);
    const zoomValue = () => document.querySelector('.ui-zoom-control__value')?.textContent;
    await user.keyboard('+');
    expect(zoomValue()).toBe('125%');
    await user.keyboard('--');
    expect(zoomValue()).toBe('75%');
    await user.keyboard('{ArrowRight}');
    expect(title()).toBe('Bridge.png');
    await user.keyboard('{ArrowLeft}');
    expect(title()).toBe('Harbour.jpg');
  });

  it('UIC-MEDIA-VIEWER-1.4 mirrors the arrow keys right to left', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="ar-EG">
        <Viewer />
      </UiProvider>,
    );
    await user.keyboard('{ArrowLeft}');
    expect(title()).toBe('Bridge.png');
  });

  it('UIC-MEDIA-VIEWER-2.1 fits the loaded image in the viewport and zooms it in a scrolling canvas', async () => {
    const user = userEvent.setup();
    stubViewportSize(800, 600);
    render(<Viewer />);
    const image = loadImage(2000, 1000);
    expect(image.style.width).toBe('800px');
    expect(image.style.height).toBe('400px');
    expect(image.style.position).toBe('absolute');
    const canvas = document.querySelector<HTMLElement>('.ui-media-viewer__canvas');
    expect(canvas?.style.width).toBe('800px');
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(canvas?.style.width).toBe('1000px');
    expect(canvas?.style.height).toBe('500px');
    expect(document.querySelector('.ui-media-viewer__zoom')).toHaveClass('ui-zoom-control');
    expectHooksMatchSpec(document.body, 'MEDIA-VIEWER', {
      slots: ['stage', 'viewport', 'canvas', 'image', 'zoom', 'rotate', 'download'],
    });
  });

  it('UIC-MEDIA-VIEWER-2.2 turns the image a quarter turn and fits it by its turned size', async () => {
    const user = userEvent.setup();
    stubViewportSize(800, 600);
    render(<Viewer />);
    const image = loadImage(2000, 1000);
    const rotate = screen.getByRole('button', { name: 'Rotate clockwise' });
    expect(rotate.querySelector('[data-glyph="rotate"]')).not.toBeNull();
    await user.click(rotate);
    expect(image.style.transform).toContain('rotate(90deg)');
    expect(image.style.width).toBe('600px');
    const canvas = document.querySelector<HTMLElement>('.ui-media-viewer__canvas');
    expect(canvas?.style.width).toBe('300px');
    expect(canvas?.style.height).toBe('600px');
  });

  it('UIC-MEDIA-VIEWER-2.3 shows each item at 100% and unturned', async () => {
    const user = userEvent.setup();
    render(<Viewer />);
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Rotate clockwise' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(document.querySelector('.ui-zoom-control__value')).toHaveTextContent('100%');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(document.querySelector('.ui-zoom-control__value')).toHaveTextContent('100%');
  });

  it('UIC-MEDIA-VIEWER-3.1 renders other files through renderItem, without zoom or rotate', () => {
    render(
      <Viewer
        defaultSelectedKey="guide"
        renderItem={(item) => <iframe title={item.name} src={item.src} />}
      />,
    );
    const stage = document.querySelector('.ui-media-viewer__stage');
    expect(stage).toHaveAttribute('data-kind', 'file');
    expect(stage?.querySelector('.ui-media-viewer__content iframe')).toHaveAttribute(
      'title',
      'Guide.pdf',
    );
    expect(document.querySelector('.ui-media-viewer__zoom')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rotate clockwise' })).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'MEDIA-VIEWER', { slots: ['content'] });
  });

  it('UIC-MEDIA-VIEWER-3.2 falls back to the type glyph and a message', () => {
    render(<Viewer defaultSelectedKey="guide" renderItem={() => null} />);
    const fallback = document.querySelector('.ui-media-viewer__fallback');
    expect(fallback).toHaveTextContent('No preview is available for this file.');
    expect(
      fallback?.querySelector('.ui-media-viewer__fallback-icon [data-glyph="file"]'),
    ).not.toBeNull();
    expectHooksMatchSpec(document.body, 'MEDIA-VIEWER', { slots: ['fallback', 'fallback-icon'] });
  });

  it('UIC-MEDIA-VIEWER-4.1 focuses the named viewport on open and names images by their text', () => {
    const { rerender } = render(<Viewer />);
    const viewport = screen.getByRole('group', { name: 'Harbour.jpg, viewer' });
    expect(viewport).toHaveClass('ui-media-viewer__viewport');
    expect(viewport).toHaveFocus();
    expect(screen.getByRole('img', { name: 'Harbour.jpg' })).toHaveClass('ui-media-viewer__image');
    rerender(<Viewer selectedKey="bridge" />);
    expect(screen.getByRole('img', { name: 'A stone bridge' })).toBeInTheDocument();
  });

  it('UIC-MEDIA-VIEWER-4.2 offers a Download link for an item with a download URL', () => {
    const { rerender } = render(<Viewer />);
    const link = screen.getByRole('link', { name: 'Download Harbour.jpg' });
    expect(link).toHaveClass('ui-media-viewer__download', 'ui-link');
    expect(link).toHaveAttribute('href', '/media/harbour.jpg');
    expect(link).toHaveAttribute('download', 'Harbour.jpg');
    rerender(<Viewer selectedKey="bridge" />);
    expect(screen.queryByRole('link', { name: /Download/ })).not.toBeInTheDocument();
  });

  it('UIC-MEDIA-VIEWER-4.3 carries its hooks and the caller attributes', () => {
    render(<Viewer id="viewer" data-test="viewer" />);
    expect(document.querySelector('.ui-media-viewer')).toHaveAttribute('data-test', 'viewer');
    expect(document.querySelector('.ui-media-viewer__stage')).toHaveAttribute('data-kind', 'image');
    expectHooksMatchSpec(document.body, 'MEDIA-VIEWER', {
      callerAttributes: ['data-test'],
      slots: ['stage', 'previous', 'next', 'viewport', 'canvas', 'image', 'counter'],
    });
  });
});
