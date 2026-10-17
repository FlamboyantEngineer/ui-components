import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { LoadMore } from './load-more.js';

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
      <UiProvider
        strings={{ loadMore: 'Charger plus', remainingCount: (count) => `${count} restants` }}
      >
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
    expect(button.getAttribute('aria-label')).toContain(button.textContent ?? '');
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
    expect(button).not.toBeDisabled();
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
      <LoadMore className="caller" id="more" ref={ref} data-testid="probe" data-size="caller" />,
    );
    const button = screen.getByTestId('probe');
    expect(button).toHaveClass('ui-button', 'ui-load-more', 'caller');
    expect(button).toHaveAttribute('id', 'more');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(ref.current).toBe(button);
    expectHooksMatchSpec(container, 'LOAD-MORE');
  });
});
