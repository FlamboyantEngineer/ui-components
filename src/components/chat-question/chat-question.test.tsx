import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  databaseQuestion,
  featuresQuestion,
  nameQuestion,
} from '../../../test/chat-question-fixtures.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { ChatQuestion, type ChatQuestionItem } from './chat-question.js';

function card(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-chat-question');
}

function renderPending(questions: ChatQuestionItem[]) {
  const onSubmit = vi.fn();
  const view = render(
    <ChatQuestion id="ask" questions={questions} status="pending" onSubmit={onSubmit} />,
  );
  return { ...view, onSubmit };
}

describe('ChatQuestion', () => {
  it('UIC-CHAT-QUESTION-1.1 UIC-CHAT-QUESTION-1.2 UIC-CHAT-QUESTION-5.2 is a group named from its first question', () => {
    const { container } = render(
      <ChatQuestion
        id="ask-database"
        questions={[databaseQuestion]}
        status="pending"
        onSubmit={() => {}}
        className="extra"
        data-test="card"
        data-status="caller"
      />,
    );
    const root = screen.getByRole('group', { name: `Question: ${databaseQuestion.question}` });
    expect(root).toBe(card(container));
    expect(root).toHaveClass('ui-chat-question', 'extra');
    expect(root).toHaveAttribute('id', 'ask-database');
    expect(root).toHaveAttribute('data-test', 'card');
    expect(root).toHaveAttribute('data-status', 'pending');
    expect(root).not.toHaveAttribute('data-stepped');
    expect(root).not.toHaveAttribute('tabindex');
    const item = root.querySelector('.ui-chat-question__item');
    expect(item).toHaveAttribute('data-selection-mode', 'single');
    expect(item?.querySelector('p.ui-chat-question__question')).toHaveTextContent(
      databaseQuestion.question,
    );
    expect(screen.getByRole('tab', { name: 'Database' })).toHaveAttribute('aria-selected', 'true');
    expectHooksMatchSpec(container, 'CHAT-QUESTION', {
      slots: [
        'item',
        'question',
        'answer',
        'options',
        'option',
        'recommended',
        'description',
        'actions',
        'submit',
        'announcement',
      ],
      callerAttributes: ['data-test'],
    });
  });

  it('UIC-CHAT-QUESTION-1.3 draws a single-choice question as a radio group walked by the arrow keys', async () => {
    const user = userEvent.setup();
    const { container } = renderPending([{ ...databaseQuestion, allowsOther: false }]);
    const group = screen.getByRole('radiogroup', { name: databaseQuestion.question });
    expect(group).toHaveClass('ui-chat-question__options');
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
    expect(within(group).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    // The question's tab comes first; Tab moves on into its answer.
    await user.tab();
    await user.tab();
    const first = screen.getByRole('radio', { name: 'PostgreSQL Recommended' });
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    const sqlite = screen.getByRole('radio', { name: 'SQLite' });
    expect(sqlite).toHaveFocus();
    expect(sqlite).toBeChecked();
    expect(sqlite.closest('.ui-chat-question__option')).toHaveAttribute('data-selected', 'true');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(first).toBeChecked();
    expect(container.querySelectorAll('.ui-chat-question__option[data-selected]')).toHaveLength(1);
  });

  it('UIC-CHAT-QUESTION-1.4 draws a multiple-choice question as a checkbox group toggled with Space', async () => {
    const user = userEvent.setup();
    const { container } = renderPending([{ ...featuresQuestion, allowsOther: false }]);
    const group = screen.getByRole('group', { name: featuresQuestion.question });
    expect(group).toHaveClass('ui-chat-question__options');
    expect(container.querySelector('.ui-chat-question__item')).toHaveAttribute(
      'data-selection-mode',
      'multiple',
    );
    // The question's tab comes first; Tab moves on into its answer.
    await user.tab();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Sign-in' })).toHaveFocus();
    await user.tab();
    await user.keyboard(' ');
    const search = screen.getByRole('checkbox', { name: 'Search' });
    expect(search).toBeChecked();
    expect(search.closest('.ui-chat-question__option')).toHaveAttribute('data-selected', 'true');
    await user.keyboard(' ');
    expect(search).not.toBeChecked();
  });

  it('UIC-CHAT-QUESTION-1.5 UIC-CHAT-QUESTION-2.1 answers a free-text question in the reader’s own words', async () => {
    const user = userEvent.setup();
    const { container, onSubmit } = renderPending([nameQuestion]);
    expect(container.querySelector('.ui-chat-question__item')).toHaveAttribute(
      'data-selection-mode',
      'none',
    );
    const field = screen.getByRole('textbox', { name: nameQuestion.question });
    expect(field).toHaveAttribute('placeholder', 'Type your answer');
    expect(field).toBeRequired();
    expect(field.closest('.ui-chat-question__text')).toHaveClass('ui-text-field');
    await user.type(field, '  Notebook  ');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'name', optionIds: [], otherText: 'Notebook' },
    ]);
  });

  it('UIC-CHAT-QUESTION-1.6 names options by their label and recommendation and describes them', () => {
    const { container } = renderPending([databaseQuestion]);
    const recommended = screen.getByRole('radio', { name: 'PostgreSQL Recommended' });
    expect(recommended).toHaveAccessibleDescription('Relational, with JSON columns.');
    expect(recommended).not.toBeChecked();
    const option = recommended.closest('.ui-chat-question__option');
    expect(option).toHaveAttribute('data-recommended', 'true');
    expect(option?.querySelector('.ui-chat-question__recommended')).toHaveClass('ui-badge');
    expect(option?.querySelector('.ui-chat-question__description')).toHaveTextContent(
      'Relational, with JSON columns.',
    );
    const mysql = screen.getByRole('radio', { name: 'MySQL' });
    expect(mysql).not.toHaveAttribute('aria-describedby');
    expect(mysql.closest('.ui-chat-question__option')).not.toHaveAttribute('data-recommended');
    expect(container.querySelectorAll('.ui-chat-question__recommended')).toHaveLength(1);
  });

  it('UIC-CHAT-QUESTION-1.7 focuses the Other field when Other is pressed and keeps its words', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPending([databaseQuestion]);
    const other = screen.getByRole('radio', { name: 'Other' });
    expect(other.closest('.ui-chat-question__option')).toHaveAttribute('data-other', 'true');
    expect(screen.queryByRole('textbox', { name: 'Other answer' })).not.toBeInTheDocument();
    await user.click(other);
    const field = await screen.findByRole('textbox', { name: 'Other answer' });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field.closest('.ui-chat-question__other')).toHaveClass('ui-text-field');
    expect(field).toHaveAttribute('placeholder', 'Type your answer');
    await user.type(field, 'CockroachDB');
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    expect(screen.queryByRole('textbox', { name: 'Other answer' })).not.toBeInTheDocument();
    await user.click(other);
    expect(screen.getByRole('textbox', { name: 'Other answer' })).toHaveValue('CockroachDB');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'database', optionIds: [], otherText: 'CockroachDB' },
    ]);
  });

  it('UIC-CHAT-QUESTION-1.7 keeps focus on the radio when an arrow key moves onto Other', async () => {
    const user = userEvent.setup();
    renderPending([databaseQuestion]);
    await user.click(screen.getByRole('radio', { name: 'MySQL' }));
    await user.keyboard('{ArrowDown}');
    const other = screen.getByRole('radio', { name: 'Other' });
    expect(other).toBeChecked();
    expect(other).toHaveFocus();
    const field = screen.getByRole('textbox', { name: 'Other answer' });
    expect(field).not.toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'PostgreSQL Recommended' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Other answer' })).toHaveFocus();
  });

  it('UIC-CHAT-QUESTION-1.7 adds Other to the ticked options of a multiple-choice question', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderPending([featuresQuestion]);
    await user.click(screen.getByRole('checkbox', { name: 'Export to CSV' }));
    await user.click(screen.getByRole('checkbox', { name: 'Sign-in' }));
    await user.click(screen.getByRole('checkbox', { name: 'Other' }));
    const field = await screen.findByRole('textbox', { name: 'Other answer' });
    await waitFor(() => expect(field).toHaveFocus());
    await user.type(field, 'Offline mode');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'features', optionIds: ['sign-in', 'export'], otherText: 'Offline mode' },
    ]);
  });

  it('UIC-CHAT-QUESTION-1.8 shows the preview of the focused option, else of the chosen one', async () => {
    const user = userEvent.setup();
    const { container } = renderPending([databaseQuestion]);
    const answer = container.querySelector('.ui-chat-question__answer');
    expect(answer).toHaveAttribute('data-has-preview', 'true');
    expect(container.querySelector('.ui-chat-question__preview')).toBeNull();
    // The question's tab comes first; Tab moves on into its answer.
    await user.tab();
    await user.tab();
    const preview = screen.getByRole('group', { name: 'Preview of PostgreSQL' });
    expect(preview).toHaveClass('ui-chat-question__preview');
    expect(preview.querySelector('.ui-markdown__code-block')).toHaveTextContent('CREATE TABLE');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('group', { name: 'Preview of SQLite' })).toHaveTextContent(
      'A single file beside the app.',
    );
    await user.keyboard('{ArrowDown}');
    expect(container.querySelector('.ui-chat-question__preview')).toBeNull();
    await user.keyboard('{ArrowUp}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    expect(screen.getByRole('group', { name: 'Preview of SQLite' })).toBeInTheDocument();
  });

  it('UIC-CHAT-QUESTION-1.8 leaves the preview slot out of questions without previews', () => {
    const { container } = renderPending([
      { ...featuresQuestion, options: [{ id: 'a', label: 'A' }] },
    ]);
    expect(container.querySelector('.ui-chat-question__answer')).not.toHaveAttribute(
      'data-has-preview',
    );
  });

  it('UIC-CHAT-QUESTION-4.1 sums up an answered card', () => {
    const { container } = render(
      <ChatQuestion
        id="done"
        status="answered"
        questions={[databaseQuestion, featuresQuestion, nameQuestion]}
        answers={[
          { questionId: 'features', optionIds: ['export', 'sign-in'], otherText: ' Offline ' },
          { questionId: 'database', optionIds: ['postgres'] },
          { questionId: 'name', optionIds: [], otherText: 'Notebook' },
        ]}
      />,
    );
    const root = screen.getByRole('group', { name: `3 questions: ${databaseQuestion.question}` });
    expect(root).toHaveAttribute('data-status', 'answered');
    expect(root).toHaveAttribute('data-stepped', 'true');
    expect(root).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    const terms = screen.getAllByRole('term').map((term) => term.textContent);
    expect(terms).toEqual([
      databaseQuestion.question,
      featuresQuestion.question,
      nameQuestion.question,
    ]);
    const answers = screen.getAllByRole('definition').map((answer) => answer.textContent);
    expect(answers).toEqual([
      'You chose PostgreSQL',
      'You chose Sign-in, Export to CSV and Offline',
      'You answered: Notebook',
    ]);
    expectHooksMatchSpec(container, 'CHAT-QUESTION', {
      slots: ['summary', 'summary-item', 'summary-question', 'summary-answer'],
    });
  });

  it('UIC-CHAT-QUESTION-4.1 says when a question has no answer', () => {
    render(
      <ChatQuestion
        id="partial"
        status="answered"
        questions={[databaseQuestion, featuresQuestion, nameQuestion]}
        answers={[{ questionId: 'features', optionIds: ['gone'] }]}
      />,
    );
    const answers = screen.getAllByRole('definition').map((answer) => answer.textContent);
    expect(answers).toEqual(['No answer', 'No answer', 'No answer']);
  });

  it('UIC-CHAT-QUESTION-4.2 collapses a dismissed card to its question and Dismissed', () => {
    const { container } = render(
      <ChatQuestion
        id="later"
        status="dismissed"
        questions={[databaseQuestion, featuresQuestion]}
        onSubmit={() => {}}
        onDismiss={() => {}}
      />,
    );
    const root = screen.getByRole('group', { name: `2 questions: ${databaseQuestion.question}` });
    expect(root).toHaveAttribute('data-status', 'dismissed');
    expect(root.querySelector('.ui-chat-question__question')).toHaveTextContent(
      databaseQuestion.question,
    );
    expect(root.querySelector('.ui-chat-question__status')).toHaveTextContent('Dismissed');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-QUESTION', { slots: ['question', 'status'] });
  });

  it('UIC-CHAT-QUESTION-4.3 announces a pending card politely once it has mounted', async () => {
    const { rerender } = render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" />,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveClass('ui-chat-question__announcement');
    await waitFor(() => expect(status).toHaveTextContent(`Question: ${databaseQuestion.question}`));
    rerender(
      <ChatQuestion
        id="ask"
        questions={[databaseQuestion, featuresQuestion, nameQuestion]}
        status="pending"
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      `3 questions: ${databaseQuestion.question}`,
    );
    rerender(<ChatQuestion id="ask" questions={[databaseQuestion]} status="answered" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-QUESTION-5.1 takes every string from the provider', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider
        strings={{
          questionOther: 'Something else',
          questionOtherAnswer: 'Your words',
          questionRecommended: 'Suggested',
          questionSubmit: 'Send answers',
          questionPreview: (label) => `${label}, preview`,
          dismiss: 'Not now',
        }}
      >
        <ChatQuestion
          id="ask"
          questions={[databaseQuestion]}
          status="pending"
          onSubmit={() => {}}
          onDismiss={() => {}}
        />
      </UiProvider>,
    );
    await user.click(screen.getByRole('radio', { name: 'PostgreSQL Suggested' }));
    expect(screen.getByRole('group', { name: 'PostgreSQL, preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send answers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Something else' }));
    expect(await screen.findByRole('textbox', { name: 'Your words' })).toBeInTheDocument();
  });
});
