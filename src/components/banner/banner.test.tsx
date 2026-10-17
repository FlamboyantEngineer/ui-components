import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { Banner, type BannerTone } from './banner.js';

const tones: BannerTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

describe('Banner', () => {
  it('UIC-BANNER-1.1 renders title, rich description and actions in order', () => {
    const { container } = render(
      <Banner
        tone="info"
        title="New version available"
        description={<strong>Reload to update.</strong>}
        actions={<a href="#reload">Reload</a>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    const content = root.querySelector('.ui-banner__content');
    expect(content?.querySelector('.ui-banner__title')).toHaveTextContent('New version available');
    expect(content?.querySelector('.ui-banner__description strong')).toHaveTextContent(
      'Reload to update.',
    );
    const actions = root.querySelector('.ui-banner__actions');
    expect(actions?.previousElementSibling).toBe(content);
    expect(screen.getByRole('link', { name: 'Reload' })).toHaveAttribute('href', '#reload');
    expectHooksMatchSpec(container, 'BANNER', {
      slots: ['icon', 'content', 'title', 'description', 'actions'],
    });
  });

  it('UIC-BANNER-1.1 renders no slot for empty values', () => {
    const { container } = render(<Banner title="" description="Saved" actions={false} />);
    expect(container.querySelector('.ui-banner__title')).toBeNull();
    expect(container.querySelector('.ui-banner__actions')).toBeNull();
    expect(container.querySelector('.ui-banner__description')).toHaveTextContent('Saved');
  });

  it('UIC-BANNER-1.2 publishes the tone and draws its glyph, a replacement or none', () => {
    const { container, rerender } = render(<Banner description="Note" />);
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'neutral');
    expect(container.querySelector('.ui-banner__icon')).toBeNull();
    const expected = { info: 'info', success: 'success', warning: 'warning', danger: 'error' };
    for (const [tone, glyph] of Object.entries(expected)) {
      rerender(<Banner tone={tone as BannerTone} description="Note" />);
      const icon = container.querySelector('.ui-banner__icon');
      expect(container.firstElementChild).toHaveAttribute('data-tone', tone);
      expect(icon).toHaveClass('ui-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('data-glyph', glyph);
      expectHooksMatchSpec(container, 'BANNER', { slots: ['icon'] });
    }
    rerender(<Banner tone="info" icon="restore" description="Note" />);
    expect(container.querySelector('.ui-banner__icon')).toHaveAttribute('data-glyph', 'restore');
    rerender(<Banner tone="info" icon={<svg data-testid="custom" />} description="Note" />);
    expect(screen.getByTestId('custom').parentElement).toHaveClass('ui-banner__icon');
    rerender(<Banner tone="danger" icon={null} description="Note" />);
    expect(container.querySelector('.ui-banner__icon')).toBeNull();
  });

  it('UIC-BANNER-1.3 dismisses once per activation with a named button', async () => {
    const onDismiss = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container, rerender } = render(
      <form onSubmit={onSubmit}>
        <Banner tone="warning" description="Template changed" onDismiss={onDismiss} />
      </form>,
    );
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    expect(dismiss).toHaveClass('ui-icon-button', 'ui-banner__dismiss');
    expect(dismiss).toHaveAttribute('type', 'button');
    await userEvent.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    dismiss.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onDismiss).toHaveBeenCalledTimes(3);
    expect(onSubmit).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'BANNER', { slots: ['dismiss'] });

    rerender(
      <UiProvider strings={{ dismiss: 'Ignorer' }}>
        <Banner description="Note" onDismiss={onDismiss} />
        <Banner description="Note" onDismiss={onDismiss} dismissLabel="Dismiss template warning" />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Ignorer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss template warning' })).toBeInTheDocument();

    rerender(<Banner description="Note" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('UIC-BANNER-1.4 renders phrasing content when inline', () => {
    const { container } = render(
      <strong>
        <Banner
          inline
          tone="danger"
          icon={null}
          title="Offline"
          description="Changes are kept locally"
          aria-label="Connection lost"
          onDismiss={() => {}}
        />
      </strong>,
    );
    const root = container.querySelector('.ui-banner') as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveAttribute('data-inline', 'true');
    expect(root.querySelector('div')).toBeNull();
    expect(root).toHaveAttribute('role', 'alert');
    expect(root).toHaveAttribute('aria-label', 'Connection lost');
    expectHooksMatchSpec(container, 'BANNER', { slots: ['content', 'title', 'description'] });
  });

  it('UIC-BANNER-2.1 announces danger as an assertive alert and every other tone as a polite status', () => {
    const { container, rerender } = render(<Banner description="Note" />);
    for (const tone of tones) {
      rerender(<Banner tone={tone} description="Note" />);
      const root = container.firstElementChild;
      const urgent = tone === 'danger';
      expect(root).toHaveAttribute('role', urgent ? 'alert' : 'status');
      expect(root).toHaveAttribute('aria-live', urgent ? 'assertive' : 'polite');
      expect(root).toHaveAttribute('aria-atomic', 'true');
      expect(screen.getByRole(urgent ? 'alert' : 'status')).toBe(root);
    }
  });

  it('UIC-BANNER-2.2 updates tone and content on the same live region', () => {
    const { container, rerender } = render(
      <Banner id="sync" tone="info" description="Saving changes" />,
    );
    const region = container.firstElementChild;
    for (const [tone, text] of [
      ['success', 'All changes saved'],
      ['danger', 'Could not save'],
      ['warning', 'Saved with warnings'],
      ['info', 'Saving changes'],
    ] as const) {
      rerender(<Banner id="sync" tone={tone} description={text} />);
      expect(container.firstElementChild).toBe(region);
      expect(region).toHaveTextContent(text);
      expect(region).toHaveAttribute('role', tone === 'danger' ? 'alert' : 'status');
      for (const decorative of region?.querySelectorAll('.ui-banner__icon') ?? []) {
        expect(decorative).toHaveAttribute('aria-hidden', 'true');
      }
    }
  });

  it('UIC-BANNER-3.1 replaces the glyph with a decorative spinner and marks the region busy', () => {
    const { container, rerender } = render(<Banner tone="info" description="Working" isPending />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('data-pending', 'true');
    expect(container.querySelector('.ui-banner__icon')).toBeNull();
    expect(container.querySelector('.ui-banner__spinner')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expectHooksMatchSpec(container, 'BANNER', { slots: ['spinner'] });

    rerender(<Banner tone="info" description="Done" />);
    expect(root).not.toHaveAttribute('aria-busy');
    expect(root).not.toHaveAttribute('data-pending');
    expect(container.querySelector('.ui-banner__spinner')).toBeNull();
  });

  it('UIC-BANNER-3.2 publishes exiting and hides natively on the same element', () => {
    const { container, rerender } = render(<Banner description="Saved" isExiting />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-exiting', 'true');
    expectHooksMatchSpec(container, 'BANNER');
    rerender(<Banner description="Saved" hidden />);
    expect(container.firstElementChild).toBe(root);
    expect(root.hidden).toBe(true);
    expect(root).not.toHaveAttribute('data-exiting');
    rerender(<Banner description="Saved" />);
    expect(root.hidden).toBe(false);
  });

  it('UIC-BANNER-3.2 publishes entering, and with useEnterExit stays mounted through its exit', async () => {
    const { container, rerender } = render(<Banner description="Saved" isEntering />);
    expect(container.firstElementChild).toHaveAttribute('data-entering', 'true');
    expectHooksMatchSpec(container, 'BANNER');

    let finishFade = () => {};
    const fade = new Promise<void>((resolve) => {
      finishFade = resolve;
    });
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value(this: Element) {
        return this.hasAttribute('data-exiting') ? [{ finished: fade }] : [];
      },
    });
    function Notice({ isOpen }: { isOpen: boolean }) {
      const ref = useRef<HTMLElement>(null);
      const { isMounted, isEntering, isExiting } = useEnterExit(ref, isOpen);
      return isMounted ? (
        <Banner ref={ref} description="Saved" isEntering={isEntering} isExiting={isExiting} />
      ) : null;
    }
    try {
      rerender(<Notice isOpen />);
      const root = screen.getByRole('status');
      expect(root).not.toHaveAttribute('data-entering');
      rerender(<Notice isOpen={false} />);
      expect(screen.getByRole('status')).toBe(root);
      expect(root).toHaveAttribute('data-exiting', 'true');
      await act(async () => finishFade());
      expect(screen.queryByRole('status')).toBeNull();
    } finally {
      delete (Element.prototype as Partial<Element>).getAnimations;
    }
  });

  it('UIC-BANNER-3.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <Banner
        description="Note"
        className="caller"
        id="notice"
        data-testid="probe"
        data-tone="caller"
      />,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-banner', 'caller');
    expect(root).toHaveAttribute('id', 'notice');
    expect(root).toHaveAttribute('data-tone', 'neutral');
    expectHooksMatchSpec(container, 'BANNER');
  });
});
