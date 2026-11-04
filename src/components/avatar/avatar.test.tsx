import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { Avatar, getDisplayName, splitAvatarIdentity } from './avatar.js';
import { DEFAULT_AVATAR_COLOR_COUNT, resolveAvatarColor } from './avatar-color.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('Avatar', () => {
  it('UIC-AVATAR-1.1 draws the picture with an empty alt, or the initials without one', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" src=" /maria.png " />);
    const image = container.querySelector('img');
    expect(image).toHaveClass('ui-avatar__image');
    expect(image).toHaveAttribute('src', '/maria.png');
    expect(image).toHaveAttribute('alt', '');
    expect(container.querySelector('.ui-avatar__initials')).toBeNull();
    expect(root(container)).toHaveAttribute('data-kind', 'person');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['image'] });

    rerender(<Avatar name="Maria Santos" src="   " />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('MS');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['initials'] });
  });

  it('UIC-AVATAR-1.1 draws the group glyph for a group, ignoring picture and initials', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'fill'] as const) {
      for (const variant of ['filled', 'outlined'] as const) {
        const { container, unmount } = render(
          <Avatar
            kind="group"
            name="Design team"
            src="/team.png"
            initials="DT"
            size={size}
            variant={variant}
          />,
        );
        const glyph = container.querySelector('svg');
        expect(glyph).toHaveClass('ui-glyph', 'ui-avatar__glyph');
        expect(glyph).toHaveAttribute('data-glyph', 'users');
        expect(glyph).toHaveAttribute('aria-hidden', 'true');
        expect(container.querySelector('img, .ui-avatar__initials')).toBeNull();
        expect(root(container)).toHaveAttribute('data-kind', 'group');
        expectHooksMatchSpec(container, 'AVATAR', { slots: ['glyph'] });
        unmount();
      }
    }
  });

  it('UIC-AVATAR-1.2 derives initials from the name unless explicit initials are given', () => {
    const { container, rerender } = render(<Avatar name="jon berg" />);
    const initials = () => container.querySelector('.ui-avatar__initials')?.textContent;
    expect(initials()).toBe('JB');
    rerender(<Avatar name="Plato" />);
    expect(initials()).toBe('PL');
    rerender(<Avatar name="Jon Berg" initials=" XY " />);
    expect(initials()).toBe('XY');
    rerender(<Avatar name="Jon Berg" initials="  " />);
    expect(initials()).toBe('JB');
    rerender(<Avatar name="   " />);
    expect(initials()).toBe('?');
    rerender(<Avatar name="Assistant" initials="AI" />);
    expect(initials()).toBe('AI');
  });

  it('UIC-AVATAR-1.3 publishes a stable colour slot from the key, never an inline colour', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" />);
    expect(root(container)).toHaveAttribute(
      'data-color',
      String(getColorIndex('Maria Santos', DEFAULT_AVATAR_COLOR_COUNT)),
    );
    expect(container.querySelector('[style]')).toBeNull();

    const expected = String(getColorIndex('user-42', 8));
    for (const name of ['Maria Santos', 'Maria Oliveira']) {
      rerender(<Avatar name={name} colorKey="user-42" />);
      expect(root(container)).toHaveAttribute('data-color', expected);
    }
    rerender(<Avatar name="Maria Santos" colorKey="  " />);
    expect(root(container)).toHaveAttribute('data-color', String(getColorIndex('Maria Santos', 8)));
    rerender(<Avatar name="Maria Santos" colorKey="user-42" colorCount={50} />);
    expect(root(container)).toHaveAttribute('data-color', String(getColorIndex('user-42', 50)));
    rerender(<Avatar name="Maria Santos" colorCount={0} />);
    expect(root(container)).toHaveAttribute(
      'data-color',
      String(getColorIndex('Maria Santos', DEFAULT_AVATAR_COLOR_COUNT)),
    );
    expectHooksMatchSpec(container, 'AVATAR');
  });

  it('UIC-AVATAR-1.3 wraps an explicit slot into the palette and leaves groups neutral', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" colorIndex={3} />);
    expect(root(container)).toHaveAttribute('data-color', '3');
    rerender(<Avatar name="Maria Santos" colorIndex={11.7} colorCount={8} />);
    expect(root(container)).toHaveAttribute('data-color', '3');
    rerender(<Avatar name="Maria Santos" colorIndex={-1} colorCount={8} />);
    expect(root(container)).toHaveAttribute('data-color', '7');
    rerender(<Avatar name="Maria Santos" colorIndex={Number.NaN} colorKey="apple" />);
    expect(root(container)).toHaveAttribute('data-color', String(getColorIndex('apple', 8)));
    rerender(<Avatar kind="group" name="Design team" />);
    expect(root(container)).not.toHaveAttribute('data-color');
    rerender(<Avatar kind="group" name="Design team" colorIndex={2} />);
    expect(root(container)).toHaveAttribute('data-color', '2');
    expect(resolveAvatarColor({ name: 'Design team', kind: 'group' })).toBeUndefined();
    expect(resolveAvatarColor({ name: 'x', colorIndex: 9 }, 4)).toBe(1);
  });

  it('UIC-AVATAR-1.4 falls back to the initials when the picture fails and retries a new address', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" src="/gone.png" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('MS');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['initials'] });

    rerender(<Avatar name="Maria Santos" src="/gone.png" size="lg" />);
    expect(container.querySelector('img')).toBeNull();

    rerender(<Avatar name="Maria Santos" src="/new.png" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/new.png');
  });

  it('UIC-AVATAR-1.5 reports the loading status once per change and marks the root while loading', () => {
    const statuses: string[] = [];
    const onLoadingStatusChange = (status: string) => statuses.push(status);
    const { container, rerender } = render(
      <StrictMode>
        <Avatar
          name="Maria Santos"
          src="/maria.png"
          onLoadingStatusChange={onLoadingStatusChange}
        />
      </StrictMode>,
    );
    const avatar = (src?: string, kind?: 'group') => (
      <StrictMode>
        <Avatar
          name="Maria Santos"
          src={src}
          kind={kind}
          size="lg"
          onLoadingStatusChange={onLoadingStatusChange}
        />
      </StrictMode>
    );
    expect(statuses).toEqual(['loading']);
    expect(root(container)).toHaveAttribute('data-loading', 'true');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['image'] });

    rerender(avatar('/maria.png'));
    expect(statuses).toEqual(['loading']);
    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect(statuses).toEqual(['loading', 'loaded']);
    expect(root(container)).not.toHaveAttribute('data-loading');

    rerender(avatar('/gone.png'));
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(statuses).toEqual(['loading', 'loaded', 'loading', 'error']);
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('MS');

    rerender(avatar('  '));
    rerender(avatar('/team.png', 'group'));
    expect(statuses).toEqual(['loading', 'loaded', 'loading', 'error', 'idle']);
    expect(root(container)).not.toHaveAttribute('data-loading');
  });

  it('UIC-AVATAR-1.5 keeps a loaded picture for an equal request and reloads a changed one', () => {
    const statuses: string[] = [];
    const avatar = (srcSet: string) => (
      <Avatar
        name="Maria Santos"
        src="/maria.png"
        imageProps={{ srcSet, sizes: '48px' }}
        onLoadingStatusChange={(status) => statuses.push(status)}
      />
    );
    const view = render(avatar('/maria-2x.png 2x'));
    const first = view.container.querySelector('img') as HTMLImageElement;
    fireEvent.load(first);
    view.rerender(avatar('/maria-2x.png 2x'));
    expect(view.container.querySelector('img')).toBe(first);
    expect(statuses).toEqual(['loading', 'loaded']);
    view.rerender(avatar('/maria-3x.png 3x'));
    expect(view.container.querySelector('img')).not.toBe(first);
    expect(statuses).toEqual(['loading', 'loaded', 'loading']);
  });

  it('UIC-AVATAR-1.5 counts a picture the browser already holds as loaded', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(32);
    const onLoadingStatusChange = vi.fn();
    const { container } = render(
      <Avatar
        name="Maria Santos"
        src="/cached.png"
        onLoadingStatusChange={onLoadingStatusChange}
      />,
    );
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loaded');
    expect(root(container)).not.toHaveAttribute('data-loading');
    expect(container.querySelector('img')).toHaveAttribute('src', '/cached.png');
    complete.mockRestore();
    width.mockRestore();
  });

  it('UIC-AVATAR-1.5 counts a picture that failed before hydration as failed', async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const width = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
    const onLoadingStatusChange = vi.fn();
    const element = (
      <Avatar name="Maria Santos" src="/gone.png" onLoadingStatusChange={onLoadingStatusChange} />
    );
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = renderToString(element);
    expect(host.querySelector('img')).toHaveAttribute('src', '/gone.png');
    let app: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      app = hydrateRoot(host, element);
    });
    expect(onLoadingStatusChange.mock.calls).toEqual([['loading'], ['error']]);
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('.ui-avatar')).not.toHaveAttribute('data-loading');
    expect(host.querySelector('.ui-avatar__initials')).toHaveTextContent('MS');
    act(() => app?.unmount());
    host.remove();
    complete.mockRestore();
    width.mockRestore();
  });

  it('UIC-AVATAR-1.4 UIC-AVATAR-1.5 tries a new responsive candidate after a failure', () => {
    const onLoadingStatusChange = vi.fn();
    const avatar = (imageProps: { srcSet: string; crossOrigin?: 'anonymous' }) => (
      <Avatar
        name="Maria Santos"
        src="/fallback.png"
        imageProps={imageProps}
        onLoadingStatusChange={onLoadingStatusChange}
      />
    );
    const { container, rerender } = render(avatar({ srcSet: '/bad.png 1x' }));
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();

    rerender(avatar({ srcSet: '/good.png 1x' }));
    const image = container.querySelector('img') as HTMLImageElement;
    expect(image).toHaveAttribute('srcset', '/good.png 1x');
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loading');
    fireEvent.load(image);
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loaded');

    rerender(avatar({ srcSet: '/good.png 1x', crossOrigin: 'anonymous' }));
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loading');
    const next = container.querySelector('img') as HTMLImageElement;
    expect(next).not.toBe(image);
    fireEvent.error(image);
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loading');
    expect(container.querySelector('img')).toBe(next);
  });

  it('UIC-AVATAR-1.5 leaves a lazy picture loading until it settles', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
    const { container } = render(
      <Avatar name="Maria Santos" src="/later.png" imageProps={{ loading: 'lazy' }} />,
    );
    expect(root(container)).toHaveAttribute('data-loading', 'true');
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    complete.mockRestore();
  });

  it('UIC-AVATAR-1.6 sets the picture attributes on the image only', () => {
    const imageProps = {
      srcSet: '/maria-2x.png 2x',
      sizes: '40px',
      crossOrigin: 'anonymous',
      referrerPolicy: 'no-referrer',
      loading: 'lazy',
    } as const;
    const { container, rerender } = render(
      <Avatar name="Maria Santos" src="/maria.png" imageProps={imageProps} />,
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('srcset', '/maria-2x.png 2x');
    expect(image).toHaveAttribute('sizes', '40px');
    expect(image).toHaveAttribute('crossorigin', 'anonymous');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveClass('ui-avatar__image');
    expectHooksMatchSpec(container, 'AVATAR', { slots: ['image'] });

    rerender(<Avatar name="Maria Santos" imageProps={imageProps} />);
    expect(container.querySelector('img, [srcset]')).toBeNull();
  });

  it('UIC-AVATAR-2.1 publishes the size, medium by default', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg', 'fill'] as const) {
      rerender(<Avatar name="Maria Santos" size={size} />);
      expect(root(container)).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'AVATAR');
    }
    expect(root(container)).not.toHaveAttribute('tabindex');
  });

  it('UIC-AVATAR-2.2 publishes the variant, filled by default', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" />);
    expect(root(container)).toHaveAttribute('data-variant', 'filled');
    rerender(<Avatar name="Maria Santos" variant="outlined" />);
    expect(root(container)).toHaveAttribute('data-variant', 'outlined');
    expectHooksMatchSpec(container, 'AVATAR');
  });

  it('UIC-AVATAR-2.3 publishes the shape, a circle by default', () => {
    const { container, rerender } = render(<Avatar name="Maria Santos" />);
    expect(root(container)).toHaveAttribute('data-shape', 'circle');
    for (const shape of ['circle', 'rounded', 'square'] as const) {
      rerender(<Avatar name="Build bot" shape={shape} />);
      expect(root(container)).toHaveAttribute('data-shape', shape);
      expectHooksMatchSpec(container, 'AVATAR');
    }
    rerender(<Avatar name="Design team" kind="group" shape="square" />);
    expect(root(container)).toHaveAttribute('data-shape', 'square');
  });

  it('UIC-AVATAR-3.1 is an image named by the name, or decorative on request', () => {
    const { container, rerender } = render(<Avatar name="  Maria Santos " src="/maria.png" />);
    const image = screen.getByRole('img', { name: 'Maria Santos' });
    expect(image).toHaveClass('ui-avatar');
    expect(image).not.toHaveAttribute('aria-hidden');

    rerender(<Avatar name="Maria Santos" />);
    expect(container.querySelector('.ui-avatar__initials')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('img')).toHaveLength(1);

    rerender(<Avatar name="Maria Santos" decorative />);
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');
    expect(root(container)).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(<Avatar name=" " />);
    expect(screen.getByRole('img', { name: 'Unnamed' })).toBeInTheDocument();
    rerender(
      <UiProvider messages={{ unnamed: 'Sans nom' }}>
        <Avatar name="" kind="group" />
      </UiProvider>,
    );
    expect(screen.getByRole('img', { name: 'Sans nom' })).toBeInTheDocument();
  });

  it('UIC-AVATAR-3.1 shares one display name rule with the components that name a person', () => {
    expect(getDisplayName('  Maria Santos ', 'Unnamed')).toBe('Maria Santos');
    expect(getDisplayName('   ', 'Unnamed')).toBe('Unnamed');
  });

  it('UIC-AVATAR-3.2 splits the identity a wrapper hands to its avatar from its own props', () => {
    const [identity, rest] = splitAvatarIdentity({
      name: 'Maria Santos',
      src: '/maria.png',
      kind: 'person' as const,
      colorKey: 'user-1',
      className: 'caller',
      'data-person': '42',
    });
    expect(identity).toEqual({
      name: 'Maria Santos',
      src: '/maria.png',
      imageProps: undefined,
      initials: undefined,
      colorKey: 'user-1',
      colorIndex: undefined,
      kind: 'person',
      shape: undefined,
    });
    expect(rest).toEqual({ className: 'caller', 'data-person': '42' });
  });

  it('UIC-AVATAR-3.2 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Avatar
        name="Maria Santos"
        className="caller"
        id="avatar-1"
        data-testid="probe"
        data-person="42"
        data-size="xl"
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-avatar', 'caller');
    expect(element).toHaveAttribute('id', 'avatar-1');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-person', '42');
    expect(element).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'AVATAR', { callerAttributes: ['data-person'] });
  });
  it('UIC-AVATAR-4.1 adds optional presence to the same avatar and leaves its surface separate', () => {
    const { rerender } = render(<Avatar name="Maria Santos" />);
    const plain = screen.getByRole('img', { name: 'Maria Santos' });
    expect(plain.querySelector('.ui-avatar__indicator')).toBeNull();
    rerender(<Avatar name="Maria Santos" status="away" statusLabel="Away" />);
    const avatar = screen.getByRole('img', { name: 'Maria Santos, Away' });
    expect(avatar).toHaveAttribute('data-status', 'away');
    expect(avatar.querySelector('.ui-avatar__surface .ui-avatar__indicator')).toBeNull();
    expect(avatar.querySelector('.ui-avatar__indicator')).toHaveAttribute('aria-hidden', 'true');
  });
});
