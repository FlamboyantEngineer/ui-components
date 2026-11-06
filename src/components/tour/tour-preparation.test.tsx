import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tour, type TourProps, type TourStep } from './tour.js';

/** A promise and the functions that settle it, for a preparation the test settles. */
function deferred() {
  let resolve: () => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** A page whose details section is collapsed until a step opens it. */
function Page({ steps, ...props }: Partial<TourProps> & { steps: TourStep[] }) {
  return (
    <div>
      <button type="button" id="intro">
        Intro
      </button>
      <Tour steps={steps} defaultOpen {...props} />
    </div>
  );
}

const status = () => screen.getByRole('status');
const root = () => document.querySelector('.ui-tour');
const spotlight = () => document.querySelector('.ui-tour__spotlight');

describe('Tour step preparation', () => {
  it('UIC-TOUR-1.4 shows a pending step until its preparation reveals the target', async () => {
    const user = userEvent.setup();
    const pending = deferred();
    function Revealing() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          {isOpen ? <p id="details">Details</p> : null}
          <Page
            steps={[
              { target: '#intro', title: 'Intro' },
              {
                target: '#details',
                title: 'Details',
                prepare: async () => {
                  await pending.promise;
                  setOpen(true);
                },
              },
            ]}
          />
        </>
      );
    }
    render(<Revealing />);
    await screen.findByRole('dialog', { name: 'Intro' });
    expect(status()).toBeEmptyDOMElement();
    expect(root()).toHaveAttribute('data-status', 'ready');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    expect(status()).toHaveTextContent('Getting this step ready…');
    expect(root()).toHaveAttribute('data-status', 'pending');
    expect(spotlight()).toHaveAttribute('data-pending', 'true');
    expect(spotlight()).not.toHaveAttribute('data-target-missing');
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
    expect(document.querySelector('.ui-tour__arrow')).not.toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'TOUR', { slots: ['status', 'spotlight'] });
    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    expect(root()).toHaveAttribute('data-status', 'ready');
    expect(status()).toBeEmptyDOMElement();
    expect(spotlight()).not.toHaveAttribute('data-pending');
    expect(spotlight()).not.toHaveAttribute('data-target-missing');
    expect(screen.getByRole('button', { name: 'Finish' })).toBeEnabled();
  });

  it('UIC-TOUR-1.4 retries a failed preparation with a fresh signal', async () => {
    const user = userEvent.setup();
    const prepare = vi
      .fn<NonNullable<TourStep['prepare']>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    render(<Page steps={[{ target: '#intro', title: 'Intro', prepare }]} />);
    await screen.findByRole('dialog', { name: 'Intro' });
    expect(await screen.findByText('This step could not be shown.')).toBeInTheDocument();
    expect(root()).toHaveAttribute('data-status', 'failed');
    const first = prepare.mock.calls[0]?.[0].signal;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(root()).toHaveAttribute('data-status', 'ready');
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(first?.aborted).toBe(true);
    expect(prepare.mock.calls[1]?.[0].signal.aborted).toBe(false);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('UIC-TOUR-1.4 aborts a pending preparation on Back, Skip and unmount, and ignores its settlement', async () => {
    const user = userEvent.setup();
    const late = deferred();
    const prepare = vi.fn<NonNullable<TourStep['prepare']>>(() => late.promise);
    const onSkip = vi.fn();
    const onStepChange = vi.fn();
    const { unmount } = render(
      <Page
        steps={[
          { target: '#intro', title: 'Intro' },
          { target: '#intro', title: 'Later', prepare },
        ]}
        onSkip={onSkip}
        onStepChange={onStepChange}
      />,
    );
    await screen.findByRole('dialog', { name: 'Intro' });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('dialog', { name: 'Later' });
    const backSignal = prepare.mock.calls[0]?.[0].signal;
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(backSignal?.aborted).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const skipSignal = prepare.mock.calls[1]?.[0].signal;
    await user.keyboard('{Escape}');
    expect(onSkip).toHaveBeenCalledWith(1);
    expect(skipSignal?.aborted).toBe(true);
    await act(async () => {
      late.resolve();
      await late.promise;
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onStepChange).toHaveBeenCalledTimes(3);
    unmount();
  });

  it('UIC-TOUR-1.4 restarts only when the step at the index has another id', async () => {
    const prepare = vi.fn<NonNullable<TourStep['prepare']>>(() => new Promise(() => {}));
    const steps = (id: string): TourStep[] => [{ id, target: '#intro', title: 'Intro', prepare }];
    const { rerender, unmount } = render(<Page steps={steps('a')} />);
    await screen.findByRole('dialog', { name: 'Intro' });
    rerender(<Page steps={steps('a')} />);
    expect(prepare).toHaveBeenCalledTimes(1);
    rerender(<Page steps={steps('b')} />);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare.mock.calls[0]?.[0].signal.aborted).toBe(true);
    unmount();
    expect(prepare.mock.calls[1]?.[0].signal.aborted).toBe(true);
  });

  it('UIC-TOUR-1.4 waits up to targetTimeout for a target that appears later', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      function Late({ shows }: { shows: boolean }) {
        return (
          <>
            {shows ? <p id="late">Late</p> : null}
            <Page steps={[{ target: '#late', title: 'Late', targetTimeout: 1000 }]} />
          </>
        );
      }
      const { rerender } = render(<Late shows={false} />);
      await screen.findByRole('dialog', { name: 'Late' });
      expect(root()).toHaveAttribute('data-status', 'pending');
      rerender(<Late shows />);
      expect(root()).toHaveAttribute('data-status', 'ready');
      expect(spotlight()).not.toHaveAttribute('data-target-missing');
      rerender(<Page steps={[{ target: '#gone', title: 'Gone', targetTimeout: 1000 }]} />);
      expect(root()).toHaveAttribute('data-status', 'pending');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(root()).toHaveAttribute('data-status', 'ready');
      expect(spotlight()).toHaveAttribute('data-target-missing', 'true');
    } finally {
      vi.useRealTimers();
    }
  });
});
