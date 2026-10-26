import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { SaveStatus } from './save-status.js';

function root(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

const label = (container: HTMLElement) => container.querySelector('.ui-save-status__label');

describe('SaveStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('UIC-SAVE-STATUS-1.1 words each phase and draws its glyph', () => {
    const { container, rerender } = render(<SaveStatus phase="idle" />);
    expect(root(container)).toHaveClass('ui-save-status');
    expect(root(container)).toHaveAttribute('data-phase', 'idle');
    expect(label(container)).toBeNull();
    const phases = [
      ['dirty', 'Unsaved changes', null],
      ['saving', 'Saving…', null],
      ['saved', 'Saved', 'check'],
      ['error', 'Not saved', 'error'],
      ['offline', 'Offline', 'offline'],
    ] as const;
    for (const [phase, text, glyph] of phases) {
      rerender(<SaveStatus phase={phase} />);
      expect(root(container)).toHaveAttribute('data-phase', phase);
      expect(label(container)).toHaveTextContent(text);
      expect(label(container)).toHaveClass('ui-truncation-tooltip');
      const icon = container.querySelector('.ui-save-status__icon');
      if (glyph) expect(icon?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', glyph);
      else expect(icon).toBeNull();
      expectHooksMatchSpec(container, 'SAVE-STATUS', { slots: ['message', 'label'] });
    }
  });

  it('UIC-SAVE-STATUS-1.1 takes per-phase labels and provider strings', () => {
    const { container, rerender } = render(
      <SaveStatus phase="error" labels={{ error: 'Not saved: the server is busy' }} />,
    );
    expect(label(container)).toHaveTextContent('Not saved: the server is busy');
    rerender(<SaveStatus phase="saved" labels={{ error: 'Not saved: the server is busy' }} />);
    expect(label(container)).toHaveTextContent('Saved');
    rerender(
      <UiProvider strings={{ saveStatus: (phase) => `État : ${phase}` }}>
        <SaveStatus phase="saving" />
      </UiProvider>,
    );
    expect(label(container)).toHaveTextContent('État : saving');
  });

  it('UIC-SAVE-STATUS-1.2 announces changes in a polite status region present in every phase', () => {
    const { container, rerender } = render(<SaveStatus phase="idle" />);
    const region = screen.getByRole('status');
    expect(region).toHaveClass('ui-save-status__message');
    expect(region).toBeEmptyDOMElement();
    rerender(<SaveStatus phase="saving" />);
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Saving…');
    expect(region.querySelector('.ui-save-status__icon')).toBeNull();
    rerender(<SaveStatus phase="saved" />);
    expect(region.querySelector('.ui-save-status__icon')).toHaveAttribute('aria-hidden', 'true');
    expect(root(container)).not.toHaveAttribute('role');
  });

  it('UIC-SAVE-STATUS-1.3 offers Retry after a failed save only', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { container, rerender } = render(<SaveStatus phase="error" onRetry={onRetry} />);
    const retry = screen.getByRole('button', { name: 'Retry' });
    expect(retry).toHaveClass('ui-save-status__retry', 'ui-button');
    expect(retry).toHaveAttribute('data-variant', 'link');
    expect(screen.getByRole('status')).not.toContainElement(retry);
    expectHooksMatchSpec(container, 'SAVE-STATUS', { slots: 'all' });
    await user.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<SaveStatus phase="offline" onRetry={onRetry} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<SaveStatus phase="error" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-SAVE-STATUS-1.4 shows the saved label until a zero-delay timer runs', () => {
    vi.useFakeTimers();
    render(<SaveStatus phase="saved" hideSavedAfter={0} />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('UIC-SAVE-STATUS-1.4 hides the saved label after the delay and restarts on change', async () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<SaveStatus phase="saving" hideSavedAfter={2000} />);
    rerender(<SaveStatus phase="saved" hideSavedAfter={2000} />);
    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(label(container)).toHaveTextContent('Saved');
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(label(container)).toBeNull();
    expect(root(container)).toHaveAttribute('data-phase', 'saved');
    expect(root(container)).not.toHaveAttribute('data-exiting');
    rerender(<SaveStatus phase="dirty" hideSavedAfter={2000} />);
    expect(label(container)).toHaveTextContent('Unsaved changes');
    rerender(<SaveStatus phase="saved" hideSavedAfter={2000} />);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(label(container)).toHaveTextContent('Saved');
    rerender(<SaveStatus phase="saved" />);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(label(container)).toHaveTextContent('Saved');
  });

  it('UIC-SAVE-STATUS-1.4 publishes the exit while the stylesheet animates it', async () => {
    vi.useFakeTimers();
    let finish: () => void = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const getAnimations = vi.spyOn(Element.prototype, 'getAnimations').mockImplementation(function (
      this: Element,
    ) {
      return this.classList.contains('ui-save-status')
        ? [{ finished } as unknown as Animation]
        : [];
    });
    const { container } = render(<SaveStatus phase="saved" hideSavedAfter={500} />);
    expect(root(container)).toHaveAttribute('data-entering', 'true');
    await act(async () => {
      finish();
      await finished;
    });
    expect(root(container)).not.toHaveAttribute('data-entering');
    getAnimations.mockReturnValue([{ finished: new Promise(() => {}) } as unknown as Animation]);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(root(container)).toHaveAttribute('data-exiting', 'true');
    expect(label(container)).toHaveTextContent('Saved');
    expectHooksMatchSpec(container, 'SAVE-STATUS');
  });

  it('UIC-SAVE-STATUS-1.5 UIC-SAVE-STATUS-1.6 forwards the class, id and data attributes', () => {
    const { container } = render(
      <SaveStatus phase="saving" className="extra" id="status" data-editor="notes" />,
    );
    expect(root(container)).toHaveClass('ui-save-status', 'extra');
    expect(root(container)).toHaveAttribute('id', 'status');
    expect(root(container)).toHaveAttribute('data-editor', 'notes');
    expect(label(container)).toHaveClass('ui-truncation-tooltip');
    expectHooksMatchSpec(container, 'SAVE-STATUS', { callerAttributes: ['data-editor'] });
  });
});
