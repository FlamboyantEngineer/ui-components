import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Breadcrumb, type BreadcrumbItem } from './breadcrumb.js';

const trail: BreadcrumbItem[] = [
  { label: 'Home', href: '/home' },
  { label: 'Recipes', href: '/recipes' },
  { label: 'Lemon tart' },
];

// A crumb without a destination between two links, before the current crumb.
const mixed: BreadcrumbItem[] = [
  { label: 'Alpha', href: '/a' },
  { label: 'Bravo' },
  { label: 'Charlie', href: '/c' },
  { label: 'Delta', href: '/d' },
];

function crumb(label: string): HTMLElement {
  const element = Array.from(
    screen.getByRole('navigation').querySelectorAll<HTMLElement>('.ui-breadcrumb__link'),
  ).find((node) => node.textContent === label);
  if (!element) throw new Error(`No crumb ${label}`);
  return element;
}

/** jsdom has no layout: give a label the box of cut (or whole) text. */
function setBox(element: HTMLElement, { cut }: { cut: boolean }) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: cut ? 240 : 100 });
}

async function rest(element: HTMLElement) {
  fireEvent.pointerEnter(element, { pointerType: 'mouse' });
  await act(async () => {
    vi.advanceTimersByTime(500);
  });
}

async function press(from: HTMLElement, key: string): Promise<string | null> {
  from.focus();
  await userEvent.keyboard(key);
  return document.activeElement?.textContent ?? null;
}

describe('Breadcrumb', () => {
  it('UIC-BREADCRUMB-1.1 renders a navigation landmark around an ordered list of crumbs', () => {
    const { container } = render(<Breadcrumb items={trail} />);
    const nav = screen.getByRole('navigation');
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('ui-breadcrumb');
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('ui-breadcrumb__list');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Home', 'Recipes', 'Lemon tart']);
    for (const item of items) expect(item).toHaveClass('ui-breadcrumb__item');
    expectHooksMatchSpec(container, 'BREADCRUMB', { slots: 'all' });
  });

  it('UIC-BREADCRUMB-1.2 marks the last crumb current, as unfocusable text', async () => {
    const { container } = render(
      <Breadcrumb items={[...trail.slice(0, 2), { label: 'Lemon tart', href: '/tart' }]} />,
    );
    const current = crumb('Lemon tart');
    expect(current.tagName).toBe('SPAN');
    expect(current).not.toHaveAttribute('href');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('data-current', 'true');
    expect(current).not.toHaveAttribute('tabindex');
    expect(current.closest('li')).toHaveAttribute('data-current', 'true');
    expect(screen.getAllByRole('link').filter((link) => link.tagName === 'A')).toHaveLength(2);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(current).not.toHaveFocus();
    expectHooksMatchSpec(container, 'BREADCRUMB');
  });

  it('UIC-BREADCRUMB-1.3 renders links through the provider renderer and router', async () => {
    const navigate = vi.fn();
    const onAction = vi.fn();
    render(
      <UiProvider navigate={navigate} renderLink={(props) => <a {...props} data-routed="true" />}>
        <Breadcrumb
          items={[{ id: 'home', label: 'Home', href: '/home' }, ...trail.slice(1)]}
          onAction={onAction}
        />
      </UiProvider>,
    );
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home.tagName).toBe('A');
    expect(home).toHaveAttribute('href', '/home');
    expect(home).toHaveAttribute('data-routed', 'true');
    await userEvent.click(home);
    expect(navigate).toHaveBeenCalledWith('/home', undefined);
    expect(onAction).toHaveBeenCalledWith('home');
    await userEvent.click(screen.getByRole('link', { name: 'Recipes' }));
    expect(onAction).toHaveBeenLastCalledWith(1);
    await userEvent.click(crumb('Lemon tart'));
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('UIC-BREADCRUMB-1.3 keeps a crumb without a destination focusable and activatable', async () => {
    const onAction = vi.fn();
    render(<Breadcrumb items={mixed} onAction={onAction} />);
    const bravo = crumb('Bravo');
    expect(bravo.tagName).toBe('SPAN');
    expect(bravo).toHaveAttribute('role', 'link');
    expect(bravo).toHaveAttribute('tabindex', '0');
    bravo.focus();
    await userEvent.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith(1);
  });

  it('UIC-BREADCRUMB-1.4 draws decorative separators between crumbs only', () => {
    const { container, rerender } = render(<Breadcrumb items={trail} />);
    const separators = container.querySelectorAll('.ui-breadcrumb__separator');
    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator).toHaveClass('ui-icon');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator).toHaveAttribute('data-glyph', 'chevron-right');
    }
    expect(
      container.querySelectorAll('li')[2]?.querySelector('.ui-breadcrumb__separator'),
    ).toBeNull();

    rerender(<Breadcrumb items={[{ label: 'Home' }]} />);
    expect(container.querySelector('.ui-breadcrumb__separator')).toBeNull();

    rerender(<Breadcrumb items={trail} separator={<svg data-testid="slash" />} />);
    expect(screen.getAllByTestId('slash')[0]?.parentElement).toHaveClass(
      'ui-breadcrumb__separator',
    );

    rerender(
      <I18nProvider locale="ar-EG">
        <Breadcrumb items={trail} />
      </I18nProvider>,
    );
    expect(container.querySelector('.ui-breadcrumb__separator')).toHaveAttribute(
      'data-glyph',
      'chevron-left',
    );
    expectHooksMatchSpec(container, 'BREADCRUMB');
  });

  it('UIC-BREADCRUMB-1.5 publishes the size and keeps full labels', () => {
    const label = 'Tables, figures and captions in a very long section title';
    const { container, rerender } = render(
      <Breadcrumb items={[...trail.slice(0, 1), { label }]} />,
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('data-size', 'md');
    expect(crumb(label)).toHaveTextContent(label);
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<Breadcrumb items={trail} size={size} />);
      expect(nav).toHaveAttribute('data-size', size);
      expectHooksMatchSpec(container, 'BREADCRUMB');
    }
  });

  it('UIC-BREADCRUMB-1.6 appends the caller class and forwards id, ref, hidden and data attributes', () => {
    const ref = { current: null as HTMLElement | null };
    const { container, rerender } = render(
      <Breadcrumb
        items={trail}
        className="caller"
        id="trail"
        ref={ref}
        data-testid="probe"
        data-size="caller"
      />,
    );
    const nav = screen.getByTestId('probe');
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('ui-breadcrumb', 'caller');
    expect(nav).toHaveAttribute('id', 'trail');
    expect(nav).toHaveAttribute('data-size', 'md');
    expect(ref.current).toBe(nav);
    expect(container.querySelector('ol')).not.toHaveAttribute('id');
    expectHooksMatchSpec(container, 'BREADCRUMB');
    rerender(<Breadcrumb items={trail} hidden data-testid="probe" />);
    expect(screen.getByTestId('probe')).not.toBeVisible();
  });

  it('UIC-BREADCRUMB-2.1 names the landmark once, with a default or the caller name', () => {
    const { container, rerender } = render(<Breadcrumb items={trail} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeInTheDocument();
    expect(container.querySelector('ol')).not.toHaveAttribute('aria-label');
    rerender(<Breadcrumb items={trail} aria-label="Recipe location" />);
    expect(screen.getByRole('navigation', { name: 'Recipe location' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="where">You are here</h2>
        <Breadcrumb items={trail} aria-labelledby="where" />
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
  });

  it('UIC-BREADCRUMB-2.2 moves focus with arrows, Home and End, skipping the current crumb', async () => {
    render(<Breadcrumb items={mixed} />);
    expect(await press(crumb('Alpha'), '{ArrowRight}')).toBe('Bravo');
    expect(await press(crumb('Bravo'), '{ArrowRight}')).toBe('Charlie');
    expect(await press(crumb('Charlie'), '{ArrowRight}')).toBe('Charlie');
    expect(await press(crumb('Alpha'), '{ArrowLeft}')).toBe('Alpha');
    expect(await press(crumb('Alpha'), '{End}')).toBe('Charlie');
    expect(await press(crumb('Charlie'), '{Home}')).toBe('Alpha');
    expect(await press(crumb('Charlie'), '{ArrowLeft}')).toBe('Bravo');
  });

  it('UIC-BREADCRUMB-2.2 follows a re-render that changes the current crumb', async () => {
    const { rerender } = render(<Breadcrumb items={mixed} />);
    rerender(<Breadcrumb items={mixed.slice(0, 3)} />);
    expect(await press(crumb('Alpha'), '{End}')).toBe('Bravo');
  });

  it('UIC-BREADCRUMB-2.2 mirrors the arrow keys in right-to-left locales', async () => {
    render(
      <I18nProvider locale="he-IL">
        <Breadcrumb items={mixed} />
      </I18nProvider>,
    );
    expect(await press(crumb('Alpha'), '{ArrowLeft}')).toBe('Bravo');
    expect(await press(crumb('Bravo'), '{ArrowRight}')).toBe('Alpha');
  });

  it('UIC-BREADCRUMB-2.3 disables every crumb', async () => {
    const onAction = vi.fn();
    const { container } = render(<Breadcrumb items={trail} isDisabled onAction={onAction} />);
    expect(container.querySelector('a')).toBeNull();
    for (const link of container.querySelectorAll('.ui-breadcrumb__link')) {
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('data-disabled', 'true');
      expect(link.closest('li')).toHaveAttribute('data-disabled', 'true');
    }
    await userEvent.click(crumb('Home'));
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    expect(onAction).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'BREADCRUMB');
  });

  it('UIC-BREADCRUMB-2.4 publishes hover, press and keyboard focus states', async () => {
    const { container } = render(<Breadcrumb items={trail} />);
    const home = screen.getByRole('link', { name: 'Home' });
    await userEvent.hover(home);
    expect(home).toHaveAttribute('data-hovered', 'true');
    fireEvent.pointerDown(home, { pointerType: 'mouse', button: 0 });
    expect(home).toHaveAttribute('data-pressed', 'true');
    expectHooksMatchSpec(container, 'BREADCRUMB');
    fireEvent.pointerCancel(home, { pointerType: 'mouse', button: 0 });
    await userEvent.unhover(home);
    await userEvent.tab();
    expect(home).toHaveFocus();
    expect(home).toHaveAttribute('data-focus-visible', 'true');
    expect(home).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(container, 'BREADCRUMB');
  });

  it('UIC-BREADCRUMB-2.5 shows a cut label whole in a tooltip on hover and keyboard focus', async () => {
    const long = 'Seasonal recipes from the coast';
    const current = 'Tables, figures and captions for the printed edition';
    vi.useFakeTimers();
    try {
      render(
        <Breadcrumb
          items={[
            { label: 'Home', href: '/home' },
            { label: long, href: '/seasonal' },
            { label: current },
          ]}
        />,
      );
      const labels = Array.from(document.querySelectorAll<HTMLElement>('.ui-breadcrumb__label'));
      expect(labels.map((label) => label.textContent)).toEqual(['Home', long, current]);
      for (const label of labels) expect(label).toHaveClass('ui-truncation-tooltip');
      const [home, seasonal, last] = labels as [HTMLElement, HTMLElement, HTMLElement];
      setBox(home, { cut: false });
      setBox(seasonal, { cut: true });
      setBox(last, { cut: true });
      const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

      await rest(home);
      expect(tooltip()).toBeNull();
      await rest(last);
      expect(tooltip()).toHaveTextContent(current);
      expect(tooltip()).toHaveClass('ui-truncation-tooltip__panel');
      expect(crumb(current)).not.toHaveAttribute('aria-describedby');
      expectHooksMatchSpec(document.body, 'BREADCRUMB', { slots: ['label'] });
      fireEvent.pointerLeave(last, { pointerType: 'mouse' });
      expect(tooltip()).toBeNull();

      await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        crumb(long).focus();
      });
      expect(tooltip()).toHaveTextContent(long);
      expect(crumb(long)).toHaveAccessibleName(long);
      await act(async () => crumb('Home').focus());
      expect(tooltip()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
