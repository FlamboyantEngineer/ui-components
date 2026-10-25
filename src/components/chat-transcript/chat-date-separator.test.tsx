import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatDateSeparator } from './chat-date-separator.js';

const getNow = () => new Date('2026-04-20T10:30:00');

function label(container: HTMLElement) {
  return container.querySelector('.ui-chat-date-separator__label');
}

describe('ChatDateSeparator', () => {
  it('UIC-CHAT-TRANSCRIPT-5.2 says Today, Yesterday or the full date', () => {
    const { container, rerender } = render(<ChatDateSeparator date="2026-04-20" getNow={getNow} />);
    expect(label(container)).toHaveTextContent('Today');
    expect(label(container)).toHaveAttribute('datetime', '2026-04-20');
    expect(label(container)).not.toHaveAttribute('tabindex');
    expect(container.querySelector('.ui-chat-date-separator')).not.toHaveAttribute('role');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', {
      slots: ['ui-chat-date-separator__label'],
    });
    rerender(<ChatDateSeparator date="2026-04-19" getNow={getNow} />);
    expect(label(container)).toHaveTextContent('Yesterday');
    rerender(<ChatDateSeparator date="2026-04-18" getNow={getNow} />);
    expect(label(container)).toHaveTextContent('Saturday, April 18, 2026');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-5.2 reads a date and time as its local day and skips unreadable dates', () => {
    const { container, rerender } = render(
      <ChatDateSeparator date="2026-04-19T23:59:00" getNow={getNow} />,
    );
    expect(label(container)).toHaveTextContent('Yesterday');
    expect(label(container)).toHaveAttribute('datetime', '2026-04-19');
    rerender(<ChatDateSeparator date="soon" getNow={getNow} />);
    expect(container.querySelector('.ui-chat-date-separator')).toBeNull();
  });

  it('UIC-CHAT-TRANSCRIPT-5.6 forwards attributes to the separator', () => {
    const { container } = render(
      <ChatDateSeparator
        id="d1"
        className="caller"
        data-testid="probe"
        date="2026-04-20"
        getNow={getNow}
      />,
    );
    const separator = container.querySelector('.ui-chat-date-separator');
    expect(separator).toHaveAttribute('id', 'd1');
    expect(separator).toHaveClass('caller');
    expect(separator).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});
