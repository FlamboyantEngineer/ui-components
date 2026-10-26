import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  databaseQuestion,
  featuresQuestion,
  nameQuestion,
} from '../../../test/chat-question-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatQuestion } from './chat-question.js';

const three = [databaseQuestion, featuresQuestion, nameQuestion];

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function card(name: string) {
  return screen.getByRole('group', { name });
}

const oneName = `Question: ${databaseQuestion.question}`;
const threeName = `3 questions: ${databaseQuestion.question}`;

/** Answers all three questions with an option, Other and its words, ticks and free text. */
async function answerThree(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: 'Other' }));
  await user.type(await screen.findByRole('textbox', { name: 'Other answer' }), 'Redis');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.click(screen.getByRole('checkbox', { name: 'Search' }));
  await user.click(screen.getByRole('checkbox', { name: 'Other' }));
  await user.type(await screen.findByRole('textbox', { name: 'Other answer' }), 'Offline');
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await user.type(screen.getByRole('textbox', { name: nameQuestion.question }), 'Notebook');
}

const threeAnswers = [
  { questionId: 'database', optionIds: [], otherText: 'Redis' },
  { questionId: 'features', optionIds: ['search'], otherText: 'Offline' },
  { questionId: 'name', optionIds: [], otherText: 'Notebook' },
];

describe('ChatQuestion requests', () => {
  it('UIC-CHAT-QUESTION-2.7 locks the card while the answers are submitted and keeps them once accepted', async () => {
    const user = userEvent.setup();
    const request = deferred();
    const onSubmit = vi.fn(() => request.promise);
    const { container, rerender } = render(
      <ChatQuestion
        id="ask"
        questions={[databaseQuestion]}
        status="pending"
        onSubmit={onSubmit}
        onDismiss={vi.fn()}
      />,
    );
    const root = card(oneName);
    expect(root).not.toHaveAttribute('data-submitting');
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    const submit = screen.getByRole('button', { name: 'Submit' });
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'database', optionIds: ['sqlite'] }]);
    expect(root).toHaveAttribute('data-submitting', 'true');
    expect(root).toHaveAttribute('data-status', 'pending');
    expect(submit).toHaveAttribute('data-pending', 'true');
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    expect(submit).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDisabled();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    expect(screen.getByRole('radio', { name: 'SQLite' })).toBeChecked();
    expectHooksMatchSpec(container, 'CHAT-QUESTION', { slots: ['options', 'submit'] });
    await user.click(submit);
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => request.resolve());
    expect(root).not.toHaveAttribute('data-submitting');
    expect(root).toHaveAttribute('data-status', 'pending');
    expect(screen.getByRole('radio', { name: 'SQLite' })).toBeChecked();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(
      <ChatQuestion
        id="ask"
        questions={[databaseQuestion]}
        status="answered"
        answers={[{ questionId: 'database', optionIds: ['sqlite'] }]}
      />,
    );
    expect(screen.getByRole('definition')).toHaveTextContent('You chose SQLite');
  });

  it('UIC-CHAT-QUESTION-2.7 calls onSubmit once when Submit is pressed twice quickly', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise<void>(() => {}));
    render(
      <ChatQuestion id="ask" questions={[nameQuestion]} status="pending" onSubmit={onSubmit} />,
    );
    const field = screen.getByRole('textbox', { name: nameQuestion.question });
    await user.type(field, 'Notebook');
    await user.dblClick(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await user.click(field);
    await user.keyboard('{Enter}{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-QUESTION-2.7 keeps focus in the answer field while Enter submits', async () => {
    const user = userEvent.setup();
    const request = deferred();
    render(
      <ChatQuestion
        id="ask"
        questions={[nameQuestion]}
        status="pending"
        onSubmit={() => request.promise}
      />,
    );
    const field = screen.getByRole('textbox', { name: nameQuestion.question });
    await user.type(field, 'Notebook{Enter}');
    expect(card(`Question: ${nameQuestion.question}`)).toHaveAttribute('data-submitting', 'true');
    expect(field).toHaveFocus();
    expect(field).toHaveAttribute('readonly');
    await user.keyboard('s');
    expect(field).toHaveValue('Notebook');
    await act(async () => request.reject(new Error('The agent stopped.')));
    expect(field).toHaveFocus();
    expect(field).not.toHaveAttribute('readonly');
    expect(screen.getByRole('alert')).toHaveTextContent('The agent stopped.');
  });

  it('UIC-CHAT-QUESTION-2.8 keeps every answer and the step when the answers are refused, and retries once', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('The agent is busy.'))
      .mockResolvedValueOnce(undefined);
    const { container } = render(
      <ChatQuestion id="ask" questions={three} status="pending" onSubmit={onSubmit} />,
    );
    await answerThree(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    const error = await screen.findByRole('alert');
    expect(error).toHaveClass('ui-chat-question__error', 'ui-inline-error');
    expect(error).toHaveTextContent('The agent is busy.');
    expect(card(threeName)).not.toHaveAttribute('data-submitting');
    expect(container.querySelector('.ui-chat-question__progress')).toHaveTextContent(
      'Question 3 of 3',
    );
    expect(screen.getByRole('textbox', { name: nameQuestion.question })).toHaveValue('Notebook');
    expectHooksMatchSpec(container, 'CHAT-QUESTION', { slots: ['error'] });
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('checkbox', { name: 'Search' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Other answer' })).toHaveValue('Offline');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('radio', { name: 'Other' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Other answer' })).toHaveValue('Redis');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(onSubmit).toHaveBeenNthCalledWith(1, threeAnswers);
    expect(onSubmit).toHaveBeenNthCalledWith(2, threeAnswers);
    await waitFor(() => expect(card(threeName)).not.toHaveAttribute('data-submitting'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('UIC-CHAT-QUESTION-2.8 says the answers were not sent when a failure has no message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce('offline')
      .mockImplementationOnce(() => {
        throw new Error('No connection.');
      });
    render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onSubmit={onSubmit} />,
    );
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The answers could not be sent. Try again.',
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No connection.');
    expect(screen.getByRole('radio', { name: 'MySQL' })).toBeChecked();
    expect(card(oneName)).not.toHaveAttribute('data-submitting');
  });

  it('UIC-CHAT-QUESTION-2.3 UIC-CHAT-QUESTION-2.7 UIC-CHAT-QUESTION-2.8 awaits a dismissal, refusing Submit meanwhile', async () => {
    const user = userEvent.setup();
    const request = deferred();
    const onSubmit = vi.fn();
    const onDismiss = vi.fn(() => request.promise);
    render(
      <ChatQuestion
        id="ask"
        questions={[databaseQuestion]}
        status="pending"
        onSubmit={onSubmit}
        onDismiss={onDismiss}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(dismiss);
    expect(card(oneName)).toHaveAttribute('data-submitting', 'true');
    expect(dismiss).toHaveAttribute('data-pending', 'true');
    expect(dismiss).toHaveFocus();
    const submit = screen.getByRole('button', { name: 'Submit' });
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    await user.click(submit);
    await user.click(dismiss);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await act(async () => request.reject('offline'));
    expect(screen.getByRole('alert')).toHaveTextContent('The action could not be completed.');
    expect(screen.getByRole('radio', { name: 'MySQL' })).toBeChecked();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-QUESTION-2.9 renders a pending card read-only without onSubmit', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChatQuestion id="ask" questions={three} status="pending" />);
    expect(container.querySelector('.ui-chat-question__actions')).not.toBeNull();
    const group = screen.getByRole('radiogroup', { name: databaseQuestion.question });
    expect(group).toHaveAttribute('aria-readonly', 'true');
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    expect(screen.getByRole('radio', { name: 'SQLite' })).not.toBeChecked();
    expectHooksMatchSpec(container, 'CHAT-QUESTION', { slots: ['options', 'actions', 'next'] });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).not.toHaveAttribute('aria-disabled');
    await user.click(next);
    expect(screen.getByRole('checkbox', { name: 'Sign-in' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Sign-in' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const name = screen.getByRole('textbox', { name: nameQuestion.question });
    expect(name).toHaveAttribute('readonly');
    await user.keyboard('Notebook{Enter}');
    expect(name).toHaveValue('');
    await user.tab({ shift: true });
    expect(name).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(
      within(card(threeName))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Back']);
  });

  it('UIC-CHAT-QUESTION-2.9 leaves a read-only card with one question no actions but Dismiss', () => {
    const { container, rerender } = render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" />,
    );
    expect(container.querySelector('.ui-chat-question__actions')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onDismiss={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-QUESTION-2.10 starts afresh when the card changes id, and a late failure touches nothing', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const onFirst = vi.fn(() => first.promise);
    const onSecond = vi.fn();
    const { rerender } = render(
      <ChatQuestion id="ask-1" questions={three} status="pending" onSubmit={onFirst} />,
    );
    await answerThree(user);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(card(threeName)).toHaveAttribute('data-submitting', 'true');
    rerender(
      <ChatQuestion
        id="ask-2"
        questions={[databaseQuestion]}
        status="pending"
        onSubmit={onSecond}
      />,
    );
    const root = card(oneName);
    expect(root).toHaveAttribute('id', 'ask-2');
    expect(root).not.toHaveAttribute('data-submitting');
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('aria-disabled', 'true');
    await act(async () => first.reject(new Error('The first card failed.')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(root).not.toHaveAttribute('data-submitting');
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSecond).toHaveBeenCalledTimes(1);
    expect(onSecond).toHaveBeenCalledWith([{ questionId: 'database', optionIds: ['mysql'] }]);
    expect(onFirst).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-QUESTION-2.10 forgets a request once the card settles or unmounts', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const second = deferred();
    const onSubmit = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const props = { id: 'ask', questions: [databaseQuestion], onSubmit } as const;
    const { rerender, unmount } = render(<ChatQuestion {...props} status="pending" />);
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    rerender(<ChatQuestion {...props} status="dismissed" />);
    expect(card(oneName)).not.toHaveAttribute('data-submitting');
    rerender(<ChatQuestion {...props} status="pending" />);
    expect(card(oneName)).not.toHaveAttribute('data-submitting');
    expect(screen.getByRole('radio', { name: 'SQLite' })).not.toBeChecked();
    await act(async () => first.reject(new Error('Too late.')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(card(oneName)).not.toHaveAttribute('data-submitting');
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(card(oneName)).toHaveAttribute('data-submitting', 'true');
    const consoleError = vi.spyOn(console, 'error');
    unmount();
    await act(async () => second.reject(new Error('Gone.')));
    expect(consoleError).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
