import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Message, MessageContent, MessageFooter } from './index.js';

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
  expectHooksMatchSpec(container, 'MESSAGE', { slots: 'all' });
  rerender(<Message aria-label="Reply">Finished</Message>);
  expect(reply).not.toHaveAttribute('aria-busy', 'true');
  expect(reply).toHaveAttribute('data-align', 'start');
});
