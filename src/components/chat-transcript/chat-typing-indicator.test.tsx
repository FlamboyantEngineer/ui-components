import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatTypingIndicator } from './chat-typing-indicator.js';

describe('ChatTypingIndicator', () => {
  it('UIC-CHAT-TRANSCRIPT-5.4 says who is typing with the right plural', () => {
    const { container, rerender } = render(<ChatTypingIndicator names={['Ana']} />);
    const status = screen.getByRole('status');
    expect(status).toHaveClass('ui-chat-typing-indicator');
    expect(status).toHaveTextContent('Ana is typing…');
    expect(container.querySelector('.ui-chat-typing-indicator__dots')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.querySelectorAll('.ui-chat-typing-indicator__dot')).toHaveLength(3);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['dots', 'dot', 'text'] });
    rerender(<ChatTypingIndicator names={['Ana', 'Ben']} />);
    expect(status).toHaveTextContent('Ana and Ben are typing…');
    rerender(<ChatTypingIndicator names={['Ana', 'Ben', 'Cy']} />);
    expect(status).toHaveTextContent('Ana and 2 others are typing…');
    rerender(<ChatTypingIndicator names={['  ', 'Ben', 'Cy', 'Dee']} />);
    expect(status).toHaveTextContent('Unnamed and 3 others are typing…');
  });

  it('UIC-CHAT-TRANSCRIPT-5.4 stays mounted and empty while nobody types', () => {
    const { container, rerender } = render(<ChatTypingIndicator names={['Ana']} />);
    const status = screen.getByRole('status');
    rerender(<ChatTypingIndicator names={[]} />);
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveAttribute('data-empty', 'true');
    expect(status).toBeEmptyDOMElement();
    rerender(<ChatTypingIndicator />);
    expect(status).toBeEmptyDOMElement();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-5.6 forwards attributes to the indicator', () => {
    const { container } = render(
      <ChatTypingIndicator id="t1" className="caller" data-testid="probe" names={['Ana']} />,
    );
    const indicator = container.querySelector('.ui-chat-typing-indicator');
    expect(indicator).toHaveAttribute('id', 't1');
    expect(indicator).toHaveClass('caller');
    expect(indicator).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});
