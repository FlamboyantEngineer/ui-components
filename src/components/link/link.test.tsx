import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Link } from './link.js';

describe('Link', () => {
  it('UIC-LINK-1.1 UIC-LINK-3.1 renders an anchor named by its content', () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = render(
      <Link href="/recipes" ref={ref}>
        All recipes
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'All recipes' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/recipes');
    expect(link).toHaveClass('ui-link');
    expect(ref.current).toBe(link);
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
    expect(link.querySelector('.ui-link__external-icon')).toBeNull();
    expectHooksMatchSpec(container, 'LINK');
  });

  it('UIC-LINK-1.1 draws the anchor through the provider link renderer', () => {
    render(
      <UiProvider renderLink={(props) => <a {...props} data-routed="true" />}>
        <Link href="/recipes">All recipes</Link>
      </UiProvider>,
    );
    expect(screen.getByRole('link', { name: 'All recipes' })).toHaveAttribute(
      'data-routed',
      'true',
    );
  });

  it('UIC-LINK-1.2 UIC-LINK-1.3 UIC-LINK-1.4 publishes variant, placement and underline with defaults', () => {
    const { container, rerender } = render(<Link href="/a">Apples</Link>);
    const link = () => container.querySelector('.ui-link');
    expect(link()).toHaveAttribute('data-variant', 'primary');
    expect(link()).not.toHaveAttribute('data-standalone');
    expect(link()).toHaveAttribute('data-underline', 'always');
    rerender(
      <Link href="/a" isStandalone>
        Apples
      </Link>,
    );
    expect(link()).toHaveAttribute('data-standalone', 'true');
    expect(link()).toHaveAttribute('data-underline', 'hover');
    for (const variant of ['primary', 'secondary'] as const) {
      for (const underline of ['always', 'hover', 'none'] as const) {
        rerender(
          <Link href="/a" variant={variant} underline={underline} isStandalone>
            Apples
          </Link>,
        );
        expect(link()).toHaveAttribute('data-variant', variant);
        expect(link()).toHaveAttribute('data-underline', underline);
        expectHooksMatchSpec(container, 'LINK');
      }
    }
  });

  it('UIC-LINK-1.5 appends the caller class and keeps its hooks over caller attributes', () => {
    const { container } = render(
      <Link
        href="/a"
        download="apples.txt"
        className="caller"
        id="apples"
        data-variant="caller"
        data-owner="kitchen"
      >
        Apples
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('download', 'apples.txt');
    expect(link).toHaveClass('ui-link', 'caller');
    expect(link).toHaveAttribute('id', 'apples');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(link).toHaveAttribute('data-owner', 'kitchen');
    expectHooksMatchSpec(container, 'LINK', { callerAttributes: ['data-owner'] });
  });

  it('UIC-LINK-1.6 renders through the caller element with the hooks and its state', () => {
    const { container } = render(
      <Link
        href="/a"
        variant="secondary"
        aria-current="page"
        render={(props, state) => (
          <a {...props} data-swapped="true" data-is-current={String(state.isCurrent)} />
        )}
      >
        Apples
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Apples' });
    expect(link).toHaveAttribute('data-swapped', 'true');
    expect(link).toHaveAttribute('data-is-current', 'true');
    expect(link).toHaveAttribute('data-variant', 'secondary');
    expectHooksMatchSpec(container, 'LINK', {
      callerAttributes: ['data-swapped', 'data-is-current'],
    });
  });

  it('UIC-LINK-2.1 navigates through the provider navigate with router options', async () => {
    const navigate = vi.fn();
    render(
      <UiProvider navigate={navigate} useHref={(href) => `/app${href}`}>
        <Link href="/recipes/tart" routerOptions={{ replace: true }}>
          Lemon tart
        </Link>
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Lemon tart' });
    expect(link).toHaveAttribute('href', '/app/recipes/tart');
    await userEvent.click(link);
    expect(navigate).toHaveBeenCalledWith('/recipes/tart', { replace: true });
  });

  it('UIC-LINK-2.2 UIC-LINK-3.1 opens an external link in a new tab, safely, and says so', () => {
    const { container } = render(
      <Link href="https://example.com/guide" isExternal rel="author">
        Seasonal guide
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Seasonal guide (opens in a new tab)' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'author noopener noreferrer');
    const icon = link.querySelector('.ui-link__external-icon');
    expect(icon).toHaveAttribute('data-glyph', 'external-link');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(link.querySelector('.ui-link__new-tab-label')).toHaveClass('ui-visually-hidden');
    expectHooksMatchSpec(container, 'LINK', { slots: 'all' });
  });

  it('UIC-LINK-2.2 treats a caller target of _blank as a new tab and lets target override isExternal', () => {
    render(
      <UiProvider messages={{ opensInNewTab: '(new window)' }}>
        <Link href="/print" target="_blank" rel="noopener">
          Printable list
        </Link>
        <Link href="/stay" isExternal target="_self">
          Same tab
        </Link>
      </UiProvider>,
    );
    const print = screen.getByRole('link', { name: 'Printable list (new window)' });
    expect(print).toHaveAttribute('rel', 'noopener noreferrer');
    const stay = screen.getByRole('link', { name: 'Same tab' });
    expect(stay).toHaveAttribute('target', '_self');
    expect(stay).not.toHaveAttribute('rel');
    expect(stay.querySelector('.ui-link__external-icon')).toBeNull();
  });

  it('UIC-LINK-2.3 UIC-LINK-3.2 is a pressable link without href that Enter activates', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(<Link onPress={onPress}>Show more</Link>);
    const link = screen.getByRole('link', { name: 'Show more' });
    expect(link.tagName).toBe('SPAN');
    expect(link).toHaveAttribute('tabindex', '0');
    expect(link).not.toHaveAttribute('href');
    await user.tab();
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('data-focus-visible', 'true');
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
    await user.click(link);
    expect(onPress).toHaveBeenCalledTimes(2);
    expectHooksMatchSpec(container, 'LINK');
  });

  it('UIC-LINK-2.4 UIC-LINK-3.3 renders a disabled link as a span that refuses navigation', async () => {
    const navigate = vi.fn();
    const onPress = vi.fn();
    const { container } = render(
      <UiProvider navigate={navigate}>
        <Link href="/recipes" isDisabled onPress={onPress} target="_blank">
          All recipes
        </Link>
      </UiProvider>,
    );
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('SPAN');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', 'true');
    expect(link).not.toHaveAttribute('href');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('tabindex');
    await userEvent.click(link);
    expect(onPress).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'LINK');
  });

  it('UIC-LINK-2.2 UIC-LINK-2.4 says nothing about a new tab for a link that opens nothing', () => {
    const { container } = render(
      <>
        <Link href="/docs" isExternal isDisabled>
          Docs
        </Link>
        <Link isExternal onPress={() => undefined}>
          Notes
        </Link>
      </>,
    );
    const [docs, notes] = screen.getAllByRole('link');
    expect(docs).toHaveAccessibleName('Docs');
    expect(notes).toHaveAccessibleName('Notes');
    expect(container.querySelector('.ui-link__external-icon')).toBeNull();
  });

  it('UIC-LINK-3.1 keeps its description first when a preview trigger describes it', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p id="hint">Opens the record</p>
        <HoverCardTrigger delay={0}>
          <Link href="/records/12" aria-describedby="hint">
            Record
          </Link>
          <HoverCard aria-label="Preview">Owner</HoverCard>
        </HoverCardTrigger>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Record' });
    await user.tab();
    const card = await screen.findByRole('dialog', { name: 'Preview' });
    expect(link.getAttribute('aria-describedby')?.split(' ')).toEqual(
      expect.arrayContaining(['hint', card.id]),
    );
    expect(link).toHaveAccessibleDescription(/^Opens the record /);
  });

  it('UIC-LINK-3.2 UIC-LINK-3.3 takes focus and publishes React Aria states and the current page', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Link href="/fruit" aria-current="page" isStandalone>
        Fruit
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Fruit' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-current', 'true');
    await user.hover(link);
    expect(link).toHaveAttribute('data-hovered', 'true');
    await user.tab();
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(container, 'LINK');
  });
});
