import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { InlineError } from './inline-error.js';

describe('InlineError', () => {
  it('UIC-INLINE-ERROR-1.1 owns one atomic, assertive alert around rich content', () => {
    const { container } = render(
      <InlineError>
        <ul>
          <li>Choose a folder</li>
          <li>Enter a name</li>
        </ul>
      </InlineError>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBe(container.firstElementChild);
    expect(alert.tagName).toBe('DIV');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
    expect(alert.querySelectorAll('.ui-inline-error__message li')).toHaveLength(2);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(alert.querySelectorAll('[aria-live], [role="status"]')).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
    expectHooksMatchSpec(container, 'INLINE-ERROR', { slots: ['icon', 'message'] });
  });

  it('UIC-INLINE-ERROR-1.2 draws a decorative error glyph before the message', () => {
    const { container } = render(<InlineError>Unavailable</InlineError>);
    const icon = container.querySelector('.ui-inline-error__icon');
    expect(icon).toHaveClass('ui-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('data-glyph', 'error');
    expect(icon?.nextElementSibling).toHaveClass('ui-inline-error__message');
  });

  it('UIC-INLINE-ERROR-1.3 draws a small secondary recovery button that never submits', async () => {
    const onRetry = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { container, rerender } = render(
      <form onSubmit={onSubmit}>
        <InlineError onRetry={onRetry}>Unavailable</InlineError>
      </form>,
    );
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toHaveClass('ui-button', 'ui-inline-error__retry');
    expect(retry).toHaveAttribute('type', 'button');
    expect(retry).toHaveAttribute('data-variant', 'secondary');
    expect(retry).toHaveAttribute('data-size', 'sm');
    await userEvent.click(retry);
    retry.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onSubmit).not.toHaveBeenCalled();
    expectHooksMatchSpec(container, 'INLINE-ERROR', { slots: 'all' });

    rerender(
      <UiProvider strings={{ retry: 'Réessayer' }}>
        <InlineError onRetry={onRetry}>Indisponible</InlineError>
        <InlineError onRetry={onRetry} retryLabel="Reload versions">
          Unavailable
        </InlineError>
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload versions' })).toBeInTheDocument();
  });

  it('UIC-INLINE-ERROR-1.4 refuses disabled recovery and stays pending while a retry runs', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <InlineError onRetry={onRetry} isRetryDisabled>
        Unavailable
      </InlineError>,
    );
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toBeDisabled();
    await userEvent.click(retry);
    expect(onRetry).not.toHaveBeenCalled();

    let settle: () => void = () => {};
    const slow = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    rerender(<InlineError onRetry={slow}>Unavailable</InlineError>);
    expect(screen.getByRole('button')).toBe(retry);
    await userEvent.click(retry);
    expect(retry).toHaveAttribute('data-pending', 'true');
    await userEvent.click(retry);
    expect(slow).toHaveBeenCalledTimes(1);
    settle();
    await waitFor(() => expect(retry).not.toHaveAttribute('data-pending'));

    const onRetryError = vi.fn();
    const failure = new Error('still offline');
    rerender(
      <InlineError onRetry={() => Promise.reject(failure)} onRetryError={onRetryError}>
        Unavailable
      </InlineError>,
    );
    await userEvent.click(retry);
    await waitFor(() => expect(onRetryError).toHaveBeenCalledWith(failure));
  });

  it('UIC-INLINE-ERROR-1.5 hides natively and forwards id, class and data attributes', () => {
    const { container, rerender } = render(
      <InlineError id="error" className="caller" data-testid="probe">
        Unavailable
      </InlineError>,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-inline-error', 'caller');
    expect(root).toHaveAttribute('id', 'error');
    expectHooksMatchSpec(container, 'INLINE-ERROR', { callerAttributes: [] });

    rerender(
      <InlineError id="error" className="caller" data-testid="probe" hidden>
        Unavailable
      </InlineError>,
    );
    expect(screen.getByTestId('probe')).toBe(root);
    expect(root.hidden).toBe(true);
    expect(root).toHaveTextContent('Unavailable');
  });
});
