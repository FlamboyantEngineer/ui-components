import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { nameQuestion } from '../../../test/chat-question-fixtures.js';
import { ChatQuestion, type ChatQuestionStatus } from './chat-question.js';

function deferred() {
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((_, fail) => {
    reject = fail;
  });
  return { promise, reject };
}

const name = `Question: ${nameQuestion.question}`;

function Card(props: {
  id: string;
  status: ChatQuestionStatus;
  onSubmit: () => Promise<void>;
  onDismiss?: () => Promise<void>;
}) {
  return <ChatQuestion questions={[nameQuestion]} {...props} />;
}

async function submitWords(user: ReturnType<typeof userEvent.setup>, words: string) {
  await user.type(screen.getByRole('textbox', { name: nameQuestion.question }), words);
  await user.click(screen.getByRole('button', { name: 'Submit' }));
}

describe('ChatQuestion request lifetimes', () => {
  it('UIC-CHAT-QUESTION-2.7 sends again once the same card is pending again, ignoring the earlier request', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const second = deferred();
    const onSubmit = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onDismiss = vi.fn(() => new Promise<void>(() => {}));
    const { rerender } = render(<Card id="ask" status="pending" onSubmit={onSubmit} />);
    await submitWords(user, 'Notebook');
    rerender(<Card id="ask" status="dismissed" onSubmit={onSubmit} />);
    rerender(<Card id="ask" status="pending" onSubmit={onSubmit} onDismiss={onDismiss} />);
    const group = screen.getByRole('group', { name });
    expect(group).not.toHaveAttribute('data-submitting');
    await submitWords(user, 'Journal');
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(group).toHaveAttribute('data-submitting', 'true');
    await act(async () => first.reject(new Error('The first request failed.')));
    expect(group).toHaveAttribute('data-submitting', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => second.reject(new Error('The second request failed.')));
    expect(group).not.toHaveAttribute('data-submitting');
    expect(screen.getByRole('alert')).toHaveTextContent('The second request failed.');
  });

  it('UIC-CHAT-QUESTION-2.7 dismisses a card back on its earlier id while that id’s request is unsettled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise<void>(() => {}));
    const onDismiss = vi.fn(() => new Promise<void>(() => {}));
    const { rerender } = render(
      <Card id="a" status="pending" onSubmit={onSubmit} onDismiss={onDismiss} />,
    );
    await submitWords(user, 'Notebook');
    rerender(<Card id="b" status="pending" onSubmit={onSubmit} onDismiss={onDismiss} />);
    rerender(<Card id="a" status="pending" onSubmit={onSubmit} onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('group', { name })).toHaveAttribute('data-submitting', 'true');
  });
});
