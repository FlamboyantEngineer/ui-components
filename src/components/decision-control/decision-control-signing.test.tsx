import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { DecisionControl, type DecisionControlProps } from './decision-control.js';

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations when overlays change.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

type ControlProps = Partial<DecisionControlProps>;

function Control(props: ControlProps) {
  return (
    <DecisionControl
      value="approve"
      signature={{ userName: 'Ada Park' }}
      onSubmit={() => undefined}
      {...props}
    />
  );
}

const dialog = () => screen.queryByRole('dialog', { name: 'Sign your decision' });

async function startSigning(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  const opened = await screen.findByRole('dialog', { name: 'Sign your decision' });
  await user.type(within(opened).getByLabelText(/^Password/, { selector: 'input' }), 'secret');
  return opened;
}

describe('DecisionControl signing that outlives its decision', { timeout: 15_000 }, () => {
  it.each<[string, ControlProps]>([
    ['the decision changes to one that needs a comment', { value: 'reject' }],
    ['the comment becomes required', { comment: 'required' }],
    ['the signer changes', { signature: { userName: 'Blair Quinn' } }],
    [
      'the credentials change',
      { signature: { userName: 'Ada Park', credentials: 'username-password' } },
    ],
  ])('UIC-DECISION-CONTROL-1.5 ends signing when %s', async (_, change) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(<Control onSubmit={onSubmit} />);
    await startSigning(user);
    rerender(<Control onSubmit={onSubmit} {...change} />);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each<[string, ControlProps]>([
    ['the signature', { signature: undefined }],
    ['the picked option', { options: [{ value: 'reject', label: 'Reject' }] }],
  ])('UIC-DECISION-CONTROL-1.5 does not reopen signing when %s comes back', async (_, removal) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(<Control onSubmit={onSubmit} />);
    await startSigning(user);
    rerender(<Control onSubmit={onSubmit} {...removal} />);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    rerender(<Control onSubmit={onSubmit} />);
    expect(dialog()).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('UIC-DECISION-CONTROL-1.5 signs a decision whose context stayed the same', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(<Control onSubmit={onSubmit} />);
    const opened = await startSigning(user);
    rerender(<Control onSubmit={onSubmit} signature={{ userName: 'Ada Park' }} />);
    await user.click(within(opened).getByRole('button', { name: 'Sign' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'approve', comment: '' }),
    );
  });
});
