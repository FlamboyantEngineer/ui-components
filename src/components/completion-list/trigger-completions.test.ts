import { describe, expect, it, vi } from 'vitest';
import { type Completion, createTriggerCompletions } from './completion-list.js';

const people: Completion[] = [{ label: 'Maria Santos', insertText: '@Maria Santos ' }];
const references: Completion[] = [{ label: 'Requirement 12' }];

const context = (value: string, caret = value.length) => ({
  value,
  caret,
  query: '',
  isExplicit: false,
});

describe('createTriggerCompletions', () => {
  it('UIC-COMPLETION-LIST-2.5 asks the trigger for the query after it and replaces both', () => {
    const findPeople = vi.fn(() => people);
    const findReferences = vi.fn(() => references);
    const source = createTriggerCompletions([
      { character: '@', getCompletions: findPeople },
      { character: '#', getCompletions: findReferences },
    ]);
    expect(source(context('Ask @ma'))).toEqual({ options: people, from: 4, filter: false });
    expect(findPeople).toHaveBeenLastCalledWith('ma');
    expect(source(context('@'))).toEqual({ options: people, from: 0, filter: false });
    expect(findPeople).toHaveBeenLastCalledWith('');
    expect(source(context('See #1 and @jo', 6))).toEqual({
      options: references,
      from: 4,
      filter: false,
    });
    expect(findReferences).toHaveBeenLastCalledWith('1');
  });

  it('UIC-COMPLETION-LIST-2.5 answers nothing inside a word, after a space or on another line', () => {
    const findPeople = vi.fn(() => people);
    const source = createTriggerCompletions([{ character: '@', getCompletions: findPeople }]);
    expect(source(context('alice@example'))).toEqual([]);
    expect(source(context('@maria santos'))).toEqual([]);
    expect(source(context('@maria\nnext'))).toEqual([]);
    expect(source(context('no trigger'))).toEqual([]);
    expect(findPeople).not.toHaveBeenCalled();
  });

  it('UIC-COMPLETION-LIST-2.5 lets a trigger take spaces and answer later', async () => {
    const source = createTriggerCompletions([
      { character: '@', allowsSpaces: true, getCompletions: async () => people },
    ]);
    await expect(source(context('Ask @Maria Sa'))).resolves.toEqual({
      options: people,
      from: 4,
      filter: false,
    });
    expect(source(context('Ask @ Maria'))).toEqual([]);
    expect(source(context('@a\n@b c', 7))).toBeInstanceOf(Promise);
    expect(source(context('a\nb c'))).toEqual([]);
  });

  it('UIC-COMPLETION-LIST-2.5 stops asking once a spaced query holds more words than the trigger allows', () => {
    const getCompletions = vi.fn(() => people);
    const source = createTriggerCompletions([
      { character: '@', allowsSpaces: true, getCompletions },
    ]);
    expect(source(context('@Maria Sa Lo'))).toEqual(expect.objectContaining({ from: 0 }));
    expect(getCompletions).toHaveBeenLastCalledWith('Maria Sa Lo');
    getCompletions.mockClear();
    expect(source(context('@Maria Sa Lo '))).toEqual([]);
    expect(source(context('@Maria Sa Lo and the rest of the line'))).toEqual([]);
    expect(getCompletions).not.toHaveBeenCalled();
    const longer = createTriggerCompletions([
      { character: '@', allowsSpaces: true, maxWords: 5, getCompletions },
    ]);
    expect(longer(context('@Maria Sa Lo de Ruiz'))).toEqual(expect.objectContaining({ from: 0 }));
  });
});
