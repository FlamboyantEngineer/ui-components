import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DecisionControl } from './decision-control.js';

/** A promise the test settles. */
function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const comment = () => screen.getByRole('textbox', { name: /^Comment/ });
const submit = () => screen.getByRole('button', { name: 'Submit' });

describe('DecisionControl submissions that settle later', { timeout: 15_000 }, () => {
  it('UIC-DECISION-CONTROL-1.4 keeps a comment typed while the submission was pending', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    const onSubmit = vi.fn(() => accepted.promise);
    render(<DecisionControl defaultValue="approve" onSubmit={onSubmit} />);
    await user.type(comment(), 'Submitted comment');
    await user.click(submit());
    await user.clear(comment());
    await user.type(comment(), 'New unsent comment');
    await act(async () => accepted.resolve());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      decision: 'approve',
      comment: 'Submitted comment',
      signature: null,
    });
    expect(comment()).toHaveValue('New unsent comment');
    expect(submit()).not.toHaveAttribute('data-pending');
  });

  it('UIC-DECISION-CONTROL-1.4 keeps the comment when the decision changed while pending', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    render(<DecisionControl defaultValue="approve" onSubmit={() => accepted.promise} />);
    await user.type(comment(), 'Looks right');
    await user.click(submit());
    await user.click(screen.getByRole('radio', { name: 'Reject' }));
    await act(async () => accepted.resolve());
    expect(comment()).toHaveValue('Looks right');
  });

  it('UIC-DECISION-CONTROL-1.4 clears an unchanged comment once its submission succeeds', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    render(<DecisionControl defaultValue="approve" onSubmit={() => accepted.promise} />);
    await user.type(comment(), 'Ship it');
    await user.click(submit());
    await user.click(submit());
    await act(async () => accepted.resolve());
    expect(comment()).toHaveValue('');
  });

  it('UIC-DECISION-CONTROL-1.4 keeps edits and the comment when a submission is refused', async () => {
    const user = userEvent.setup();
    const refused = deferred();
    render(<DecisionControl defaultValue="approve" onSubmit={() => refused.promise} />);
    await user.type(comment(), 'First');
    await user.click(submit());
    await user.type(comment(), ' and more');
    await act(async () => refused.reject(new Error('Offline.')));
    expect(screen.getByRole('alert')).toHaveTextContent('Offline.');
    expect(comment()).toHaveValue('First and more');
  });

  it('UIC-DECISION-CONTROL-1.4 settles nothing once the control has unmounted', async () => {
    const user = userEvent.setup();
    const accepted = deferred();
    const view = render(
      <DecisionControl defaultValue="approve" onSubmit={() => accepted.promise} />,
    );
    await user.type(comment(), 'Leaving');
    await user.click(submit());
    view.unmount();
    render(<DecisionControl defaultValue="approve" onSubmit={() => undefined} />);
    await act(async () => accepted.resolve());
    expect(comment()).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
