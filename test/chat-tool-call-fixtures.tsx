// Shared fixtures for the tool call's approval tests.

import { render, within } from '@testing-library/react';
import { useState } from 'react';
import { vi } from 'vitest';
import {
  ChatToolCall,
  type ChatToolCallApproval,
  type ChatToolCallProps,
  type ChatToolCallStatus,
} from '../src/components/chat-tool-call/chat-tool-call.js';

/** A call that asks to delete a file, without its status and approval. */
export const toolCallBase = {
  id: 'call',
  name: 'delete_file',
  label: 'Delete notes.txt',
  args: { path: 'notes.txt' },
} as const;

/** Renders a pending approval with a mock for each callback, which the result returns. */
export function renderPendingToolCall(props: Partial<ChatToolCallProps> = {}) {
  const callbacks = { onApprove: vi.fn(), onDeny: vi.fn(), onAlwaysAllow: vi.fn() };
  const view = render(
    <ChatToolCall
      {...toolCallBase}
      status="approval-requested"
      approval={{ scopeLabel: 'this conversation' }}
      {...callbacks}
      {...props}
    />,
  );
  return { ...view, ...callbacks };
}

/** The trigger of the tool call rendered in `container`. */
export function getToolCallTrigger(container: HTMLElement): HTMLElement {
  const heading = container.querySelector('.ui-chat-tool-call__heading') as HTMLElement;
  return within(heading).getByRole('button');
}

/** A host that records each decision on the call, as a chat would, with a button after it. */
export function DecidingToolCallHost({ onKeyDown }: { onKeyDown?: () => void }) {
  const [status, setStatus] = useState<ChatToolCallStatus>('approval-requested');
  const [approval, setApproval] = useState<ChatToolCallApproval>({ scopeLabel: 'this chat' });
  return (
    <div onKeyDown={onKeyDown}>
      <ChatToolCall
        {...toolCallBase}
        status={status}
        approval={approval}
        onApprove={() => {
          setApproval({ decision: 'approved' });
          setStatus('running');
        }}
        onDeny={(reason) => {
          setApproval({ decision: 'denied', reason });
          setStatus('denied');
        }}
        onAlwaysAllow={() => setApproval({ decision: 'always' })}
      />
      <button type="button">After</button>
    </div>
  );
}
