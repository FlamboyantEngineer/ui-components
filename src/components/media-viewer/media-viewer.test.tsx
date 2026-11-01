import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
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
  it("UIC-MEDIA-VIEWER-1.3 reports no selection change for the shown item's thumbnail", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Viewer onSelectionChange={onSelectionChange} />);
    await user.click(screen.getByRole('button', { name: 'Harbour.jpg' }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Bridge.png' }));
    await user.click(screen.getByRole('button', { name: 'Bridge.png' }));
    expect(onSelectionChange.mock.calls).toEqual([['bridge']]);
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

  it('UIC-MEDIA-VIEWER-1.2 keeps the first item shown by id when items arrive, are added or reordered', () => {
    const onSelectionChange = vi.fn();
    const pick = (ids: string[]) =>
      ids.map((id) => requireDefined(items.find((item) => item.id === id)));
    const { rerender } = render(<Viewer items={[]} onSelectionChange={onSelectionChange} />);
    rerender(<Viewer items={pick(['harbour', 'bridge'])} onSelectionChange={onSelectionChange} />);
    expect(title()).toBe('Harbour.jpg');
    rerender(
      <Viewer items={pick(['guide', 'bridge', 'harbour'])} onSelectionChange={onSelectionChange} />,
    );
    expect(title()).toBe('Harbour.jpg');
    expect(onSelectionChange).not.toHaveBeenCalled();
    // Only when the shown item goes does the first item take its place.
    rerender(<Viewer items={pick(['guide', 'bridge'])} onSelectionChange={onSelectionChange} />);
    expect(title()).toBe('Guide.pdf');
    expect(onSelectionChange).not.toHaveBeenCalled();
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
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(title()).toBe('Harbour.jpg');
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      document.querySelector('.ui-media-viewer__previous [data-glyph="chevron-left"]'),
    ).not.toBeNull();
  });

  it('UIC-MEDIA-VIEWER-1.2 keeps focus on a button that reaches the end of the set', async () => {
    const user = userEvent.setup();
    render(<Viewer defaultSelectedKey="bridge" />);
    const next = screen.getByRole('button', { name: 'Next' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(title()).toBe('Guide.pdf');
    expect(next).toHaveFocus();
    expect(next).toBeEnabled();
    expect(next).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Enter}');
    expect(title()).toBe('Guide.pdf');
    await user.keyboard('{ArrowLeft}');
    expect(title()).toBe('Bridge.png');
  });

  it('UIC-MEDIA-VIEWER-1.2 points the previous and next chevrons the other way right to left', () => {
    render(
      <UiProvider locale="ar-EG">
        <Viewer defaultSelectedKey="bridge" />
      </UiProvider>,
    );
    expect(
      document.querySelector('.ui-media-viewer__previous [data-glyph="chevron-right"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('.ui-media-viewer__next [data-glyph="chevron-left"]'),
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

  it('UIC-MEDIA-VIEWER-1.3 shows the type glyph once a thumbnail fails', () => {
    render(<Viewer />);
    const strip = screen.getByRole('group', { name: 'Thumbnails' });
    const harbour = within(strip).getByRole('button', { name: 'Harbour.jpg' });
    const image = harbour.querySelector('img') as HTMLImageElement;
    expect(image).toHaveAttribute('loading', 'lazy');
    fireEvent.error(image);
    expect(harbour.querySelector('img')).toBeNull();
    expect(harbour.querySelector('[data-glyph="image"]')).toHaveClass(
      'ui-media-viewer__thumbnail-icon',
    );
  });

  it('UIC-MEDIA-VIEWER-1.4 moves with the arrow keys and zooms with + and -', async () => {
    const user = userEvent.setup();
    render(<Viewer />);
    const zoomValue = () => document.querySelector('.ui-zoom-control__value')?.textContent;
    loadImage(800, 600);
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

  describe('caller rendering per item', () => {
    const files: MediaViewerItem[] = [
      { id: 1, src: '/a.pdf', name: 'Numeric file', type: 'application/pdf' },
      { id: '1', src: '/b.pdf', name: 'Text file', type: 'application/pdf' },
      { id: 'c', src: '/c.pdf', name: 'Third file', type: 'application/pdf' },
    ];

    function Draft({ item }: { item: MediaViewerItem }) {
      const [draft, setDraft] = useState(item.name);
      return (
        <input
          aria-label={`Draft of ${String(item.id)}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      );
    }

    const renderDraft = (item: MediaViewerItem) => <Draft item={item} />;

    it('UIC-MEDIA-VIEWER-3.1 gives each typed id its own rendering state', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Viewer items={files} renderItem={renderDraft} />);
      const first = screen.getByRole('textbox', { name: 'Draft of 1' });
      await user.clear(first);
      await user.type(first, 'Changed');
      // A re-render and a change to the item's other fields keep the state.
      rerender(
        <Viewer
          items={[
            { ...requireDefined(files[0]), name: 'Renamed' },
            requireDefined(files[1]),
            requireDefined(files[2]),
          ]}
          renderItem={renderDraft}
        />,
      );
      expect(screen.getByRole('textbox', { name: 'Draft of 1' })).toHaveValue('Changed');
      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByRole('textbox', { name: 'Draft of 1' })).toHaveValue('Text file');
      await user.click(screen.getByRole('button', { name: 'Third file' }));
      expect(screen.getByRole('textbox')).toHaveValue('Third file');
      // Coming back renders the item afresh.
      await user.click(screen.getByRole('button', { name: 'Renamed' }));
      expect(screen.getByRole('textbox')).toHaveValue('Renamed');
      // A controlled selection and a reorder keep the rule.
      rerender(
        <Viewer
          items={[requireDefined(files[2]), requireDefined(files[1])]}
          selectedKey="1"
          renderItem={renderDraft}
        />,
      );
      expect(screen.getByRole('textbox')).toHaveValue('Text file');
    });

    it('UIC-MEDIA-VIEWER-3.1 keeps focus in the viewer when a key replaces the focused rendering', async () => {
      const user = userEvent.setup();
      render(
        <Viewer
          items={files}
          renderItem={(item) => <button type="button">Open {item.name}</button>}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'Open Numeric file' }));
      await user.keyboard('{PageDown}');
      expect(title()).toBe('Text file');
      expect(screen.getByRole('group', { name: /Text file/ })).toHaveFocus();
    });
  });

  describe('open state across an empty list', () => {
    it('UIC-MEDIA-VIEWER-1.1 keeps a closed viewer closed while its items empty and refill', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const viewer = (list: MediaViewerItem[]) => (
        <MediaViewer items={list} defaultOpen onOpenChange={onOpenChange} />
      );
      const { rerender } = render(viewer(items));
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(viewer([]));
      rerender(viewer(items.slice(0, 1)));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(onOpenChange.mock.calls).toEqual([[false]]);
    });

    it('UIC-MEDIA-VIEWER-1.1 shows an open viewer again when its items return, and waits for a first list', () => {
      const onOpenChange = vi.fn();
      const viewer = (list: MediaViewerItem[]) => (
        <MediaViewer items={list} defaultOpen onOpenChange={onOpenChange} />
      );
      const { rerender } = render(viewer([]));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(viewer(items));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      rerender(viewer([]));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(viewer(items));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
      // A controlled viewer follows its prop throughout.
      rerender(<MediaViewer items={[]} isOpen={false} />);
      rerender(<MediaViewer items={items} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('image loading', () => {
    function stage() {
      return document.querySelector('.ui-media-viewer__stage');
    }

    it('UIC-MEDIA-VIEWER-2.4 shows loading, disables image controls and enables them once loaded', async () => {
      const user = userEvent.setup();
      render(<Viewer />);
      expect(stage()).toHaveAttribute('data-status', 'loading');
      expect(document.querySelector('.ui-media-viewer__loading')).toHaveTextContent('Loading');
      expect(document.querySelector('.ui-media-viewer__loading')).toHaveAttribute('role', 'status');
      expect(screen.getByRole('button', { name: 'Rotate clockwise' })).toBeDisabled();
      await user.keyboard('+');
      expect(document.querySelector('.ui-zoom-control__value')).toHaveTextContent('100%');
      loadImage(800, 600);
      expect(stage()).toHaveAttribute('data-status', 'loaded');
      expect(document.querySelector('.ui-media-viewer__loading')).toBeNull();
      expect(screen.getByRole('button', { name: 'Rotate clockwise' })).toBeEnabled();
      expect(screen.getByRole('link', { name: /Download/ })).toBeInTheDocument();
    });

    it('UIC-MEDIA-VIEWER-2.4 shows a failure with Retry, reports it, and loads a fresh src', async () => {
      const user = userEvent.setup();
      const onImageError = vi.fn();
      const { rerender } = render(<Viewer onImageError={onImageError} />);
      fireEvent.error(document.querySelector('.ui-media-viewer__image') as HTMLImageElement);
      expect(stage()).toHaveAttribute('data-status', 'failed');
      expect(screen.getByRole('alert')).toHaveTextContent('“Harbour.jpg” could not be loaded.');
      expect(onImageError).toHaveBeenCalledWith(items[0]);
      expect(screen.getByRole('button', { name: 'Rotate clockwise' })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(stage()).toHaveAttribute('data-status', 'loading');
      // A response that decodes to nothing fails too.
      loadImage(0, 0);
      expect(stage()).toHaveAttribute('data-status', 'failed');
      rerender(
        <Viewer
          items={[
            { ...requireDefined(items[0]), src: '/media/harbour-fresh.jpg' },
            ...items.slice(1),
          ]}
          onImageError={onImageError}
        />,
      );
      expect(stage()).toHaveAttribute('data-status', 'loading');
      expect(loadImage(800, 600)).toHaveAttribute('src', '/media/harbour-fresh.jpg');
      expect(stage()).toHaveAttribute('data-status', 'loaded');
    });

    it('UIC-MEDIA-VIEWER-2.4 ignores a report from an image moved away from', async () => {
      const user = userEvent.setup();
      const onImageError = vi.fn();
      render(<Viewer onImageError={onImageError} />);
      const first = document.querySelector('.ui-media-viewer__image') as HTMLImageElement;
      await user.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.error(first);
      expect(onImageError).not.toHaveBeenCalled();
      expect(stage()).toHaveAttribute('data-status', 'loading');
      loadImage(400, 300);
      await user.click(screen.getByRole('button', { name: 'Previous' }));
      expect(stage()).toHaveAttribute('data-status', 'loading');
      loadImage(800, 600);
      expect(stage()).toHaveAttribute('data-status', 'loaded');
    });

    it('UIC-MEDIA-VIEWER-1.3 loads thumbnails lazily', () => {
      render(<Viewer />);
      const thumbnails = document.querySelectorAll('.ui-media-viewer__thumbnail-image');
      expect(thumbnails.length).toBeGreaterThan(0);
      for (const thumbnail of thumbnails) expect(thumbnail).toHaveAttribute('loading', 'lazy');
      expect(document.querySelector('.ui-media-viewer__image')).not.toHaveAttribute(
        'loading',
        'lazy',
      );
    });
  });
});
