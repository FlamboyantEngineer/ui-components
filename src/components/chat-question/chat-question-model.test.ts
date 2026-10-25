import { describe, expect, it } from 'vitest';
import {
  databaseQuestion,
  featuresQuestion,
  nameQuestion,
} from '../../../test/chat-question-fixtures.js';
import {
  emptyDraft,
  findPreviewOption,
  isQuestionAnswered,
  listAnswerLabels,
  pickMultiple,
  pickSingle,
  readAnswerText,
  toAnswer,
} from './chat-question-model.js';

describe('chat question model', () => {
  it('UIC-CHAT-QUESTION-2.1 counts a question answered once it has an option or words for Other', () => {
    expect(isQuestionAnswered(databaseQuestion)).toBe(false);
    expect(isQuestionAnswered(databaseQuestion, { ...emptyDraft, optionIds: ['sqlite'] })).toBe(
      true,
    );
    expect(isQuestionAnswered(databaseQuestion, { ...emptyDraft, isOther: true })).toBe(false);
    expect(
      isQuestionAnswered(featuresQuestion, {
        optionIds: ['search'],
        isOther: true,
        otherText: ' ',
      }),
    ).toBe(false);
    expect(
      isQuestionAnswered(databaseQuestion, { ...emptyDraft, isOther: true, otherText: 'x' }),
    ).toBe(true);
    expect(isQuestionAnswered(nameQuestion, { ...emptyDraft, otherText: '\n ' })).toBe(false);
    expect(isQuestionAnswered(nameQuestion, { ...emptyDraft, otherText: 'Notebook' })).toBe(true);
  });

  it('UIC-CHAT-QUESTION-2.1 gives the options in offered order and trimmed words', () => {
    expect(toAnswer(featuresQuestion, { ...emptyDraft, optionIds: ['export', 'sign-in'] })).toEqual(
      { questionId: 'features', optionIds: ['sign-in', 'export'] },
    );
    expect(
      toAnswer(featuresQuestion, { optionIds: ['search'], isOther: true, otherText: ' Sync ' }),
    ).toEqual({ questionId: 'features', optionIds: ['search'], otherText: 'Sync' });
    expect(
      toAnswer(databaseQuestion, { optionIds: ['sqlite'], isOther: false, otherText: 'kept' }),
    ).toEqual({ questionId: 'database', optionIds: ['sqlite'] });
    expect(
      toAnswer(nameQuestion, { optionIds: ['stale'], isOther: false, otherText: ' N ' }),
    ).toEqual({ questionId: 'name', optionIds: [], otherText: 'N' });
    expect(toAnswer(nameQuestion)).toEqual({ questionId: 'name', optionIds: [], otherText: '' });
  });

  it('UIC-CHAT-QUESTION-1.7 swaps Other with an option in a radio group and adds it in a checkbox group', () => {
    const draft = { optionIds: ['sqlite'], isOther: false, otherText: 'kept' };
    const other = pickSingle(draft, 'other', 'other');
    expect(other).toEqual({ optionIds: [], isOther: true, otherText: 'kept' });
    expect(pickSingle(other, 'mysql', 'other')).toEqual({
      optionIds: ['mysql'],
      isOther: false,
      otherText: 'kept',
    });
    expect(pickMultiple(draft, ['sqlite', 'other', 'mysql'], 'other')).toEqual({
      optionIds: ['sqlite', 'mysql'],
      isOther: true,
      otherText: 'kept',
    });
  });

  it('UIC-CHAT-QUESTION-1.8 previews the focused option, else the first chosen one with a preview', () => {
    const [postgres, sqlite, mysql] = databaseQuestion.options;
    const chosen = { ...emptyDraft, optionIds: ['mysql', 'sqlite'] };
    expect(findPreviewOption(databaseQuestion, { draft: emptyDraft, focusedId: null })).toBe(
      undefined,
    );
    expect(findPreviewOption(databaseQuestion, { draft: chosen, focusedId: null })).toBe(sqlite);
    expect(findPreviewOption(databaseQuestion, { draft: chosen, focusedId: 'postgres' })).toBe(
      postgres,
    );
    expect(findPreviewOption(databaseQuestion, { draft: chosen, focusedId: mysql?.id ?? '' })).toBe(
      undefined,
    );
    expect(findPreviewOption(databaseQuestion, { draft: chosen, focusedId: 'other' })).toBe(
      undefined,
    );
  });

  it('UIC-CHAT-QUESTION-4.1 lists the labels of an answer and its words', () => {
    expect(
      listAnswerLabels(featuresQuestion, {
        questionId: 'features',
        optionIds: ['export', 'missing', 'search'],
        otherText: ' Sync ',
      }),
    ).toEqual(['Search', 'Export to CSV', 'Sync']);
    expect(listAnswerLabels(featuresQuestion, { questionId: 'features', optionIds: [] })).toEqual(
      [],
    );
    expect(readAnswerText({ questionId: 'name', optionIds: [], otherText: '  ' })).toBe(undefined);
    expect(readAnswerText(undefined)).toBe(undefined);
    expect(readAnswerText({ questionId: 'name', optionIds: [], otherText: ' N ' })).toBe('N');
  });
});
