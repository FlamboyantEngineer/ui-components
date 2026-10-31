import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { getColorIndex } from '../../utils/color-index.js';
import { UserIdentity } from './user-identity.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('UserIdentity', () => {
  it('UIC-USER-IDENTITY-1.1 draws a decorative avatar, the name and the secondary line', () => {
    const { container } = render(
      <UserIdentity name=" Maria Santos " description="maria@example.com" />,
    );
    const element = root(container);
    const [avatar, content] = Array.from(element.children);
    expect(avatar).toHaveClass('ui-avatar', 'ui-user-identity__avatar');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(content).toHaveClass('ui-user-identity__content');
    expect(
      container.querySelector('.ui-user-identity__title > .ui-user-identity__name'),
    ).toHaveTextContent(/^Maria Santos$/);
    expect(container.querySelector('.ui-user-identity__description')).toHaveTextContent(
      'maria@example.com',
    );
    expectHooksMatchSpec(container, 'USER-IDENTITY', {
      slots: ['avatar', 'content', 'title', 'name', 'description'],
    });
  });

  it('UIC-USER-IDENTITY-1.1 separates the name and the secondary line in a name from content', () => {
    const { container } = render(
      <button type="button">
        <UserIdentity name="Jon Berg" description="Research team" />
      </button>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Jon Berg Research team');
    expect(container.querySelector('.ui-user-identity__content')?.textContent).toBe(
      'Jon Berg Research team',
    );
  });

  it('UIC-USER-IDENTITY-1.1 renders text as text and reads a blank name as unnamed', () => {
    const { container, rerender } = render(<UserIdentity name="<b>bold()</b>" />);
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('.ui-user-identity__name')).toHaveTextContent('<b>bold()</b>');
    rerender(<UserIdentity name="   " />);
    expect(container.querySelector('.ui-user-identity__name')).toHaveTextContent('Unnamed');
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('?');
  });

  it('UIC-USER-IDENTITY-1.2 keeps caller nodes and omits a blank secondary line', () => {
    const { container, rerender } = render(
      <UserIdentity
        name="Jon Berg"
        description={<time dateTime="2026-10-08">Today</time>}
        nameSuffix={<span>Guest</span>}
      />,
    );
    expect(container.querySelector('.ui-user-identity__description time')).toHaveAttribute(
      'datetime',
      '2026-10-08',
    );
    expect(screen.getByText('Guest').parentElement).toHaveClass('ui-user-identity__title');
    expect(screen.getByText('Guest').previousElementSibling).toHaveClass('ui-user-identity__name');
    for (const description of [undefined, null, false, '', '   ']) {
      rerender(<UserIdentity name="Jon Berg" description={description} />);
      expect(container.querySelector('.ui-user-identity__description')).toBeNull();
    }
    rerender(<UserIdentity name="Jon Berg" description={0} />);
    expect(container.querySelector('.ui-user-identity__description')).toHaveTextContent('0');
  });

  it('UIC-USER-IDENTITY-1.3 sizes the avatar with the row, medium by default', () => {
    const { container, rerender } = render(<UserIdentity name="Jon Berg" />);
    expect(root(container)).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<UserIdentity name="Jon Berg" size={size} />);
      expect(root(container)).toHaveAttribute('data-size', size);
      expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'USER-IDENTITY');
    }
  });

  it('UIC-USER-IDENTITY-1.4 passes picture, initials, colour and kind to the avatar', () => {
    const { container, rerender } = render(
      <UserIdentity name="Lena Ortiz" src="/lena.png" colorKey="user-7" colorCount={50} />,
    );
    const avatar = () => container.querySelector('.ui-avatar') as HTMLElement;
    expect(avatar()).toHaveAttribute('data-color', String(getColorIndex('user-7', 50)));
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('LO');

    rerender(<UserIdentity name="Lena Ortiz" src="/lena-2.png" colorKey="user-7" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/lena-2.png');

    rerender(<UserIdentity name="Assistant" initials="AI" colorIndex={5} />);
    expect(container.querySelector('.ui-avatar__initials')).toHaveTextContent('AI');
    expect(avatar()).toHaveAttribute('data-color', '5');

    rerender(<UserIdentity name="Gardeners" kind="group" src="/ignored.png" />);
    expect(container.querySelector('.ui-avatar__glyph')).toBeInTheDocument();
    expect(container.querySelector('img, .ui-avatar__initials')).toBeNull();
    expect(avatar()).not.toHaveAttribute('data-color');
    expectHooksMatchSpec(container, 'USER-IDENTITY');
  });

  it('UIC-USER-IDENTITY-1.5 adds no role, tab stop or accessible name', () => {
    const { container } = render(
      <UserIdentity name="Sam Okafor" description="Editor" src="/sam.png" />,
    );
    expect(container.querySelector('[role], [tabindex], [aria-label]')).toBeNull();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Sam Okafor')).toBeVisible();
  });

  it('UIC-USER-IDENTITY-1.7 publishes the status with a badge named by its label after the text', () => {
    const { container, rerender } = render(
      <UserIdentity
        name="Lena Ortiz"
        description="Research"
        status="away"
        statusLabel=" Away until noon "
      />,
    );
    const element = root(container);
    expect(element).toHaveAttribute('data-status', 'away');
    const badge = element.lastElementChild as HTMLElement;
    expect(badge).toHaveClass('ui-user-identity__indicator');
    expect(badge).toBe(screen.getByRole('img', { name: 'Away until noon' }));
    expect(element.querySelector('.ui-avatar')).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'USER-IDENTITY', { slots: 'all' });

    rerender(<UserIdentity name="Lena Ortiz" status="busy" />);
    expect(screen.getByRole('img', { name: 'Busy' })).toHaveClass('ui-user-identity__indicator');

    rerender(<UserIdentity name="Lena Ortiz" statusLabel="Away" />);
    expect(root(container)).not.toHaveAttribute('data-status');
    expect(container.querySelector('.ui-user-identity__indicator')).toBeNull();
  });

  it('UIC-USER-IDENTITY-1.4 passes the picture attributes and shape to the avatar', () => {
    const { container } = render(
      <UserIdentity
        name="Build bot"
        src="/bot.png"
        shape="rounded"
        imageProps={{ loading: 'lazy', srcSet: '/bot-2x.png 2x' }}
      />,
    );
    expect(container.querySelector('.ui-avatar')).toHaveAttribute('data-shape', 'rounded');
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(container.querySelector('img')).toHaveAttribute('srcset', '/bot-2x.png 2x');
  });

  it('UIC-USER-IDENTITY-1.6 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <UserIdentity
        name="Sam Okafor"
        className="caller"
        id="identity-1"
        data-testid="probe"
        data-size="xl"
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-user-identity', 'caller');
    expect(element).toHaveAttribute('id', 'identity-1');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'USER-IDENTITY');
  });
});
