import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ActionButton, runPendingAction } from './action-button.js';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('ActionButton', () => {
  it('UIC-ACTION-BUTTON-1.1 is pending until the action settles, keeping its label', async () => {
    const task = deferred();
    render(<ActionButton onPress={() => task.promise}>Save</ActionButton>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', 'primary');
    await userEvent.click(button);
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

  it('UIC-ACTION-BUTTON-1.2 runs the action once until it settles', async () => {
    const task = deferred();
    const onPress = vi.fn(() => task.promise);
    render(<ActionButton onPress={onPress}>Create</ActionButton>);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    act(() => button.click());
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => {
      task.resolve();
      await task.promise;
    });
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('UIC-ACTION-BUTTON-1.3 settles after a rejection and reports it', async () => {
    const onError = vi.fn();
    render(
      <ActionButton onPress={() => Promise.reject(new Error('offline'))} onError={onError}>
        Upload
      </ActionButton>,
    );
    const button = screen.getByRole('button');
    await act(async () => {
      await userEvent.click(button);
    });
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

  it('UIC-ACTION-BUTTON-1.4 never starts a disabled action and stays disabled', async () => {
    const onPress = vi.fn();
    render(
      <ActionButton isDisabled onPress={onPress}>
        Apply
      </ActionButton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(await runPendingAction({ blocked: true, setPending: () => {}, action: onPress })).toBe(
      false,
    );
  });

  it('UIC-ACTION-BUTTON-1.5 honours controlled pending and names the busy indicator', () => {
    const { rerender } = render(
      <ActionButton isPending aria-label="Export report">
        Export
      </ActionButton>,
    );
    const button = screen.getByRole('button', { name: /Export report/ });
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAttribute('aria-label', 'Export report');
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();

    rerender(
      <UiProvider strings={{ loading: 'Working' }}>
        <ActionButton isPending>Export</ActionButton>
      </UiProvider>,
    );
    expect(screen.getByRole('progressbar', { name: 'Working' })).toBeInTheDocument();

    rerender(
      <ActionButton isPending pendingLabel="Exporting">
        Export
      </ActionButton>,
    );
    expect(screen.getByRole('progressbar', { name: 'Exporting' })).toBeInTheDocument();

    rerender(<ActionButton isPending={false}>Export</ActionButton>);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('UIC-ACTION-BUTTON-1.6 keeps its hint and shortcut while the action runs', async () => {
    const user = userEvent.setup();
    const task = deferred();
    render(
      <ActionButton tooltip="Publish the draft" shortcut="Ctrl+Enter" onPress={() => task.promise}>
        Publish
      </ActionButton>,
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

  it('UIC-ACTION-BUTTON-1.7 shows the pending state only after the pending delay', async () => {
    vi.useFakeTimers();
    try {
      const task = deferred();
      const onPress = vi.fn(() => task.promise);
      render(
        <ActionButton pendingDelay={400} onPress={onPress}>
          Save
        </ActionButton>,
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

  it('UIC-ACTION-BUTTON-1.7 never shows a pending state for an action faster than the delay', async () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <ActionButton pendingDelay={400} isPending>
          Apply
        </ActionButton>,
      );
      const controlled = screen.getByRole('button', { name: 'Apply' });
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(controlled).not.toHaveAttribute('data-pending');
      rerender(
        <ActionButton pendingDelay={400} isPending={false}>
          Apply
        </ActionButton>,
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
