import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { DecisionControl } from './decision-control.js';

const votes = [
  { value: '-2', label: '−2', requiresComment: true },
  { value: '-1', label: '−1', requiresComment: true },
  { value: '0', label: '0' },
  { value: '1', label: '+1' },
  { value: '2', label: '+2' },
];

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const comment = () => screen.getByRole('textbox', { name: /^Comment/ });
const submit = () => screen.getByRole('button', { name: 'Submit' });

describe('DecisionControl', { timeout: 15_000 }, () => {
  it('UIC-DECISION-CONTROL-1.1 UIC-DECISION-CONTROL-1.7 UIC-DECISION-CONTROL-2.1 names a form and a choice of decisions', () => {
    const { container } = render(
      <DecisionControl
        onSubmit={() => {}}
        className="extra"
        id="decide"
        data-lab="decide"
        data-decision="caller"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-decision-control', 'extra');
    expect(root).toHaveAttribute('id', 'decide');
    expect(root).toHaveAttribute('data-lab', 'decide');
    expect(root).not.toHaveAttribute('data-decision');
    const form = screen.getByRole('form', { name: 'Your decision' });
    expect(form).toHaveClass('ui-decision-control__form', 'ui-form');
    const choice = screen.getByRole('radiogroup', { name: 'Your decision' });
    expect(choice).toHaveClass('ui-decision-control__choice', 'ui-segmented-choice');
    const options = within(choice).getAllByRole('radio');
    expect(options.map((option) => option.textContent)).toEqual(['Approve', 'Reject']);
    expect(options[0]?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'check');
    expect(comment()).toBeInTheDocument();
    expectHooksMatchSpec(container, 'DECISION-CONTROL', {
      slots: ['form', 'label', 'choice', 'comment', 'submit'],
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-DECISION-CONTROL-1.2 picks a decision, controlled or not', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <DecisionControl onSubmit={() => {}} onChange={onChange} />,
    );
    const root = container.firstElementChild as HTMLElement;
    await userEvent.click(screen.getByRole('radio', { name: 'Reject' }));
    expect(onChange).toHaveBeenCalledWith('reject');
    expect(root).toHaveAttribute('data-decision', 'reject');
    expect(screen.getByRole('radio', { name: 'Reject' })).toBeChecked();
    rerender(<DecisionControl onSubmit={() => {}} value="approve" onChange={onChange} />);
    expect(root).toHaveAttribute('data-decision', 'approve');
    await userEvent.click(screen.getByRole('radio', { name: 'Reject' }));
    expect(root).toHaveAttribute('data-decision', 'approve');
  });

  it('UIC-DECISION-CONTROL-1.3 asks for a comment as the decision or the caller requires', async () => {
    const { unmount } = render(
      <DecisionControl onSubmit={() => {}} options={votes} comment="none" />,
    );
    expect(comment()).not.toBeRequired();
    await userEvent.click(screen.getByRole('radio', { name: '−1' }));
    expect(comment()).toBeRequired();
    await userEvent.click(screen.getByRole('radio', { name: '+2' }));
    expect(comment()).not.toBeRequired();
    unmount();
    const { rerender } = render(
      <DecisionControl onSubmit={() => {}} options={votes.slice(2)} comment="none" />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    rerender(<DecisionControl onSubmit={() => {}} options={votes.slice(2)} comment="required" />);
    expect(comment()).toBeRequired();
  });

  it('UIC-DECISION-CONTROL-1.4 validates, submits, stays pending and clears the comment', async () => {
    const onSubmit = vi.fn();
    const pending = deferred();
    onSubmit.mockReturnValueOnce(pending.promise);
    const { container } = render(<DecisionControl onSubmit={onSubmit} submitLabel="Send" />);
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Reject' }));
    await userEvent.click(send);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(comment()).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(comment(), 'Missing tests');
    await userEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith({
      decision: 'reject',
      comment: 'Missing tests',
      signature: null,
    });
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-pending', 'true');
    expect(send).toHaveAttribute('data-pending', 'true');
    pending.resolve();
    await waitFor(() => expect(root).not.toHaveAttribute('data-pending'));
    expect(comment()).toHaveValue('');
  });

  it('UIC-DECISION-CONTROL-1.4 shows a failed submission and keeps the comment', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('The review is closed.'))
      .mockRejectedValueOnce('offline');
    const { container } = render(<DecisionControl onSubmit={onSubmit} defaultValue="approve" />);
    await userEvent.type(comment(), 'Ship it');
    await userEvent.click(submit());
    const error = await screen.findByRole('alert');
    expect(error).toHaveClass('ui-decision-control__error', 'ui-inline-error');
    expect(error).toHaveTextContent('The review is closed.');
    expect(comment()).toHaveValue('Ship it');
    await userEvent.click(submit());
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('The decision could not be submitted.'),
    );
    expectHooksMatchSpec(container, 'DECISION-CONTROL', { slots: ['error'] });
  });

  it('UIC-DECISION-CONTROL-1.5 signs the decision through the signature dialog', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('Wrong password.'));
    render(
      <DecisionControl
        onSubmit={onSubmit}
        defaultValue="approve"
        signature={{ userName: 'Ada Park' }}
      />,
    );
    await userEvent.type(comment(), 'Verified on the bench');
    await userEvent.click(submit());
    const dialog = await screen.findByRole('dialog', { name: 'Sign your decision' });
    expect(document.querySelector('.ui-decision-control__signature')).toHaveClass(
      'ui-signature-dialog',
    );
    expect(dialog).toHaveTextContent('Verified on the bench');
    expect(dialog).toHaveTextContent('Meaning of signature: Approve');
    expect(within(dialog).queryByRole('textbox', { name: /Reason/ })).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent('Ada Park');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(
      within(dialog).getByLabelText(/^Password/, { selector: 'input' }),
      'secret',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('alert')).toHaveTextContent('Wrong password.'),
    );
    expect(onSubmit).toHaveBeenLastCalledWith({
      decision: 'approve',
      comment: 'Verified on the bench',
      signature: expect.objectContaining({
        userName: 'Ada Park',
        password: 'secret',
        meaning: 'approve',
      }),
    });
    await userEvent.type(
      within(dialog).getByLabelText(/^Password/, { selector: 'input' }),
      'right',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(comment()).toHaveValue('');
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('UIC-DECISION-CONTROL-1.6 disables the choice, the comment and Submit', () => {
    render(<DecisionControl onSubmit={() => {}} defaultValue="approve" isDisabled />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    expect(comment()).toBeDisabled();
    expect(submit()).toBeDisabled();
  });
});
