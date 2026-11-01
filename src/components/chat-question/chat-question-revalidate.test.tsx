import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatQuestion, type ChatQuestionItem } from './chat-question.js';
import { normalizeDraft, toAnswer, isQuestionAnswered } from './chat-question-model.js';

const red = { id: 'red', label: 'Red' };
const blue = { id: 'blue', label: 'Blue' };
const colour = (fields: Partial<ChatQuestionItem> = {}): ChatQuestionItem => ({
  id: 'q1',
  question: 'Which colour?',
  selectionMode: 'single',
  options: [red, blue],
  ...fields,
});

describe('ChatQuestion drafts against changed questions', () => {
  it('UIC-CHAT-QUESTION-2.1 does not submit a choice the question no longer offers', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const card = (item: ChatQuestionItem) => (
      <ChatQuestion id="ask" status="pending" questions={[item]} onSubmit={onSubmit} />
    );
    const { rerender } = render(card(colour()));
    await user.click(screen.getByRole('radio', { name: 'Red' }));
    rerender(card(colour({ options: [blue] })));
    expect(screen.getByRole('radio', { name: 'Blue' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: 'Blue' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith([{ questionId: 'q1', optionIds: ['blue'] }]);
  });

  it('UIC-CHAT-QUESTION-2.1 keeps choices that still fit and drops the rest', () => {
    const draft = { optionIds: ['blue', 'red', 'gone'], isOther: false, otherText: '' };
    const multiple = colour({ selectionMode: 'multiple' });
    expect(normalizeDraft(multiple, draft).optionIds).toEqual(['blue', 'red']);
    expect(toAnswer(multiple, draft)).toEqual({ questionId: 'q1', optionIds: ['red', 'blue'] });
    expect(normalizeDraft(colour(), draft).optionIds).toEqual(['blue']);
    const fitting = { optionIds: ['red'], isOther: false, otherText: '' };
    expect(normalizeDraft(colour(), fitting)).toBe(fitting);
  });

  it('UIC-CHAT-QUESTION-1.7 UIC-CHAT-QUESTION-2.1 drops Other once the question no longer allows it', () => {
    const other = { optionIds: [], isOther: true, otherText: 'Green' };
    expect(isQuestionAnswered(colour({ allowsOther: true }), other)).toBe(true);
    expect(isQuestionAnswered(colour(), other)).toBe(false);
    expect(toAnswer(colour(), other)).toEqual({ questionId: 'q1', optionIds: [] });
    const text = colour({ selectionMode: 'none' });
    expect(
      isQuestionAnswered(text, { optionIds: ['red'], isOther: false, otherText: 'Teal' }),
    ).toBe(true);
    expect(toAnswer(text, { optionIds: ['red'], isOther: false, otherText: 'Teal' })).toEqual({
      questionId: 'q1',
      optionIds: [],
      otherText: 'Teal',
    });
  });
});
