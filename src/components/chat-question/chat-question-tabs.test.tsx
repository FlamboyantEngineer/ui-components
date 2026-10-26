import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  databaseQuestion,
  featuresQuestion,
  nameQuestion,
} from '../../../test/chat-question-fixtures.js';
import { ChatParts } from '../chat-parts/chat-parts.js';
import { ChatQuestion } from './chat-question.js';

const three = [databaseQuestion, featuresQuestion, nameQuestion];
const tab = (name: string) => screen.getByRole('tab', { name });

describe('ChatQuestion tabs', () => {
  it('UIC-CHAT-QUESTION-3.1 UIC-CHAT-QUESTION-3.2 shows one tab and 1/1 for a single question', () => {
    const { container } = render(
      <ChatQuestion id="ask" questions={[databaseQuestion]} status="pending" onSubmit={vi.fn()} />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(tab('Database')).toHaveAttribute('aria-selected', 'true');
    const counter = container.querySelector('.ui-chat-question__progress') as HTMLElement;
    expect(within(counter).getByText('1/1')).toHaveAttribute('aria-hidden', 'true');
    expect(within(counter).getByText('Question 1 of 1')).toBeInTheDocument();
  });

  it('UIC-CHAT-QUESTION-3.3 shows any question from its tab, unanswered or not, and keeps focus on the tab', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={onSubmit} />);
    await user.click(tab('Question 3'));
    expect(tab('Question 3')).toHaveFocus();
    expect(tab('Question 3')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: nameQuestion.question }), 'Notebook');
    await user.click(tab('Database'));
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    await user.click(tab('Features'));
    await user.click(screen.getByRole('checkbox', { name: 'Search' }));
    await user.click(tab('Question 3'));
    expect(screen.getByRole('textbox', { name: nameQuestion.question })).toHaveValue('Notebook');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: 'database', optionIds: ['sqlite'] },
      { questionId: 'features', optionIds: ['search'] },
      { questionId: 'name', optionIds: [], otherText: 'Notebook' },
    ]);
  });

  it('UIC-CHAT-QUESTION-3.1 UIC-CHAT-QUESTION-3.3 moves between questions with the arrow keys from one tab stop', async () => {
    const user = userEvent.setup();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={vi.fn()} />);
    await user.tab();
    expect(tab('Database')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Features')).toHaveFocus();
    expect(tab('Features')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('checkbox', { name: 'Search' })).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(tab('Question 3')).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(tab('Database')).toHaveAttribute('aria-selected', 'true');
    await user.tab();
    expect(screen.getByRole('radio', { name: /^PostgreSQL/ })).toHaveFocus();
  });

  it('UIC-CHAT-QUESTION-3.3 keeps the tabs usable on a read-only card and while the answers are sent', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatQuestion id="ask" questions={three} status="pending" />);
    await user.click(tab('Question 3'));
    expect(screen.getByRole('textbox', { name: nameQuestion.question })).toHaveAttribute(
      'readonly',
    );
    const pending = new Promise<void>(() => undefined);
    rerender(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={() => pending} />);
    await user.click(tab('Database'));
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    await user.click(tab('Features'));
    await user.click(screen.getByRole('checkbox', { name: 'Search' }));
    await user.click(tab('Question 3'));
    await user.type(screen.getByRole('textbox', { name: nameQuestion.question }), 'Notebook');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('group', { name: /^3 questions/ })).toHaveAttribute(
      'data-submitting',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    await user.click(tab('Database'));
    expect(tab('Database')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('radio', { name: 'SQLite' })).toBeChecked();
  });

  it('UIC-CHAT-QUESTION-3.5 selects the tab of the question Back and Next show, which controls the shown panel', async () => {
    const user = userEvent.setup();
    render(<ChatQuestion id="ask" questions={three} status="pending" />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(tab('Features')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Features')).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(tab('Database')).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
  });

  it('UIC-CHAT-QUESTION-3.4 marks an answered tab with a check and an Answered description by default', async () => {
    const user = userEvent.setup();
    render(<ChatQuestion id="ask" questions={three} status="pending" onSubmit={vi.fn()} />);
    expect(screen.getByRole('group', { name: /^3 questions/ })).toHaveAttribute(
      'data-answered-mark',
      'icon',
    );
    expect(tab('Database').querySelector('.ui-tabs__icon')).toBeNull();
    expect(tab('Database')).not.toHaveAccessibleDescription();
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    expect(tab('Database')).toHaveAttribute('data-answered', 'true');
    expect(tab('Database').querySelector('.ui-tabs__icon [data-glyph="check"]')).not.toBeNull();
    expect(tab('Database')).toHaveAccessibleDescription('Answered');
    expect(tab('Features')).not.toHaveAttribute('data-answered');
  });

  it('UIC-CHAT-QUESTION-3.4 leaves an answered tab to the stylesheet with the style mark', async () => {
    const user = userEvent.setup();
    render(
      <ChatQuestion
        id="ask"
        questions={three}
        status="pending"
        onSubmit={vi.fn()}
        answeredMark="style"
      />,
    );
    expect(screen.getByRole('group', { name: /^3 questions/ })).toHaveAttribute(
      'data-answered-mark',
      'style',
    );
    await user.click(screen.getByRole('radio', { name: 'SQLite' }));
    expect(tab('Database')).toHaveAttribute('data-answered', 'true');
    expect(tab('Database').querySelector('.ui-tabs__icon')).toBeNull();
    expect(tab('Database')).toHaveAccessibleDescription('Answered');
  });

  it('UIC-CHAT-QUESTION-3.4 takes the mark for question parts from ChatParts', () => {
    render(
      <ChatParts
        parts={[{ type: 'question', id: 'q1', questions: three, status: 'pending' }]}
        questionAnsweredMark="style"
      />,
    );
    expect(screen.getByRole('group', { name: /^3 questions/ })).toHaveAttribute(
      'data-answered-mark',
      'style',
    );
  });
});
