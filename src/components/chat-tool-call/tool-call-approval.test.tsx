import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DecidingToolCallHost,
  getToolCallTrigger,
  renderPendingToolCall,
  toolCallBase,
} from '../../../test/chat-tool-call-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatToolCall } from './chat-tool-call.js';

describe('ChatToolCall approval', () => {
  it('UIC-CHAT-TOOL-CALL-4.1 asks to run the tool with a button for each callback', async () => {
    const user = userEvent.setup();
    const { container, onApprove, onAlwaysAllow, onDeny } = renderPendingToolCall();
    const group = screen.getByRole('group', { name: 'Allow “Delete notes.txt”?' });
    expect(group).toHaveClass('ui-chat-tool-call__approval');
    expect(getToolCallTrigger(container)).toHaveAttribute('aria-expanded', 'true');
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Approve',
      'Deny',
      'Always allow in this conversation',
    ]);
    expect(buttons.map((button) => button.getAttribute('data-action'))).toEqual([
      'approve',
      'deny',
      'always',
    ]);
    expect(buttons[0]).toHaveAttribute('data-variant', 'primary');
    expectHooksMatchSpec(container, 'CHAT-TOOL-CALL', {
      slots: ['approval', 'prompt', 'actions', 'action', 'decision'],
    });
    await user.click(buttons[0] as HTMLElement);
    expect(onApprove).toHaveBeenCalledTimes(1);
    await user.click(buttons[2] as HTMLElement);
    expect(onAlwaysAllow).toHaveBeenCalledTimes(1);
    expect(onDeny).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-TOOL-CALL-4.1 offers only the decisions the host handles', () => {
    render(
      <ChatToolCall
        {...toolCallBase}
        status="approval-requested"
        onApprove={() => {}}
        approval={{}}
      />,
    );
    const group = screen.getByRole('group', { name: 'Allow “Delete notes.txt”?' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Approve']);
  });

  it('UIC-CHAT-TOOL-CALL-4.1 names Always allow without a scope', () => {
    render(<ChatToolCall {...toolCallBase} status="approval-requested" onAlwaysAllow={() => {}} />);
    expect(screen.getByRole('button', { name: 'Always allow' })).toBeInTheDocument();
  });

  it('UIC-CHAT-TOOL-CALL-4.2 sends a trimmed reason and returns focus to Deny', async () => {
    const user = userEvent.setup();
    const { container, onDeny } = renderPendingToolCall();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    const reason = screen.getByRole('textbox', { name: 'Reason (optional)' });
    expect(reason).toHaveFocus();
    expect(reason.closest('.ui-chat-tool-call__reason')).toHaveClass('ui-text-field');
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-TOOL-CALL', { slots: ['deny-form', 'reason'] });
    await user.type(reason, '  Keep that file  ');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onDeny).toHaveBeenCalledWith('Keep that file');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Deny' })).toHaveFocus());
  });

  it('UIC-CHAT-TOOL-CALL-4.2 sends no reason for a blank one, by Enter', async () => {
    const user = userEvent.setup();
    const { onDeny } = renderPendingToolCall();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(screen.getByRole('textbox', { name: 'Reason (optional)' }), '   {Enter}');
    expect(onDeny).toHaveBeenCalledWith(undefined);
  });

  it('UIC-CHAT-TOOL-CALL-4.2 cancels without denying and forgets the reason', async () => {
    const user = userEvent.setup();
    const { onDeny } = renderPendingToolCall();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(screen.getByRole('textbox', { name: 'Reason (optional)' }), 'Later');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDeny).not.toHaveBeenCalled();
    const deny = screen.getByRole('button', { name: 'Deny' });
    await waitFor(() => expect(deny).toHaveFocus());
    await user.click(deny);
    expect(screen.getByRole('textbox', { name: 'Reason (optional)' })).toHaveValue('');
  });

  it('UIC-CHAT-TOOL-CALL-4.2 closes the form when the approval stops being pending', async () => {
    const user = userEvent.setup();
    const { rerender } = renderPendingToolCall();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(screen.getByRole('textbox'), 'Stale');
    rerender(
      <ChatToolCall {...toolCallBase} status="running" approval={{ decision: 'approved' }} />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    rerender(<ChatToolCall {...toolCallBase} status="approval-requested" onDeny={() => {}} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    expect(screen.getByRole('textbox', { name: 'Reason (optional)' })).toHaveValue('');
  });

  it('UIC-CHAT-TOOL-CALL-4.4 shows each decision in a status', () => {
    const decisions = [
      [{ decision: 'approved' }, 'Approved'],
      [{ decision: 'denied' }, 'Denied'],
      [{ decision: 'denied', reason: 'Not now' }, 'Denied: Not now'],
      [{ decision: 'always', scopeLabel: 'this chat' }, 'Always allowed'],
    ] as const;
    for (const [approval, text] of decisions) {
      const { container, unmount } = render(
        <ChatToolCall
          {...toolCallBase}
          status="succeeded"
          approval={approval}
          onApprove={() => {}}
        />,
      );
      const status = screen.getByRole('status');
      expect(status).toHaveClass('ui-chat-tool-call__decision');
      expect(status).toHaveTextContent(text);
      const group = screen.getByRole('group', { name: text });
      expect(group).toHaveAttribute('data-decision', approval.decision);
      expect(container.querySelector('.ui-chat-tool-call__prompt')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('UIC-CHAT-TOOL-CALL-4.4 resolves on the decision and shows nothing without one', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const { container, rerender } = render(
      <ChatToolCall
        {...toolCallBase}
        status="approval-requested"
        approval={{ decision: 'approved' }}
        onApprove={onApprove}
      />,
    );
    expect(container.querySelector('.ui-chat-tool-call__decision')).toHaveTextContent('Approved');
    getToolCallTrigger(container).focus();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onApprove).not.toHaveBeenCalled();
    rerender(<ChatToolCall {...toolCallBase} status="cancelled" onApprove={onApprove} />);
    expect(container.querySelector('.ui-chat-tool-call__approval')).toBeNull();
  });

  it('UIC-CHAT-TOOL-CALL-4.4 UIC-CHAT-TOOL-CALL-4.5 keeps the focused button, aria-disabled, once decided', async () => {
    const user = userEvent.setup();
    render(<DecidingToolCallHost />);
    const approve = screen.getByRole('button', { name: 'Approve' });
    await user.click(approve);
    expect(screen.getByRole('status')).toHaveTextContent('Approved');
    expect(approve).toHaveFocus();
    expect(approve).toHaveAttribute('aria-disabled', 'true');
    expect(approve).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    expect(screen.getByRole('button', { name: 'Deny' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(approve);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'After' }));
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Approved');
  });

  it('UIC-CHAT-TOOL-CALL-4.5 keeps Deny focused after sending a denial', async () => {
    const user = userEvent.setup();
    render(<DecidingToolCallHost />);
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(screen.getByRole('textbox'), 'Wrong file{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Denied: Wrong file');
    const deny = screen.getByRole('button', { name: 'Deny' });
    await waitFor(() => expect(deny).toHaveFocus());
    expect(deny).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-CHAT-TOOL-CALL-4.5 moves focus to the trigger when the approval leaves', async () => {
    const user = userEvent.setup();
    const { container, rerender } = renderPendingToolCall();
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    rerender(<ChatToolCall {...toolCallBase} status="cancelled" />);
    expect(getToolCallTrigger(container)).toHaveFocus();
  });
});
