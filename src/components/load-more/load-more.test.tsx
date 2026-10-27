import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { LoadMore } from './load-more.js';

/** Whether the control is in view; a new observation reports it, like a real observer. */
let controlInView = false;

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  target: Element | null = null;
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly init?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target: Element): void {
    this.target = target;
    queueMicrotask(() => this.report());
  }
  unobserve(): void {}
  disconnect(): void {
    this.target = null;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  report(): void {
    if (!this.target) return;
    const entry = {
      target: this.target,
      isIntersecting: controlInView,
    } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

/** Reports the control entering or leaving the view to the observers watching it. */
/** Lets pending effects and promise callbacks settle inside act. */
const flush = () => act(() => Promise.resolve());

function setInView(isIntersecting: boolean) {
  controlInView = isIntersecting;
  act(() => {
    for (const observer of FakeIntersectionObserver.instances) observer.report();
  });
}

function deferred() {
  let resolve: () => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<void>((settle, fail) => {
    resolve = settle;
    reject = fail;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  FakeIntersectionObserver.instances = [];
  controlInView = false;
  vi.unstubAllGlobals();
});

describe('LoadMore', () => {
  it('UIC-LOAD-MORE-1.1 renders a small secondary button that loads without submitting', async () => {
    const onLoadMore = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container } = render(
      <form onSubmit={onSubmit}>
        <LoadMore onLoadMore={onLoadMore} />
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Load more' });
    expect(button).toHaveClass('ui-button', 'ui-load-more');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'sm');
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(3));
    expect(onSubmit).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'LOAD-MORE');
  });

  it('UIC-LOAD-MORE-1.1 accepts another variant and size', () => {
    render(<LoadMore variant="ghost" size="md" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('UIC-LOAD-MORE-1.2 shows an authoritative remaining count without inventing one', () => {
    const { rerender } = render(<LoadMore />);
    const cases: Array<[number | undefined, string]> = [
      [undefined, 'Load more'],
      [0, 'Load more (0 remaining)'],
      [123, 'Load more (123 remaining)'],
      [1.9, 'Load more (1 remaining)'],
      [-1, 'Load more'],
      [Number.NaN, 'Load more'],
      [Number.POSITIVE_INFINITY, 'Load more'],
    ];
    for (const [remainingCount, text] of cases) {
      rerender(<LoadMore remainingCount={remainingCount} />);
      expect(screen.getByRole('button')).toHaveTextContent(text);
      expect(screen.getByRole('button', { name: text })).toBeInTheDocument();
    }
    rerender(
      <UiProvider messages={{ loadMore: 'Charger plus', remainingCount: '{count} restants' }}>
        <LoadMore remainingCount={4} />
        <LoadMore label="Show older messages" />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Charger plus (4 restants)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show older messages' })).toBeInTheDocument();
  });

  it('UIC-LOAD-MORE-1.3 names the collection after the complete visible text', () => {
    const { rerender } = render(<LoadMore itemLabel=" conversations " />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Load more conversations');
    rerender(<LoadMore itemLabel="messages" remainingCount={12} />);
    const button = screen.getByRole('button', { name: 'Load more (12 remaining) messages' });
    expect(button).toHaveAttribute('aria-label', expect.stringContaining(button.textContent ?? ''));
    rerender(<LoadMore itemLabel="  " />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-label');
  });

  it('UIC-LOAD-MORE-1.4 keeps focus, text and count while pending and refuses presses', async () => {
    const onLoadMore = vi.fn();
    const { container, rerender } = render(
      <LoadMore onLoadMore={onLoadMore} remainingCount={12} itemLabel="results" />,
    );
    const button = screen.getByRole('button');
    button.focus();
    rerender(
      <LoadMore onLoadMore={onLoadMore} remainingCount={12} itemLabel="results" isPending />,
    );
    expect(button).toHaveFocus();
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveTextContent('Load more (12 remaining)');
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toHaveClass('ui-button__spinner');
    expect(container.querySelector('[aria-live], [role="status"]')).toBeNull();
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    expect(onLoadMore).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'LOAD-MORE');

    rerender(<LoadMore onLoadMore={onLoadMore} remainingCount={12} itemLabel="results" />);
    expect(button).not.toHaveAttribute('data-pending');
    await userEvent.click(button);
    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
  });

  it('UIC-LOAD-MORE-1.4 stays pending while a returned request runs and reports failures', async () => {
    let settle: () => void = () => {};
    const request = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    const { rerender } = render(<LoadMore onLoadMore={request} pendingLabel="Fetching" />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('progressbar', { name: 'Fetching' })).toBeInTheDocument();
    await userEvent.click(button);
    expect(request).toHaveBeenCalledTimes(1);
    settle();
    await waitFor(() => expect(button).not.toHaveAttribute('data-pending'));

    const failure = new Error('offline');
    const onError = vi.fn();
    rerender(<LoadMore onLoadMore={() => Promise.reject(failure)} onError={onError} />);
    await userEvent.click(button);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
  });

  it('UIC-LOAD-MORE-1.5 stays disabled independently of pending', async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<LoadMore onLoadMore={onLoadMore} isDisabled isPending />);
    const button = screen.getByRole('button');
    rerender(<LoadMore onLoadMore={onLoadMore} isDisabled />);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('data-disabled', 'true');
    await userEvent.click(button);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('UIC-LOAD-MORE-1.6 appends the caller class and forwards id, ref and data attributes', () => {
    const ref = { current: null as HTMLButtonElement | null };
    const { container } = render(
      <LoadMore className="caller" id="more" ref={ref} data-probe="more" data-size="caller" />,
    );
    const button = screen.getByRole('button', { name: 'Load more' });
    expect(button).toHaveAttribute('data-probe', 'more');
    expect(button).toHaveClass('ui-button', 'ui-load-more', 'caller');
    expect(button).toHaveAttribute('id', 'more');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(ref.current).toBe(button);
    expectHooksMatchSpec(container, 'LOAD-MORE', { callerAttributes: ['data-probe'] });
  });

  it('UIC-LOAD-MORE-1.7 loads each time it comes into view, one request at a time', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const requests: Array<ReturnType<typeof deferred>> = [];
    const onLoadMore = vi.fn(() => {
      const request = deferred();
      requests.push(request);
      return request.promise;
    });
    render(<LoadMore autoLoad onLoadMore={onLoadMore} />);
    const button = screen.getByRole('button', { name: 'Load more' });
    await flush();
    expect(onLoadMore).not.toHaveBeenCalled();

    setInView(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).not.toHaveFocus();
    setInView(false);
    setInView(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    await act(async () => requests[0]?.resolve());
    expect(button).not.toHaveAttribute('data-pending');
    // Staying in view after the page arrived does not load again on its own.
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    setInView(false);
    setInView(true);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
    await act(async () => requests[1]?.resolve());
  });

  it('UIC-LOAD-MORE-1.7 retries a failed request when the control comes back into view', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const onError = vi.fn();
    const onLoadMore = vi.fn(() => Promise.reject(new Error('Offline')));
    render(<LoadMore autoLoad onLoadMore={onLoadMore} onError={onError} />);
    setInView(true);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button')).not.toHaveAttribute('data-pending');
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(2));
    setInView(false);
    setInView(true);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(3));
  });

  it('UIC-LOAD-MORE-1.7 does not observe without autoLoad or while disabled', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    setInView(true);
    const onLoadMore = vi.fn();
    const { rerender } = render(<LoadMore onLoadMore={onLoadMore} />);
    rerender(<LoadMore autoLoad isDisabled onLoadMore={onLoadMore} />);
    await flush();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    rerender(<LoadMore autoLoad isPending onLoadMore={onLoadMore} />);
    await flush();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(onLoadMore).not.toHaveBeenCalled();
    rerender(<LoadMore autoLoad onLoadMore={onLoadMore} />);
    setInView(false);
    setInView(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('UIC-LOAD-MORE-1.8 loads ahead within the scroll offset of its scrolling container', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const onLoadMore = vi.fn();
    const { rerender } = render(<LoadMore autoLoad onLoadMore={onLoadMore} />);
    expect(FakeIntersectionObserver.instances.at(-1)?.init).toBeUndefined();
    rerender(<LoadMore autoLoad scrollOffset={1} onLoadMore={onLoadMore} />);
    expect(FakeIntersectionObserver.instances.at(-1)?.init).toEqual({
      root: null,
      rootMargin: '0px 100% 100% 100%',
    });
    setInView(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    await flush();
  });
});
