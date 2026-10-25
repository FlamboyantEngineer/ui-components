import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatQuote } from './chat-quote.js';

describe('ChatQuote', () => {
  it('UIC-CHAT-TRANSCRIPT-5.1 shows the author and the excerpt in a blockquote', () => {
    const { container } = render(<ChatQuote authorName="Ana Lopez" excerpt="Lunch at noon?" />);
    const quote = container.querySelector('.ui-chat-quote');
    expect(quote?.tagName).toBe('BLOCKQUOTE');
    expect(container.querySelector('.ui-chat-quote__author')).toHaveTextContent('Ana Lopez');
    expect(container.querySelector('.ui-chat-quote__excerpt')).toHaveTextContent('Lunch at noon?');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', {
      slots: ['ui-chat-quote__author', 'ui-chat-quote__excerpt'],
    });
    const { container: blank } = render(<ChatQuote authorName=" " excerpt="Hi" />);
    expect(blank.querySelector('.ui-chat-quote__author')).toHaveTextContent('Unnamed');
  });

  it('UIC-CHAT-TRANSCRIPT-5.1 is a button named by its author and excerpt with onPress', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <ChatQuote authorName="Ana Lopez" excerpt="Lunch at noon?" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Quote from Ana Lopez: Lunch at noon?' });
    expect(button).toHaveClass('ui-chat-quote');
    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(button).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', {
      slots: ['ui-chat-quote__author', 'ui-chat-quote__excerpt'],
    });
  });

  it('UIC-CHAT-TRANSCRIPT-5.6 forwards attributes to the quote', () => {
    const { container } = render(
      <ChatQuote id="q1" className="caller" data-testid="probe" authorName="Ana" excerpt="Hi" />,
    );
    const quote = container.querySelector('.ui-chat-quote');
    expect(quote).toHaveAttribute('id', 'q1');
    expect(quote).toHaveClass('caller');
    expect(quote).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});
