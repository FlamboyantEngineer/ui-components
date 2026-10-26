import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Path, type PathProps } from './path.js';

const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

/** jsdom has no layout: give the path the box of a cut (or whole) line. */
function setBox(element: HTMLElement, { cut }: { cut: boolean }) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 100 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: cut ? 240 : 100 });
}

async function hover(user: ReturnType<typeof userEvent.setup>, element: HTMLElement) {
  await user.hover(element);
  await act(async () => {
    vi.advanceTimersByTime(500);
  });
}

describe('Path', () => {
  it('UIC-PATH-2.1 renders the formatted text in a left-to-right isolate without semantics', () => {
    const { container } = render(<Path path="/Garden/<Herbs>//Basil " />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-path');
    expect(root).toHaveTextContent(/^\/Garden\/<Herbs>\/Basil$/);
    const text = root.querySelector('bdi');
    expect(text).toHaveClass('ui-path__text');
    expect(text).toHaveAttribute('dir', 'ltr');
    expect(root.querySelector('a, nav, [role], [tabindex]')).toBeNull();
    expect(root).not.toHaveAttribute('role');
    expect(root).not.toHaveAttribute('style');
    expectHooksMatchSpec(container, 'PATH', { slots: 'all' });
  });

  it('UIC-PATH-2.1 roots only slash-led strings and keeps array labels whole', () => {
    const { container, rerender } = render(<Path path="Garden/Herbs" />);
    expect(container).toHaveTextContent(/^Garden\/Herbs$/);
    rerender(<Path path={['Garden', 'https://example.test/basil']} />);
    expect(container).toHaveTextContent(/^Garden\/https:\/\/example\.test\/basil$/);
    rerender(<Path path=" /// " />);
    expect(container).toHaveTextContent(/^\/$/);
  });

  it('UIC-PATH-2.3 hides natively and stays quiet unless asked to announce', () => {
    const { container, rerender } = render(<Path path="/Garden" />);
    expect(container.querySelector('[aria-live]')).toBeNull();
    rerender(<Path path="/Garden/Herbs" aria-live="polite" />);
    expect(container.firstElementChild).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveTextContent('/Garden/Herbs');
    rerender(<Path path="/Garden" hidden />);
    expect((container.firstElementChild as HTMLElement).hidden).toBe(true);
  });

  it('UIC-PATH-2.4 appends the caller class and forwards id, ref, native and data attributes', () => {
    expectTypeOf<PathProps>().not.toHaveProperty('expandable');
    expectTypeOf<PathProps>().not.toHaveProperty('isExpanded');
    expectTypeOf<PathProps>().not.toHaveProperty('defaultExpanded');
    expectTypeOf<PathProps>().not.toHaveProperty('onExpandedChange');
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Path
        path="/Garden"
        className="caller"
        id="where"
        ref={ref}
        title="Garden"
        data-probe="yes"
      />,
    );
    const root = screen.getByTitle('Garden');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('ui-path', 'caller');
    expect(root).toHaveAttribute('id', 'where');
    expect(root).toHaveAttribute('title', 'Garden');
    expect(root).toHaveAttribute('data-probe', 'yes');
    expectHooksMatchSpec(container, 'PATH', { callerAttributes: ['data-probe'] });
  });

  it('UIC-PATH-2.5 shows the whole path in a tooltip only while it is cut', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    try {
      render(
        <>
          <Path path="/Garden/Vegetable beds/North side/Tomatoes" />
          <Path path="/Garden" />
        </>,
      );
      const long = requireDefined(
        screen
          .getByText('/Garden/Vegetable beds/North side/Tomatoes')
          .closest<HTMLElement>('.ui-path'),
      );
      const short = requireDefined(screen.getByText('/Garden').closest<HTMLElement>('.ui-path'));
      expect(long).toHaveClass('ui-path', 'ui-truncation-tooltip');
      setBox(long, { cut: true });
      setBox(short, { cut: false });
      await hover(user, short);
      expect(tooltip()).toBeNull();
      expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
      await hover(user, long);
      const panel = tooltip();
      expect(panel).toHaveTextContent('/Garden/Vegetable beds/North side/Tomatoes');
      expect(panel).toHaveClass('ui-truncation-tooltip__panel');
      expect(panel?.querySelector('bdi')).toHaveAttribute('dir', 'ltr');
      expect(long).not.toHaveAttribute('aria-describedby');
      expectHooksMatchSpec(document.body, 'PATH', { slots: 'all' });
      await user.unhover(long);
      expect(tooltip()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
