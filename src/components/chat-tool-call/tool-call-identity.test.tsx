import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getToolCallTrigger } from '../../../test/chat-tool-call-fixtures.js';
import { ChatToolCall } from './chat-tool-call.js';

function PendingCall(props: { id: string; name: string; onDeny: (reason?: string) => void }) {
  return (
    <ChatToolCall
      {...props}
      status="approval-requested"
      args={{ path: 'notes.txt' }}
      onApprove={() => {}}
    />
  );
}

describe('ChatToolCall identity', () => {
  it('UIC-CHAT-TOOL-CALL-4.2 starts another call without the earlier call’s denial draft', async () => {
    const user = userEvent.setup();
    const first = vi.fn<(reason?: string) => void>();
    const second = vi.fn<(reason?: string) => void>();
    const { rerender } = render(<PendingCall id="call-1" name="read_file" onDeny={first} />);
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Reason (optional)' }),
      'Reason for call one',
    );
    rerender(<PendingCall id="call-2" name="delete_file" onDeny={second} />);
    expect(screen.getByRole('group', { name: 'Allow “Delete file”?' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Reason (optional)' })).not.toBeInTheDocument();
    const deny = screen.getByRole('button', { name: 'Deny' });
    expect(deny).toHaveFocus();
    await user.click(deny);
    expect(screen.getByRole('textbox', { name: 'Reason (optional)' })).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(second).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(first).not.toHaveBeenCalled();
  });

  it('UIC-CHAT-TOOL-CALL-4.2 keeps the draft through updates to the same call', async () => {
    const user = userEvent.setup();
    const onDeny = vi.fn<(reason?: string) => void>();
    const { rerender } = render(<PendingCall id="call-1" name="read_file" onDeny={onDeny} />);
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    await user.type(screen.getByRole('textbox', { name: 'Reason (optional)' }), 'Not this file');
    rerender(<PendingCall id="call-1" name="read_file" onDeny={onDeny} />);
    const field = screen.getByRole('textbox', { name: 'Reason (optional)' });
    expect(field).toHaveValue('Not this file');
    expect(field).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onDeny).toHaveBeenCalledExactlyOnceWith('Not this file');
  });

  it('UIC-CHAT-TOOL-CALL-3.1 lets another call follow its own status after the reader toggled the earlier one', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ChatToolCall id="call-1" name="read_file" status="succeeded" args={{ path: 'a.txt' }} />,
    );
    const trigger = () => getToolCallTrigger(container);
    await user.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    rerender(
      <ChatToolCall id="call-2" name="read_file" status="succeeded" args={{ path: 'b.txt' }} />,
    );
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    rerender(
      <ChatToolCall id="call-1" name="read_file" status="succeeded" args={{ path: 'a.txt' }} />,
    );
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });
});
