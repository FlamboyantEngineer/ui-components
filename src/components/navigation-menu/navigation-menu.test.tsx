import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { NavigationMenu, type NavigationMenuProps } from './navigation-menu.js';
import { NavigationMenuItem, NavigationMenuLink } from './navigation-menu-items.js';

function Menu(props: Partial<NavigationMenuProps> & { showGuides?: boolean }) {
  const { showGuides = true, ...rest } = props;
  return (
    <>
      <NavigationMenu aria-label="Site" {...rest}>
        <NavigationMenuLink href="/" isCurrent>
          Home
        </NavigationMenuLink>
        <NavigationMenuItem id="fruit" label="Fruit">
          <p>Seasonal picks from the orchard.</p>
          <NavigationMenuLink href="/fruit/apples">Apples</NavigationMenuLink>
          <NavigationMenuLink href="/fruit/pears">Pears</NavigationMenuLink>
        </NavigationMenuItem>
        {showGuides ? (
          <NavigationMenuItem id="guides" label="Guides">
            <NavigationMenuLink href="/guides/pruning">Pruning</NavigationMenuLink>
          </NavigationMenuItem>
        ) : null}
        <NavigationMenuItem id="archive" label="Archive" isDisabled>
          <NavigationMenuLink href="/archive">Old notes</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenu>
      <button type="button">Outside</button>
    </>
  );
}

const trigger = (name: string) => screen.getByRole('button', { name });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('NavigationMenu', () => {
  it('UIC-NAVIGATION-MENU-1.1 UIC-NAVIGATION-MENU-1.2 renders a named landmark with items, triggers and panels', () => {
    const { container } = render(<Menu defaultOpenKey="fruit" />);
    const nav = screen.getByRole('navigation', { name: 'Site' });
    expect(nav.tagName).toBe('NAV');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    const fruit = trigger('Fruit');
    expect(fruit).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(fruit.getAttribute('aria-controls') ?? '');
    expect(panel).toHaveTextContent('Seasonal picks from the orchard.');
    expect(fruit.closest('li')).toHaveAttribute('data-open', 'true');
    expect(trigger('Guides')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Pruning' })).not.toBeInTheDocument();
    expect(trigger('Archive')).toBeDisabled();
    expect(trigger('Archive').closest('li')).toHaveAttribute('data-disabled', 'true');
    expectHooksMatchSpec(container, 'NAVIGATION-MENU', { slots: 'all' });
  });

  it('UIC-NAVIGATION-MENU-1.3 renders links with the current page and provider routing', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <UiProvider navigate={navigate}>
        <Menu defaultOpenKey="fruit" />
      </UiProvider>,
    );
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('aria-current', 'page');
    expect(home).toHaveAttribute('data-current', 'true');
    expect(home.closest('li')).toHaveAttribute('data-current', 'true');
    const apples = screen.getByRole('link', { name: 'Apples' });
    expect(apples.closest('li')).toBe(trigger('Fruit').closest('li'));
    await user.click(apples);
    expect(navigate).toHaveBeenCalledWith('/fruit/apples', undefined);
  });

  it('UIC-NAVIGATION-MENU-2.1 keeps one panel open and reports the open key', async () => {
    const user = userEvent.setup();
    const onOpenKeyChange = vi.fn<(key: Key | null) => void>();
    const { container } = render(<Menu onOpenKeyChange={onOpenKeyChange} openOnHover={false} />);
    const root = container.querySelector('.ui-navigation-menu');
    expect(root).not.toHaveAttribute('data-open');
    await user.click(trigger('Fruit'));
    expect(onOpenKeyChange).toHaveBeenLastCalledWith('fruit');
    expect(root).toHaveAttribute('data-open', 'true');
    await user.click(trigger('Guides'));
    expect(onOpenKeyChange).toHaveBeenLastCalledWith('guides');
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
    expect(trigger('Guides')).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger('Guides'));
    expect(onOpenKeyChange).toHaveBeenLastCalledWith(null);
    expect(root).not.toHaveAttribute('data-open');
  });

  it('UIC-NAVIGATION-MENU-2.1 follows a controlled open key', () => {
    const { rerender } = render(<Menu openKey="fruit" />);
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'true');
    rerender(<Menu openKey={null} />);
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-NAVIGATION-MENU-2.2 opens with the keyboard and tabs into the open panel', async () => {
    const user = userEvent.setup();
    render(<Menu openOnHover={false} />);
    await user.tab();
    await user.tab();
    expect(trigger('Fruit')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Apples' })).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(trigger('Guides')).toHaveFocus();
  });

  it('UIC-NAVIGATION-MENU-2.3 opens on a resting pointer and closes after the grace delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Menu />);
    await user.hover(trigger('Fruit'));
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
    await act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'true');
    // Into the panel and onto the next item: the open panel switches at once.
    await user.hover(screen.getByRole('link', { name: 'Apples' }));
    await user.hover(trigger('Guides'));
    expect(trigger('Guides')).toHaveAttribute('aria-expanded', 'true');
    await user.unhover(trigger('Guides'));
    await act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(trigger('Guides')).toHaveAttribute('aria-expanded', 'true');
    await act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(trigger('Guides')).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-NAVIGATION-MENU-2.3 pins a hovered panel on press and ignores a disabled item', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Menu />);
    await user.hover(trigger('Fruit'));
    await act(() => {
      vi.advanceTimersByTime(200);
    });
    await user.click(trigger('Fruit'));
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'true');
    await user.unhover(trigger('Fruit'));
    await act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger('Fruit'));
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
    await user.hover(trigger('Archive'));
    await act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(trigger('Archive')).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-NAVIGATION-MENU-2.4 closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Menu defaultOpenKey="fruit" />);
    await user.click(screen.getByText('Seasonal picks from the orchard.'));
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'true');
    screen.getByRole('link', { name: 'Pears' }).focus();
    await user.keyboard('{Escape}');
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
    expect(trigger('Fruit')).toHaveFocus();
  });

  it('UIC-NAVIGATION-MENU-2.4 closes on a press outside, focus leaving and a link press', async () => {
    const user = userEvent.setup();
    render(<Menu defaultOpenKey="fruit" openOnHover={false} />);
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger('Fruit'));
    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger('Fruit'));
    await user.click(screen.getByRole('link', { name: 'Pears' }));
    expect(trigger('Fruit')).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-NAVIGATION-MENU-2.5 shows closed when the open item is removed', () => {
    const { container, rerender } = render(<Menu openKey="guides" />);
    const root = container.querySelector('.ui-navigation-menu');
    expect(root).toHaveAttribute('data-open', 'true');
    rerender(<Menu openKey="guides" showGuides={false} />);
    expect(root).not.toHaveAttribute('data-open');
    rerender(<Menu openKey="guides" />);
    expect(trigger('Guides')).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-NAVIGATION-MENU-3.1 publishes the open panel size', async () => {
    const user = userEvent.setup();
    class ReportingObserver {
      constructor(readonly callback: ResizeObserverCallback) {}
      observe(element: Element) {
        const entry = {
          target: element,
          contentRect: { width: 316, height: 116 },
          borderBoxSize: [{ inlineSize: 320, blockSize: 120 }],
        } as unknown as ResizeObserverEntry;
        this.callback([entry], this as unknown as ResizeObserver);
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ReportingObserver);
    const { container } = render(<Menu openOnHover={false} />);
    const root = container.querySelector<HTMLElement>('.ui-navigation-menu');
    expect(root?.style.getPropertyValue('--ui-navigation-menu-panel-width')).toBe('');
    await user.click(trigger('Fruit'));
    expect(root?.style.getPropertyValue('--ui-navigation-menu-panel-width')).toBe('320px');
    expect(root?.style.getPropertyValue('--ui-navigation-menu-panel-height')).toBe('120px');
    await user.click(trigger('Fruit'));
    expect(root?.style.getPropertyValue('--ui-navigation-menu-panel-width')).toBe('');
  });
});
