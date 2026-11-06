import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Image } from './image.js';

const root = (container: HTMLElement) => container.querySelector<HTMLElement>('.ui-image');
const img = (container: HTMLElement) => container.querySelector<HTMLImageElement>('img');

function fail(container: HTMLElement) {
  fireEvent.error(img(container) as HTMLImageElement);
}

describe('Image', () => {
  it('UIC-IMAGE-1.1 UIC-IMAGE-1.2 hands the native attributes to an img named by alt', () => {
    const { container } = render(
      <Image
        src="/photo.jpg"
        srcSet="/photo-2x.jpg 2x"
        sizes="(max-width: 600px) 100vw, 600px"
        loading="lazy"
        decoding="async"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        width={600}
        height={400}
        alt="A lake at dawn"
      />,
    );
    const image = screen.getByRole('img', { name: 'A lake at dawn' });
    expect(image.tagName).toBe('IMG');
    expect(image).toHaveClass('ui-image__img');
    for (const [name, value] of Object.entries({
      src: '/photo.jpg',
      srcset: '/photo-2x.jpg 2x',
      sizes: '(max-width: 600px) 100vw, 600px',
      loading: 'lazy',
      decoding: 'async',
      crossorigin: 'anonymous',
      referrerpolicy: 'no-referrer',
      width: '600',
      height: '400',
    })) {
      expect(image).toHaveAttribute(name, value);
    }
    expect(root(container)?.tagName).toBe('SPAN');
    expectHooksMatchSpec(container, 'IMAGE', { slots: ['img'] });
  });

  it('UIC-IMAGE-1.2 marks an image with empty alt decorative, its fallback too', () => {
    const { container } = render(<Image src="/pattern.png" alt="" fallback="▦" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(img(container)).toHaveAttribute('alt', '');
    fail(container);
    expect(container.querySelector('.ui-image__fallback')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('UIC-IMAGE-1.3 publishes and reports each loading status', () => {
    const statuses = vi.fn();
    const { container } = render(
      <Image src="/photo.jpg" alt="Photo" onLoadingStatusChange={statuses} />,
    );
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    fireEvent.load(img(container) as HTMLImageElement);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
    expect(statuses.mock.calls).toEqual([['loading'], ['loaded']]);
    const blank = vi.fn();
    const { container: empty } = render(
      <Image src="  " alt="Missing" onLoadingStatusChange={blank} />,
    );
    expect(root(empty)).toHaveAttribute('data-status', 'error');
    expect(img(empty)).toBeNull();
    expect(blank.mock.calls).toEqual([['error']]);
  });

  it('UIC-IMAGE-1.4 shows the placeholder only while loading', () => {
    const { container, rerender } = render(
      <Image src="/photo.jpg" alt="Photo" placeholder={<span>Loading</span>} />,
    );
    const placeholder = container.querySelector('.ui-image__placeholder');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expectHooksMatchSpec(container, 'IMAGE', { slots: ['img', 'placeholder'] });
    fireEvent.load(img(container) as HTMLImageElement);
    expect(container.querySelector('.ui-image__placeholder')).toBeNull();
    rerender(<Image src="/other.jpg" alt="Photo" placeholder={null} />);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    expect(container.querySelector('.ui-image__placeholder')).toBeNull();
  });

  it('UIC-IMAGE-1.5 reserves the box and publishes its measured properties', () => {
    const { container, rerender } = render(
      <Image src="/photo.jpg" alt="Photo" width={320} height={180} />,
    );
    const element = root(container);
    expect(element?.style.getPropertyValue('--ui-image-width')).toBe('320px');
    expect(element?.style.getPropertyValue('--ui-image-height')).toBe('180px');
    fail(container);
    expect(element?.style.getPropertyValue('--ui-image-width')).toBe('320px');
    rerender(<Image src="/photo.jpg" alt="Photo" width={Number.NaN} />);
    expect(element?.style.getPropertyValue('--ui-image-width')).toBe('');
    expectHooksMatchSpec(container, 'IMAGE');
  });

  it('UIC-IMAGE-1.6 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLSpanElement | null };
    const { container } = render(
      <Image
        ref={ref}
        id="hero"
        className="caller"
        data-probe="image"
        data-status="caller"
        src="/photo.jpg"
        alt="Photo"
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-image', 'caller');
    expect(element).toHaveAttribute('id', 'hero');
    expect(element).toHaveAttribute('data-probe', 'image');
    expect(element).toHaveAttribute('data-status', 'loading');
    expect(ref.current).toBe(element);
    expectHooksMatchSpec(container, 'IMAGE', { callerAttributes: ['data-probe'] });
  });

  it('UIC-IMAGE-2.1 counts an image the browser already loaded or failed', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64);
    const { container } = render(<Image src="/cached.jpg" alt="Cached" />);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
    // jsdom cannot decode, so a complete image without data counts as failed at once.
    width.mockReturnValue(0);
    const { container: broken } = render(<Image src="/broken.jpg" alt="Broken" />);
    expect(root(broken)).toHaveAttribute('data-status', 'error');
    complete.mockRestore();
    width.mockRestore();
  });

  it('UIC-IMAGE-2.1 keeps a lazy image the browser has not fetched loading', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
    const { container } = render(<Image src="/later.jpg" alt="Later" loading="lazy" />);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    complete.mockRestore();
  });

  it('UIC-IMAGE-2.1 settles an image that loaded before hydration', async () => {
    const element = <Image src="/server.jpg" alt="Server" width={10} height={10} />;
    const host = document.createElement('div');
    host.innerHTML = renderToString(element);
    document.body.append(host);
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(10);
    const errors = vi.fn();
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, element, { onRecoverableError: errors });
      await Promise.resolve();
    });
    expect(errors).not.toHaveBeenCalled();
    expect(host.querySelector('.ui-image')).toHaveAttribute('data-status', 'loaded');
    act(() => app?.unmount());
    host.remove();
    complete.mockRestore();
    width.mockRestore();
  });

  it('UIC-IMAGE-2.2 starts a new request for a new source or candidate set, ignoring old events', () => {
    const { container, rerender } = render(<Image src="/one.jpg" alt="Photo" />);
    fail(container);
    expect(root(container)).toHaveAttribute('data-status', 'error');
    rerender(<Image src="/two.jpg" alt="Photo" />);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    const second = img(container) as HTMLImageElement;
    fireEvent.load(second);
    rerender(<Image src="/two.jpg" alt="Photo" srcSet="/two-2x.jpg 2x" />);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    const third = img(container) as HTMLImageElement;
    expect(third).not.toBe(second);
    fireEvent.error(second);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    rerender(<Image src="/two.jpg" alt="Photo" srcSet="/two-2x.jpg 2x" />);
    expect(img(container)).toBe(third);
  });

  it('UIC-IMAGE-2.3 tries the backup address once and never loops', () => {
    const statuses = vi.fn();
    const { container } = render(
      <Image
        src="/gone.jpg"
        srcSet="/gone-2x.jpg 2x"
        fallbackSrc="/backup.jpg"
        alt="Photo"
        onLoadingStatusChange={statuses}
      />,
    );
    fail(container);
    const backup = img(container) as HTMLImageElement;
    expect(backup).toHaveAttribute('src', '/backup.jpg');
    expect(backup).not.toHaveAttribute('srcset');
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    fireEvent.error(backup);
    expect(root(container)).toHaveAttribute('data-status', 'error');
    expect(img(container)).toBeNull();
    expect(statuses.mock.calls).toEqual([['loading'], ['error']]);
  });

  it('UIC-IMAGE-2.3 requests the backup for a blank source', () => {
    const { container } = render(<Image src="" fallbackSrc="/backup.jpg" alt="Photo" />);
    expect(img(container)).toHaveAttribute('src', '/backup.jpg');
  });

  it('UIC-IMAGE-2.4 names the fallback by alt once, without its content', () => {
    const { container } = render(
      <Image src="/gone.jpg" alt="Team photo" fallback={<span>No photo</span>} />,
    );
    fail(container);
    const fallback = screen.getByRole('img', { name: 'Team photo' });
    expect(fallback).toHaveClass('ui-image__fallback');
    expect(fallback).toHaveTextContent('No photo');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expectHooksMatchSpec(container, 'IMAGE', { slots: ['fallback'] });
  });

  it('UIC-IMAGE-2.5 retries a failed image from its source with a fresh img', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Image src="/flaky.jpg" fallbackSrc="/backup.jpg" alt="Chart" showRetry />,
    );
    const first = img(container) as HTMLImageElement;
    fireEvent.error(first);
    fail(container);
    expect(screen.getByRole('img', { name: 'Chart' })).toHaveClass('ui-image__fallback');
    const retry = screen.getByRole('button', { name: 'Reload image' });
    expect(retry).toHaveClass('ui-image__retry');
    expectHooksMatchSpec(container, 'IMAGE', { slots: ['fallback', 'retry'] });
    await user.click(retry);
    const again = img(container) as HTMLImageElement;
    expect(again).toHaveAttribute('src', '/flaky.jpg');
    expect(again).not.toBe(first);
    expect(root(container)).toHaveAttribute('data-status', 'loading');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    fireEvent.load(again);
    expect(root(container)).toHaveAttribute('data-status', 'loaded');
  });

  it('UIC-IMAGE-2.5 offers no retry unless asked', () => {
    const { container } = render(<Image src="/gone.jpg" alt="Photo" />);
    fail(container);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
