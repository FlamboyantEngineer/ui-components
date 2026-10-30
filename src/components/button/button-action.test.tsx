import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from './button.js';
import { runPendingAction } from './pending-action.js';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('Button', () => {
  it('UIC-BUTTON-21.1 is pending until the action settles, keeping its label', async () => {
    const user = userEvent.setup();

    const task = deferred();
    render(<Button onPress={() => task.promise}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', 'secondary');
    await user.click(button);
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent('Save');
    expectHooksMatchSpec(document.body, 'BUTTON', { slots: ['spinner', 'label'] });
    await act(async () => {
      task.resolve();
      await task.promise;
    });
    expect(button).not.toHaveAttribute('data-pending');
  });

  it('UIC-BUTTON-21.2 runs the action once until it settles', async () => {
    const user = userEvent.setup();

    const task = deferred();
    const onPress = vi.fn(() => task.promise);
    render(<Button onPress={onPress}>Create</Button>);
    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    act(() => button.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => {
      task.resolve();
      await task.promise;
    });
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('UIC-BUTTON-21.2 UIC-BUTTON-21.7 submits its form once per action, also during the pending delay', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onPress = vi.fn(() => new Promise<void>(() => undefined));
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" pendingDelay={1000} onPress={onPress}>
          Send later
        </Button>
        <Button type="submit" onPress={onPress}>
          Send now
        </Button>
      </form>,
    );
    const later = screen.getByRole('button', { name: 'Send later' });
    await user.click(later);
    await user.click(later);
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    const now = screen.getByRole('button', { name: 'Send now' });
    await user.click(now);
    expect(now).toHaveAttribute('data-pending', 'true');
    // The press that started the action submits; React Aria's switch to a plain button would land
    // before that press submits in a browser, so the button keeps its type and refuses repeats.
    expect(now).toHaveAttribute('type', 'submit');
    await user.click(now);
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('UIC-BUTTON-21.3 settles after a rejection and reports it', async () => {
    const user = userEvent.setup();

    const onError = vi.fn();
    render(
      <Button onPress={() => Promise.reject(new Error('offline'))} onError={onError}>
        Upload
      </Button>,
    );
    const button = screen.getByRole('button');
    await user.click(button);
    expect(onError).toHaveBeenCalledWith(new Error('offline'));
    expect(button).not.toHaveAttribute('data-pending');
    await expect(
      runPendingAction({
        blocked: false,
        setPending: () => {},
        action: () => Promise.reject(new Error('x')),
      }),
    ).rejects.toThrow('x');
  });

  it('UIC-BUTTON-21.4 never starts a disabled action and stays disabled', async () => {
    const user = userEvent.setup();

    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Apply
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(await runPendingAction({ blocked: true, setPending: () => {}, action: onPress })).toBe(
      false,
    );
  });

  it('UIC-BUTTON-21.5 honours controlled pending and names the busy indicator', () => {
    const { rerender } = render(
      <Button isPending aria-label="Export report">
        Export
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Export report/ });
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAttribute('aria-label', 'Export report');
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();

    rerender(
      <UiProvider messages={{ loading: 'Working' }}>
        <Button isPending>Export</Button>
      </UiProvider>,
    );
    expect(screen.getByRole('progressbar', { name: 'Working' })).toBeInTheDocument();

    rerender(
      <Button isPending pendingLabel="Exporting">
        Export
      </Button>,
    );
    expect(screen.getByRole('progressbar', { name: 'Exporting' })).toBeInTheDocument();

    rerender(<Button isPending={false}>Export</Button>);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('UIC-BUTTON-21.6 keeps its hint and shortcut while the action runs', async () => {
    const user = userEvent.setup();
    const task = deferred();
    render(
      <Button tooltip="Publish the draft" shortcut="Ctrl+Enter" onPress={() => task.promise}>
        Publish
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Publish' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    await user.tab();
    expect(button).toHaveAccessibleDescription('Publish the draft Control Enter');
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    // Pressing closes the tooltip; focus that returns to the pending button opens it again.
    await user.tab();
    await user.tab();
    expect(button).toHaveFocus();
    expect(button).toHaveAccessibleDescription('Publish the draft Control Enter');
    await act(async () => task.resolve());
    expect(button).not.toHaveAttribute('data-pending');
  });

  it('UIC-BUTTON-21.7 shows the pending state only after the pending delay', async () => {
    vi.useFakeTimers();
    try {
      const task = deferred();
      const onPress = vi.fn(() => task.promise);
      render(
        <Button pendingDelay={400} onPress={onPress}>
          Save
        </Button>,
      );
      const button = screen.getByRole('button', { name: 'Save' });
      act(() => button.click());
      expect(onPress).toHaveBeenCalledTimes(1);
      expect(button).not.toHaveAttribute('data-pending');
      expect(button).not.toHaveAttribute('aria-disabled');
      act(() => button.click());
      expect(onPress).toHaveBeenCalledTimes(1);
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(button).toHaveAttribute('data-pending', 'true');
      await act(async () => {
        task.resolve();
        await task.promise;
      });
      expect(button).not.toHaveAttribute('data-pending');
    } finally {
      vi.useRealTimers();
    }
  });

  it('UIC-BUTTON-21.7 never shows a pending state for an action faster than the delay', async () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <Button pendingDelay={400} isPending>
          Apply
        </Button>,
      );
      const controlled = screen.getByRole('button', { name: 'Apply' });
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(controlled).not.toHaveAttribute('data-pending');
      rerender(
        <Button pendingDelay={400} isPending={false}>
          Apply
        </Button>,
      );
      await act(async () => {
        vi.advanceTimersByTime(400);
      });
      expect(controlled).not.toHaveAttribute('data-pending');
    } finally {
      vi.useRealTimers();
    }
  });
});
