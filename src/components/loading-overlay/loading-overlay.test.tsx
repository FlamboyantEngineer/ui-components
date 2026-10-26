import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { LoadingCard, LoadingOverlay, LoadingRegion } from './loading-overlay.js';

const card = () => document.querySelector<HTMLElement>('.ui-loading-card');

describe('LoadingCard', () => {
  it('UIC-LOADING-OVERLAY-1.1 shows the label, one bar and only the parts it is given', () => {
    const { rerender } = render(<LoadingCard />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    expect(card()?.querySelector('.ui-loading-card__description')).toBeNull();
    expect(card()?.querySelector('.ui-loading-card__footer')).toBeNull();
    expect(card()?.querySelector('.ui-loading-card__value')).toBeNull();
    expectHooksMatchSpec(document.body, 'LOADING-OVERLAY', {
      slots: ['header', 'label', 'progress'],
    });

    rerender(
      <LoadingCard
        label="Loading fields"
        description="Preparing the form."
        hint="Reading fruit list"
      />,
    );
    const status = screen.getByRole('status');
    expect(within(status).getByText('Loading fields')).toHaveClass('ui-loading-card__label');
    expect(within(status).getByText('Preparing the form.')).toHaveClass(
      'ui-loading-card__description',
    );
    expect(card()?.querySelector('.ui-loading-card__footer')).toHaveTextContent(
      'Reading fruit list',
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-size', 'md');
    expect(bar.querySelector('.ui-progress-bar__value')).toBeNull();
  });

  it('UIC-LOADING-OVERLAY-1.2 is indeterminate without measured progress', () => {
    const { rerender } = render(<LoadingCard label="Syncing" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-indeterminate', 'true');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(card()).not.toHaveAttribute('data-determinate');

    rerender(<LoadingCard label="Syncing" progress={{ value: 40, isIndeterminate: true }} />);
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(card()?.querySelector('.ui-loading-card__value')).toBeNull();
  });

  it('UIC-LOADING-OVERLAY-1.2 shows the bounded percentage for measured progress', () => {
    const { rerender } = render(
      <LoadingCard
        label="Loading report"
        progress={{ value: 42, valueLabel: 'Estimated progress: 42%' }}
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuetext', 'Estimated progress: 42%');
    expect(card()).toHaveAttribute('data-determinate', 'true');
    expect(
      card()?.querySelector('.ui-loading-card__header .ui-loading-card__value'),
    ).toHaveTextContent('42%');
    rerender(<LoadingCard label="Loading report" progress={{ value: 9, maxValue: 6 }} />);
    expect(card()?.querySelector('.ui-loading-card__value')).toHaveTextContent('100%');
    rerender(<LoadingCard label="Loading report" progress={{ value: 3, maxValue: 0 }} />);
    expect(card()?.querySelector('.ui-loading-card__value')).toHaveTextContent('0%');
    expectHooksMatchSpec(document.body, 'LOADING-OVERLAY', { slots: ['value'] });
  });

  it('UIC-LOADING-OVERLAY-1.3 counts valid steps only', () => {
    const { rerender } = render(<LoadingCard step={{ current: 6, total: 9 }} />);
    expect(
      card()?.querySelector('.ui-loading-card__footer .ui-loading-card__step'),
    ).toHaveTextContent('6 of 9');
    for (const step of [
      { current: 0, total: 9 },
      { current: 10, total: 9 },
      { current: 1.5, total: 3 },
    ]) {
      rerender(<LoadingCard step={step} />);
      expect(card()?.querySelector('.ui-loading-card__step')).toBeNull();
      expect(card()?.querySelector('.ui-loading-card__footer')).toBeNull();
    }
    rerender(
      <UiProvider strings={{ stepOfTotal: (current, total) => `${current}/${total}` }}>
        <LoadingCard step={{ current: 2, total: 5 }} />
      </UiProvider>,
    );
    expect(card()?.querySelector('.ui-loading-card__step')).toHaveTextContent('2/5');
  });

  it('UIC-LOADING-OVERLAY-1.4 announces the label politely and keeps progress quiet', () => {
    const { rerender } = render(
      <LoadingCard
        label="Loading report"
        hint="Measuring pages"
        step={{ current: 2, total: 3 }}
        progress={{ value: 10 }}
      />,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status.querySelector('.ui-loading-card__progress')).toHaveAttribute('aria-live', 'off');
    expect(status.querySelector('.ui-loading-card__footer')).toHaveAttribute('aria-live', 'off');
    expect(status.querySelector('.ui-loading-card__value')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Loading report');
    rerender(
      <LoadingCard
        label="Loading report"
        progress={{ value: 10, 'aria-label': 'Estimated loading progress' }}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Estimated loading progress');
    rerender(
      <LoadingCard label="Preparing" progress={{ isIndeterminate: true, 'aria-label': 'Files' }} />,
    );
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('Files');
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('UIC-LOADING-OVERLAY-1.5 renders the hint as a truncation tooltip', () => {
    render(<LoadingCard hint="Laying out pages" />);
    const hint = screen.getByText('Laying out pages');
    expect(hint).toHaveClass('ui-truncation-tooltip', 'ui-loading-card__hint');
    expectHooksMatchSpec(document.body, 'LOADING-OVERLAY', { slots: ['footer', 'hint'] });
  });
});

describe('LoadingOverlay', () => {
  it('UIC-LOADING-OVERLAY-2.1 covers its surface with the status card', () => {
    const { container } = render(
      <LoadingOverlay label="Loading table" description="Fetching cities" />,
    );
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay).toHaveClass('ui-loading-overlay');
    expect(overlay).toHaveAttribute('data-presentation', 'card');
    expect(overlay).not.toHaveAttribute('aria-hidden');
    expect(within(overlay).getByRole('status')).toHaveTextContent('Loading table');
    expect(within(overlay).getByRole('progressbar')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'LOADING-OVERLAY');
  });

  it('UIC-LOADING-OVERLAY-2.2 draws a hidden scrim without card or status', () => {
    const { container } = render(
      <LoadingOverlay label="Loading side panel" presentation="scrim" />,
    );
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay).toHaveAttribute('data-presentation', 'scrim');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay).toBeEmptyDOMElement();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('LoadingRegion', () => {
  it('UIC-LOADING-OVERLAY-3.1 marks itself busy, makes content inert and shows the overlay while loading', async () => {
    const onPress = vi.fn();
    const { rerender, container } = render(
      <LoadingRegion label="Saving">
        <button type="button" onClick={onPress}>
          Apply
        </button>
      </LoadingRegion>,
    );
    const region = container.firstElementChild as HTMLElement;
    const content = region.querySelector('.ui-loading-region__content');
    expect(region).not.toHaveAttribute('aria-busy');
    expect(region).not.toHaveAttribute('data-loading');
    expect(content).not.toHaveAttribute('inert');
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();

    rerender(
      <LoadingRegion label="Saving" isLoading hint="Writing" step={{ current: 1, total: 2 }}>
        <button type="button" onClick={onPress}>
          Apply
        </button>
      </LoadingRegion>,
    );
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('data-loading', 'true');
    expect(content).toHaveAttribute('inert');
    const overlay = region.querySelector(':scope > .ui-loading-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.closest('[inert]')).toBeNull();
    expect(within(region).getByRole('status')).toHaveTextContent('Saving');
    expect(region.querySelector('.ui-loading-card__step')).toHaveTextContent('1 of 2');
    expectHooksMatchSpec(container, 'LOADING-OVERLAY', { slots: ['content'] });

    rerender(
      <LoadingRegion label="Saving">
        <button type="button" onClick={onPress}>
          Apply
        </button>
      </LoadingRegion>,
    );
    expect(region).not.toHaveAttribute('aria-busy');
    expect(content).not.toHaveAttribute('inert');
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('UIC-LOADING-OVERLAY-3.1 keeps keyboard focus on the region while blocking and returns it after', async () => {
    const user = userEvent.setup();
    const regionWith = (isLoading: boolean) => (
      <>
        <LoadingRegion label="Saving" isLoading={isLoading}>
          <button type="button">Apply</button>
        </LoadingRegion>
        <button type="button">Elsewhere</button>
      </>
    );
    const { container, rerender } = render(regionWith(false));
    const region = container.querySelector<HTMLElement>('.ui-loading-region');
    const apply = screen.getByRole('button', { name: 'Apply' });
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    expect(region).not.toHaveAttribute('tabindex');
    await user.click(apply);

    rerender(regionWith(true));
    expect(region).toHaveFocus();
    expect(region).toHaveAttribute('tabindex', '-1');
    rerender(regionWith(false));
    expect(apply).toHaveFocus();
    expect(region).not.toHaveAttribute('tabindex');

    rerender(regionWith(true));
    expect(region).toHaveFocus();
    await user.click(elsewhere);
    rerender(regionWith(false));
    expect(elsewhere).toHaveFocus();
    rerender(regionWith(true));
    expect(elsewhere).toHaveFocus();
  });

  it('UIC-LOADING-OVERLAY-3.1 passes the scrim presentation to its overlay', () => {
    const { container } = render(
      <LoadingRegion isLoading presentation="scrim" label="Loading">
        Content
      </LoadingRegion>,
    );
    expect(container.querySelector('.ui-loading-overlay')).toHaveAttribute(
      'data-presentation',
      'scrim',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Loading overlay hooks', () => {
  it('UIC-LOADING-OVERLAY-4.1 appends caller classes and forwards id and data attributes to each root', () => {
    const { container } = render(
      <>
        <LoadingCard className="caller-card" id="card" data-probe="card" />
        <LoadingOverlay className="caller-overlay" id="overlay" data-probe="overlay" />
        <LoadingRegion
          className="caller-region"
          id="region"
          data-probe="region"
          data-loading="caller"
          isLoading
        >
          Body
        </LoadingRegion>
      </>,
    );
    const card = container.querySelector('.caller-card');
    expect(card).toHaveClass('ui-loading-card', 'caller-card');
    expect(card).toHaveAttribute('id', 'card');
    expect(card).toHaveAttribute('data-probe', 'card');
    const overlay = container.querySelector('.caller-overlay');
    expect(overlay).toHaveClass('ui-loading-overlay', 'caller-overlay');
    expect(overlay).toHaveAttribute('id', 'overlay');
    expect(overlay).toHaveAttribute('data-probe', 'overlay');
    expect(overlay?.querySelector('[data-probe]')).toBeNull();
    const region = screen.getByText('Body').closest('.caller-region');
    expect(region).toHaveClass('ui-loading-region', 'caller-region');
    expect(region).toHaveAttribute('id', 'region');
    expect(region).toHaveAttribute('data-loading', 'true');
    expect(region).toHaveAttribute('data-probe', 'region');
    expect(region?.querySelector('[data-probe]')).toBeNull();
    expectHooksMatchSpec(document.body, 'LOADING-OVERLAY', { callerAttributes: ['data-probe'] });
  });
});

describe('LoadingOverlay presence', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete (Element.prototype as Partial<Element>).getAnimations;
  });

  it('UIC-LOADING-OVERLAY-2.3 covers the viewport from a portal when fullscreen', () => {
    const { container } = render(<LoadingOverlay fullscreen label="Opening the cookbook" />);
    expect(container.querySelector('.ui-loading-overlay')).toBeNull();
    const cover = document.querySelector('.ui-loading-overlay') as HTMLElement;
    expect(cover).toHaveAttribute('data-fullscreen', 'true');
    expect(cover.parentElement).toHaveClass('ui-portal');
    expect(cover.parentElement).toHaveAttribute('data-layer', 'modal');
    expect(within(cover).getByRole('status')).toHaveTextContent('Opening the cookbook');
    expectHooksMatchSpec(document.body, 'LOADING-OVERLAY');
  });

  it('UIC-LOADING-OVERLAY-2.3 keeps a full-screen region inert while it loads', () => {
    render(
      <LoadingRegion isLoading fullscreen label="Loading">
        <button type="button">Edit</button>
      </LoadingRegion>,
    );
    const region = document.querySelector('.ui-loading-region') as HTMLElement;
    expect(region.querySelector('.ui-loading-region__content')).toHaveAttribute('inert');
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();
    expect(document.querySelector('.ui-portal .ui-loading-overlay')).toHaveAttribute(
      'data-fullscreen',
      'true',
    );
  });

  it('UIC-LOADING-OVERLAY-2.4 publishes entering and exiting and keeps the region cover through its exit', async () => {
    const { container, rerender } = render(<LoadingOverlay isEntering label="Loading" />);
    const cover = () => container.querySelector('.ui-loading-overlay');
    expect(cover()).toHaveAttribute('data-entering', 'true');
    rerender(<LoadingOverlay isExiting label="Loading" />);
    expect(cover()).toHaveAttribute('data-exiting', 'true');
    expect(cover()).not.toHaveAttribute('data-entering');
    expectHooksMatchSpec(container, 'LOADING-OVERLAY');

    let finish = () => {};
    const exit = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let animations: Array<{ finished: Promise<void> }> = [];
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: () => animations,
    });
    rerender(
      <LoadingRegion isLoading label="Loading">
        Content
      </LoadingRegion>,
    );
    expect(cover()).not.toHaveAttribute('data-exiting');
    animations = [{ finished: exit }];
    rerender(<LoadingRegion label="Loading">Content</LoadingRegion>);
    const region = container.querySelector('.ui-loading-region');
    expect(region).not.toHaveAttribute('aria-busy');
    expect(region?.querySelector('.ui-loading-region__content')).not.toHaveAttribute('inert');
    expect(cover()).toHaveAttribute('data-exiting', 'true');
    await act(async () => {
      finish();
      await exit;
    });
    expect(cover()).toBeNull();
  });

  it('UIC-LOADING-OVERLAY-3.2 blocks only once loading outlasts the delay', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(
      <LoadingRegion isLoading delay={300} label="Loading">
        <button type="button">Edit</button>
      </LoadingRegion>,
    );
    const region = container.querySelector('.ui-loading-region') as HTMLElement;
    const content = region.querySelector('.ui-loading-region__content');
    expect(region).not.toHaveAttribute('aria-busy');
    expect(region).not.toHaveAttribute('data-loading');
    expect(content).not.toHaveAttribute('inert');
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(content).toHaveAttribute('inert');
    expect(region.querySelector('.ui-loading-overlay')).not.toBeNull();

    rerender(
      <LoadingRegion delay={300} label="Loading">
        <button type="button">Edit</button>
      </LoadingRegion>,
    );
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();
    rerender(
      <LoadingRegion isLoading delay={300} label="Loading">
        <button type="button">Edit</button>
      </LoadingRegion>,
    );
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender(
      <LoadingRegion delay={300} label="Loading">
        <button type="button">Edit</button>
      </LoadingRegion>,
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(region).not.toHaveAttribute('aria-busy');
    expect(region.querySelector('.ui-loading-overlay')).toBeNull();

    rerender(<LoadingOverlay delay={300} label="Loading" />);
    expect(container.querySelector('.ui-loading-overlay')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(container.querySelector('.ui-loading-overlay')).not.toBeNull();
  });
});
