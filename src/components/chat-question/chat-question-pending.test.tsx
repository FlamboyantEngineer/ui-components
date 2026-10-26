import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  databaseQuestion,
  featuresQuestion,
  nameQuestion,
} from '../../../test/chat-question-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  ChatQuestion,
  type ChatQuestionAnswer,
  type ChatQuestionItem,
  type ChatQuestionStatus,
} from './chat-question.js';

const three = [databaseQuestion, featuresQuestion, nameQuestion];

function submitButton() {
  return screen.getByRole('button', { name: 'Submit' });
}

/** A card whose host settles it as answered or dismissed, as a conversation would. */
function SettlingCard({
  questions,
  onSubmit,
}: {
  questions: ChatQuestionItem[];
  onSubmit?: (answers: ChatQuestionAnswer[]) => void;
}) {
  const [status, setStatus] = useState<ChatQuestionStatus>('pending');
  const [answers, setAnswers] = useState<ChatQuestionAnswer[]>([]);
  return (
    <>
      <ChatQuestion
        id="ask"
        questions={questions}
        status={status}
        answers={answers}
        onSubmit={(given) => {
          onSubmit?.(given);
          setAnswers(given);
          setStatus('answered');
        }}
        onDismiss={() => setStatus('dismissed')}
      />
      <button type="button">Elsewhere</button>
    </>
  );
}

describe('ChatQuestion answering', () => {
  it('UIC-CHAT-QUESTION-2.2 keeps Submit focusable but unavailable until every question is answered', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onSubmit={onSubmit} />,
    );
    const submit = submitButton();
    expect(submit).toHaveClass('ui-chat-question__submit');
    expect(submit.closest('.ui-chat-question__actions')).not.toBeNull();
    expect(submit).toHaveAttribute('aria-disabled', 'true');
    await user.tab();
    await user.tab();
    expect(submit).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Answer every question to submit.',
    );
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith([{ questionId: 'database', optionIds: ['mysql'] }]);
    expect(screen.getByRole('radio', { name: 'MySQL' })).toBeChecked();
  });

  it('UIC-CHAT-QUESTION-2.2 counts Other as unanswered until it has words', async () => {
    const user = userEvent.setup();
    render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onSubmit={vi.fn()} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Other' }));
    expect(submitButton()).toHaveAttribute('aria-disabled', 'true');
    await user.type(await screen.findByRole('textbox', { name: 'Other answer' }), '   ');
    expect(submitButton()).toHaveAttribute('aria-disabled', 'true');
    await user.type(screen.getByRole('textbox', { name: 'Other answer' }), 'Redis');
    expect(submitButton()).not.toHaveAttribute('aria-disabled');
  });

  it('UIC-CHAT-QUESTION-2.3 draws Dismiss only when the card can be dismissed', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" />,
    );
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
    rerender(
      <ChatQuestion
        id="ask"
        questions={[databaseQuestion]}
        status="pending"
        onDismiss={onDismiss}
      />,
    );
    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    expect(dismiss).toHaveClass('ui-chat-question__dismiss', 'ui-button');
    expect(dismiss).toHaveAttribute('data-variant', 'ghost');
    await user.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-QUESTION-2.4 submits on Enter in the Other field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onSubmit={onSubmit} />,
    );
    await user.click(screen.getByRole('radio', { name: 'Other' }));
    const field = await screen.findByRole('textbox', { name: 'Other answer' });
    await waitFor(() => expect(field).toHaveFocus());
    await user.keyboard('Redis{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'database', optionIds: [], otherText: 'Redis' },
    ]);
  });

  it('UIC-CHAT-QUESTION-2.4 UIC-CHAT-QUESTION-2.5 shows the required message on Enter in an empty field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(
      <ChatQuestion id="ask" questions={[nameQuestion]} status="pending" onSubmit={onSubmit} />,
    );
    const field = screen.getByRole('textbox', { name: nameQuestion.question });
    expect(field).not.toHaveAttribute('aria-invalid');
    await user.click(field);
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleErrorMessage('A value is required.');
    expect(container.querySelector('.ui-field__message')).toHaveTextContent('A value is required.');
    await user.keyboard('Notebook');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-CHAT-QUESTION-2.5 shows the Other field’s message once focus leaves it, with no restore button', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <div onKeyDown={(event) => onKeyDown(event.key)}>
        <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onSubmit={vi.fn()} />
      </div>,
    );
    await user.click(screen.getByRole('radio', { name: 'Other' }));
    const field = await screen.findByRole('textbox', { name: 'Other answer' });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toBeRequired();
    expect(field).not.toHaveAttribute('aria-invalid');
    await user.keyboard('Redis');
    expect(screen.queryByRole('button', { name: /Restore/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(field).toHaveValue('Redis');
    expect(onKeyDown).toHaveBeenLastCalledWith('Escape');
    await user.clear(field);
    await user.tab();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleErrorMessage('A value is required.');
  });

  it('UIC-CHAT-QUESTION-2.6 keeps focus in the card once the reader’s submit settles it', async () => {
    const user = userEvent.setup();
    render(<SettlingCard questions={[databaseQuestion]} />);
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    await user.click(submitButton());
    const root = screen.getByRole('group', { name: `Question: ${databaseQuestion.question}` });
    expect(root).toHaveAttribute('data-status', 'answered');
    await waitFor(() => expect(root).toHaveFocus());
    expect(screen.getByRole('definition')).toHaveTextContent('You chose SQLite');
  });

  it('UIC-CHAT-QUESTION-2.6 keeps focus in the card once the reader dismisses it', async () => {
    const user = userEvent.setup();
    render(<SettlingCard questions={[databaseQuestion]} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    const root = screen.getByRole('group', { name: `Question: ${databaseQuestion.question}` });
    expect(root).toHaveAttribute('data-status', 'dismissed');
    await waitFor(() => expect(root).toHaveFocus());
  });

  it('UIC-CHAT-QUESTION-2.6 leaves focus the reader moved elsewhere', async () => {
    const user = userEvent.setup();
    const elsewhere = { current: null as HTMLElement | null };
    render(
      <SettlingCard questions={[databaseQuestion]} onSubmit={() => elsewhere.current?.focus()} />,
    );
    elsewhere.current = screen.getByRole('button', { name: 'Elsewhere' });
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    await user.click(submitButton());
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });
});

describe('ChatQuestion with several questions', () => {
  it('UIC-CHAT-QUESTION-3.1 asks one question at a time behind chips and a progress hint', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChatQuestion
        id="ask"
        questions={three}
        status="pending"
        onSubmit={() => {}}
        onDismiss={() => {}}
      />,
    );
    const root = screen.getByRole('group', { name: `3 questions: ${databaseQuestion.question}` });
    expect(root).toHaveAttribute('data-stepped', 'true');
    const steps = screen.getByRole('list', { name: 'Questions' });
    expect(steps).toHaveClass('ui-chat-question__steps');
    const chips = within(steps).getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent)).toEqual(['Database', 'Features', 'Question 3']);
    expect(chips[0]).toHaveAttribute('aria-current', 'step');
    expect(chips[0]).toHaveAttribute('data-current', 'true');
    expect(chips[1]).not.toHaveAttribute('aria-current');
    expect(container.querySelector('.ui-chat-question__progress')).toHaveTextContent(
      'Question 1 of 3',
    );
    expect(container.querySelector('.ui-chat-question__header')).toBeNull();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(chips[0]).not.toHaveAttribute('data-answered');
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    expect(chips[0]).toHaveAttribute('data-answered', 'true');
    expectHooksMatchSpec(container, 'CHAT-QUESTION', {
      slots: ['steps', 'step', 'progress', 'item', 'question', 'actions', 'next', 'dismiss'],
    });
  });

  it('UIC-CHAT-QUESTION-3.2 offers Back and Next, keeping the drafts, and Submit on the last question', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toHaveClass('ui-chat-question__next');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    await user.click(next);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Search' }));
    const back = screen.getByRole('button', { name: 'Back' });
    expect(back).toHaveClass('ui-chat-question__back');
    await user.click(back);
    expect(screen.getByRole('radio', { name: 'SQLite' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('checkbox', { name: 'Search' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: nameQuestion.question }), 'Notebook');
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'database', optionIds: ['sqlite'] },
      { questionId: 'features', optionIds: ['search'] },
      { questionId: 'name', optionIds: [], otherText: 'Notebook' },
    ]);
  });

  it('UIC-CHAT-QUESTION-3.2 hints why Next is unavailable', async () => {
    const user = userEvent.setup();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={vi.fn()} />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Answer this question to continue.',
    );
  });

  it('UIC-CHAT-QUESTION-3.3 UIC-CHAT-QUESTION-2.4 moves focus to each question’s answer as the reader steps', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={onSubmit} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('checkbox', { name: 'Sign-in' })).toHaveFocus();
    await user.keyboard(' ');
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Back' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('radio', { name: 'SQLite' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('checkbox', { name: 'Sign-in' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const name = screen.getByRole('textbox', { name: nameQuestion.question });
    expect(name).toHaveFocus();
    await user.keyboard('Notebook{Enter}');
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'database', optionIds: ['sqlite'] },
      { questionId: 'features', optionIds: ['sign-in'] },
      { questionId: 'name', optionIds: [], otherText: 'Notebook' },
    ]);
  });

  it('UIC-CHAT-QUESTION-2.4 steps on with Enter in the Other field of an earlier question', async () => {
    const user = userEvent.setup();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={vi.fn()} />);
    await user.click(screen.getByRole('radio', { name: 'Other' }));
    const field = await screen.findByRole('textbox', { name: 'Other answer' });
    await waitFor(() => expect(field).toHaveFocus());
    await user.keyboard('Redis{Enter}');
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Sign-in' })).toHaveFocus();
  });
});
