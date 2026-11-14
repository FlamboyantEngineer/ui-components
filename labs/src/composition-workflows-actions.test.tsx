import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  DecisionComposition,
  SigningComposition,
  TransitionComposition,
} from './composition-workflows-actions.js';

describe('Host workflow compositions', () => {
  it('UIC-COMPOSITION-WORKFLOWS-1.2 requires a response before sending host state', async () => {
    const user = userEvent.setup();
    render(<DecisionComposition />);
    const send = screen.getByRole('button', { name: 'Send response' });
    expect(send).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Accept' }));
    await user.type(screen.getByRole('textbox', { name: 'Comment' }), 'Ready');
    await user.click(send);
    expect(screen.getByRole('status')).toHaveTextContent('accept: Ready');
  });

  it('UIC-COMPOSITION-WORKFLOWS-1.2 requires an explanation before changing availability', async () => {
    const user = userEvent.setup();
    render(<TransitionComposition />);
    await user.click(screen.getByRole('button', { name: 'Change availability' }));
    const menu = await screen.findByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: /^Archive/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Archive item' });
    const confirm = within(dialog).getByRole('button', { name: /^Archive/ });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox', { name: 'Reason' }), 'Finished');
    await user.click(confirm);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Archived', { exact: true })).toBeInTheDocument();
  });

  it('UIC-COMPOSITION-WORKFLOWS-1.3 clears host session values and restores focus after cancellation', async () => {
    const user = userEvent.setup();
    render(<SigningComposition />);
    const trigger = screen.getByRole('button', { name: 'Add signature' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Sign sample item' });
    await user.type(within(dialog).getByLabelText(/^Credential/), 'private');
    await user.keyboard('{Escape}');
    expect(within(dialog).getByLabelText(/^Credential/)).toHaveValue('');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    expect(screen.getByLabelText(/^Credential/)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save signature' })).toBeDisabled();
  });
});
