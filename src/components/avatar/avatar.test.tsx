import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import {
  Avatar,
  DEFAULT_AVATAR_COLOR_COUNT,
  getDisplayName,
  resolveAvatarColor,
  splitAvatarIdentity,
} from './avatar.js';

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
    expect(screen.queryByRole('img')).toBeNull();

    rerender(<Avatar name=" " />);
    expect(screen.getByRole('img', { name: 'Unnamed' })).toBeInTheDocument();
    rerender(
      <UiProvider strings={{ unnamed: 'Sans nom' }}>
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
      initials: undefined,
      colorKey: 'user-1',
      colorIndex: undefined,
      kind: 'person',
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
});
