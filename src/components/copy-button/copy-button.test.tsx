import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { CopyButton } from './copy-button.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('CopyButton', () => {
  it('UIC-COPY-BUTTON-1.1 copies its value and shows and announces the outcome', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onCopy = vi.fn();
    const { container } = render(
      <CopyButton value="  Report.pdf " onCopy={onCopy} timeout={1000} />,
    );
    const button = screen.getByRole('button', { name: 'Copy' });
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-copy-button');
    expect(button).toHaveClass('ui-copy-button__button', 'ui-button');
    expect(button.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'copy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(button);
    expect(await navigator.clipboard.readText()).toBe('  Report.pdf ');
    expect(onCopy).toHaveBeenCalledWith(true);
    expect(root).toHaveAttribute('data-copied', 'true');
    expect(button).toHaveAccessibleName('Copy');
    expect(button.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'check');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    expectHooksMatchSpec(container, 'COPY-BUTTON', { slots: 'all' });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(root).not.toHaveAttribute('data-copied');
    expect(button.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'copy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('UIC-COPY-BUTTON-1.1 announces a second copy within the timeout', async () => {
    const user = userEvent.setup();
    const { container } = render(<CopyButton value="City" />);
    const button = screen.getByRole('button', { name: 'Copy' });
    const status = screen.getByRole('status');
    await user.click(button);
    expect(status).toHaveTextContent('Copied');
    const changes: MutationRecord[] = [];
    const observer = new MutationObserver((records) => changes.push(...records));
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    try {
      await user.click(button);
      await act(async () => undefined);
      expect(changes.length).toBeGreaterThan(0);
      expect(status).toHaveTextContent('Copied');
    } finally {
      observer.disconnect();
    }
    expect(container.firstElementChild).toHaveAttribute('data-copied', 'true');
  });

  it('UIC-COPY-BUTTON-1.2 shows and announces a refused copy', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    const onCopy = vi.fn();
    const { container } = render(<CopyButton value="Secret" onCopy={onCopy} />);
    await user.click(screen.getByRole('button'));
    expect(onCopy).toHaveBeenCalledWith(false);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-failed', 'true');
    expect(root.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'error');
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
    expectHooksMatchSpec(container, 'COPY-BUTTON');
  });

  it('UIC-COPY-BUTTON-1.1 reports every overlapping write while keeping the latest feedback', async () => {
    const user = userEvent.setup();
    let refuseEarlier: ((error: Error) => void) | undefined;
    vi.spyOn(navigator.clipboard, 'writeText')
      .mockImplementationOnce(
        () => new Promise<void>((_resolve, reject) => (refuseEarlier = reject)),
      )
      .mockResolvedValueOnce();
    const onCopy = vi.fn();
    render(<CopyButton value="City" onCopy={onCopy} />);
    const button = screen.getByRole('button', { name: 'Copy' });
    await user.click(button);
    await user.click(button);
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    expect(onCopy).toHaveBeenCalledExactlyOnceWith(true);
    await act(async () => refuseEarlier?.(new Error('Denied')));
    expect(onCopy.mock.calls).toEqual([[true], [false]]);
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('UIC-COPY-BUTTON-1.1 neither copies nor announces an earlier refused write of a changed value', async () => {
    const user = userEvent.setup();
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
    let refuseEarlier: ((error: Error) => void) | undefined;
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockImplementationOnce(
        () => new Promise<void>((_resolve, reject) => (refuseEarlier = reject)),
      )
      .mockResolvedValueOnce();
    const onCopy = vi.fn();
    const { rerender } = render(<CopyButton value="old record" onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    rerender(<CopyButton value="new record" onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText.mock.calls).toEqual([['old record'], ['new record']]);
    const announcement = () => screen.getByRole('status').textContent;
    const announced = announcement();
    expect(announced).toContain('Copied');
    await act(async () => refuseEarlier?.(new Error('Denied')));
    expect(execCommand).not.toHaveBeenCalled();
    expect(announcement()).toBe(announced);
    expect(onCopy.mock.calls).toEqual([[true], [false]]);
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(announcement()).not.toBe(announced);
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('UIC-COPY-BUTTON-1.3 takes its name and announcements from the label and provider strings', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider messages={{ copy: 'Copier', copied: 'Copié' }}>
        <CopyButton value="Lisbon" />
        <CopyButton value="Porto" label="Copy the city" />
      </UiProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Copier' }));
    expect(await screen.findByText('Copié')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Copy the city' })).toBeInTheDocument();
  });

  it('UIC-COPY-BUTTON-1.4 passes variant, size and disabled to the button and forwards attributes', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const { container } = render(
      <CopyButton
        value="Oslo"
        variant="secondary"
        size="sm"
        isDisabled
        onCopy={onCopy}
        className="caller"
        id="copy-city"
        data-testid="probe"
        data-copied="caller"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'sm');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onCopy).not.toHaveBeenCalled();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-copy-button', 'caller');
    expect(root).toHaveAttribute('id', 'copy-city');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).not.toHaveAttribute('data-copied');
    expectHooksMatchSpec(container, 'COPY-BUTTON', { callerAttributes: ['data-testid'] });
  });

  it('UIC-COPY-BUTTON-1.4 publishes the resolved options on its root over caller attributes', () => {
    const { container, rerender } = render(
      <CopyButton value="Oslo" data-size="lg" data-variant="primary" data-disabled="true" />,
    );
    const root = container.firstElementChild as HTMLElement;
    const button = screen.getByRole('button');
    // The defaults are stated, on the root as on the button, whatever the caller wrote.
    for (const element of [root, button]) {
      expect(element).toHaveAttribute('data-size', 'md');
      expect(element).toHaveAttribute('data-variant', 'ghost');
      expect(element).not.toHaveAttribute('data-disabled');
    }
    rerender(<CopyButton value="Oslo" size="xs" variant="primary" isDisabled data-size="lg" />);
    for (const element of [root, button]) {
      expect(element).toHaveAttribute('data-size', 'xs');
      expect(element).toHaveAttribute('data-variant', 'primary');
      expect(element).toHaveAttribute('data-disabled', 'true');
    }
    rerender(<CopyButton value="Oslo" size="xs" variant="primary" />);
    expect(root).not.toHaveAttribute('data-disabled');
    expect(button).not.toHaveAttribute('data-disabled');
  });
});
