import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DecidingToolCallHost,
  getToolCallTrigger,
  renderPendingToolCall,
  toolCallBase,
} from '../../../test/chat-tool-call-fixtures.js';
import { ChatToolCall } from './chat-tool-call.js';

describe('ChatToolCall approval keys', () => {
  it('UIC-CHAT-TOOL-CALL-4.3 approves with Ctrl+Enter or Cmd+Enter anywhere in the card', async () => {
    const user = userEvent.setup();
    const { container, onApprove, onDeny } = renderPendingToolCall();
    const approve = screen.getByRole('button', { name: 'Approve' });
    const deny = screen.getByRole('button', { name: 'Deny' });
    expect(approve).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    expect(deny).toHaveAttribute('aria-keyshortcuts', 'Escape');
    getToolCallTrigger(container).focus();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onApprove).toHaveBeenCalledTimes(1);
    deny.focus();
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    expect(onApprove).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onDeny).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-TOOL-CALL-4.3 focuses Deny with Escape, then lets Escape go on', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const { container } = render(<DecidingToolCallHost onKeyDown={onKeyDown} />);
    getToolCallTrigger(container).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Deny' })).toHaveFocus();
    expect(onKeyDown).not.toHaveBeenCalled();
    // On Deny, closing its hint leaves the same Escape available to the owning surface.
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Escape');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledTimes(2);
  });

  it('UIC-CHAT-TOOL-CALL-4.3 sends the denial with Ctrl+Enter and cancels it with Escape', async () => {
    const user = userEvent.setup();
    const { onDeny, onApprove } = renderPendingToolCall();
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Deny' })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.keyboard('Too broad{Control>}{Enter}{/Control}');
    expect(onDeny).toHaveBeenCalledWith('Too broad');
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-TOOL-CALL-4.3 leaves keys without a callback, and resolved calls, to the page', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const { container, rerender } = render(
      <div onKeyDown={onKeyDown}>
        <ChatToolCall {...toolCallBase} status="approval-requested" />
      </div>,
    );
    getToolCallTrigger(container).focus();
    await user.keyboard('{Control>}{Enter}{/Control}{Escape}');
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    const onApprove = vi.fn();
    rerender(
      <div onKeyDown={onKeyDown}>
        <ChatToolCall {...toolCallBase} status="running" onApprove={onApprove} />
      </div>,
    );
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onApprove).not.toHaveBeenCalled();
  });
});
