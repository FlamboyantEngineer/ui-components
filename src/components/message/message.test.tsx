import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from './index.js';

it('UIC-MESSAGE-1.1 keeps the article label, stream state, caller content and footer actions', async () => {
  const user = userEvent.setup();
  const copy = vi.fn();
  const { container, rerender } = render(
    <Message aria-label="Reply" align="end" isStreaming>
      <MessageContent>Here is the result.</MessageContent>
      <MessageFooter>
        <button onClick={copy}>Copy reply</button>
      </MessageFooter>
    </Message>,
  );
  const reply = screen.getByRole('article', { name: 'Reply' });
  expect(reply).toHaveAttribute('data-align', 'end');
  expect(reply).toHaveAttribute('aria-busy', 'true');
  expect(within(reply).getByText('Here is the result.')).toBeInTheDocument();
  await user.click(within(reply).getByRole('button', { name: 'Copy reply' }));
  expect(copy).toHaveBeenCalledOnce();
  expectHooksMatchSpec(container, 'MESSAGE', { slots: ['content', 'footer'] });
  rerender(<Message aria-label="Reply">Finished</Message>);
  expect(reply).not.toHaveAttribute('aria-busy', 'true');
  expect(reply).toHaveAttribute('data-align', 'start');
});

it('UIC-MESSAGE-1.2 groups messages and places the avatar, header and footer of each', () => {
  const { container } = render(
    <MessageGroup role="group" aria-label="Turn by Ada" data-testid="turn">
      <Message aria-label="First message">
        <MessageAvatar>AL</MessageAvatar>
        <MessageContent>
          <MessageHeader>
            <span>Ada</span> <time dateTime="2026-11-20T10:00">10:00</time>
          </MessageHeader>
          The tide turns at noon.
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>
      <Message aria-label="Second message">
        <MessageContent>Bring a coat.</MessageContent>
      </Message>
    </MessageGroup>,
  );
  const turn = screen.getByRole('group', { name: 'Turn by Ada' });
  expect(turn).toHaveClass('ui-message-group');
  expect(turn).toHaveAttribute('data-testid', 'turn');
  const [first, second] = within(turn).getAllByRole('article');
  expect(first).toHaveAccessibleName('First message');
  expect(second).toHaveAccessibleName('Second message');
  const avatar = first?.querySelector('.ui-message__avatar');
  expect(avatar).toHaveTextContent('AL');
  expect(first?.firstElementChild).toBe(avatar);
  const header = first?.querySelector('.ui-message__content > .ui-message__header');
  expect(header).toHaveTextContent('Ada 10:00');
  expect(second?.querySelector('.ui-message__avatar')).toBeNull();
  expectHooksMatchSpec(container, 'MESSAGE', { slots: 'all', callerAttributes: ['data-testid'] });
});
