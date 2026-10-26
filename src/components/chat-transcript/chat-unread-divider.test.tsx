import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatUnreadDivider } from './chat-unread-divider.js';

describe('ChatUnreadDivider', () => {
  it('UIC-CHAT-TRANSCRIPT-5.3 marks where the new messages begin', () => {
    const { container } = render(<ChatUnreadDivider />);
    expect(container.querySelector('.ui-chat-unread-divider__label')).toHaveTextContent(
      'New messages',
    );
    expect(container.querySelector('.ui-chat-unread-divider')).not.toHaveAttribute('role');
    expect(screen.getByText('New messages')).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', {
      slots: ['ui-chat-unread-divider__label'],
    });
  });

  it('UIC-CHAT-TRANSCRIPT-5.6 forwards attributes to the divider', () => {
    const { container } = render(
      <ChatUnreadDivider id="u1" className="caller" data-testid="probe" />,
    );
    const divider = container.querySelector('.ui-chat-unread-divider');
    expect(divider).toHaveAttribute('id', 'u1');
    expect(divider).toHaveClass('caller');
    expect(divider).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});
