import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatQuestion, type ChatQuestionItem } from './chat-question.js';

const syncQuestion: ChatQuestionItem = {
  id: 'sync',
  question: [
    'How should notes **sync** between _devices_?',
    '',
    'Keep in mind:',
    '',
    '- Notes reach `5 MB`',
    '- Readers use [two devices](https://example.com/devices)',
    '',
    '1. Save first',
    '2. Send later',
    '',
    'Raw <b>HTML</b> stays text.',
  ].join('\n'),
  selectionMode: 'single',
  options: [
    { id: 'merge', label: 'Merge edits', description: 'Combines edits **line by line**.' },
    { id: 'latest', label: 'Latest wins', description: 'Keeps one.\n\n- The newest save' },
  ],
};

const title = 'How should notes sync between devices?';

function renderCard(question: ChatQuestionItem, status: 'pending' | 'answered' | 'dismissed') {
  return render(
    <ChatQuestion
      id="ask"
      questions={[question]}
      status={status}
      answers={[{ questionId: question.id, optionIds: ['merge'] }]}
      onSubmit={() => {}}
    />,
  );
}

describe('ChatQuestion rich text', () => {
  it('UIC-CHAT-31.9 draws the opening paragraph as the title, named by its words', () => {
    const { container } = renderCard(syncQuestion, 'pending');
    expect(screen.getByRole('group', { name: `Question: ${title}` })).toBeInTheDocument();
    const choices = screen.getByRole('radiogroup', { name: title });
    expect(choices).toBeInTheDocument();
    const legend = container.querySelector('legend.ui-chat-question__question');
    expect(legend).toHaveTextContent(title);
    expect(within(legend as HTMLElement).getByText('sync').tagName).toBe('STRONG');
    expect(within(legend as HTMLElement).getByText('devices').tagName).toBe('EM');
    expectHooksMatchSpec(container, 'CHAT', {
      slots: [
        'ui-chat-question__item',
        'ui-chat-question__question',
        'ui-chat-question__body',
        'ui-chat-question__answer',
        'ui-chat-question__options',
        'ui-chat-question__option',
        'ui-chat-question__description',
        'ui-chat-question__actions',
        'ui-chat-question__submit',
        'ui-chat-question__announcement',
      ],
    });
  });

  it('UIC-CHAT-31.9 draws the blocks after the title as Markdown that describes the question', () => {
    const { container } = renderCard(syncQuestion, 'pending');
    const body = container.querySelector<HTMLElement>('.ui-chat-question__body');
    expect(body).not.toBeNull();
    const lists = within(body as HTMLElement).getAllByRole('list');
    expect(lists.map((list) => list.tagName)).toEqual(['UL', 'OL']);
    expect(within(lists[0] as HTMLElement).getAllByRole('listitem')).toHaveLength(2);
    expect(within(body as HTMLElement).getByRole('link', { name: /^two devices/ })).toHaveAttribute(
      'href',
      'https://example.com/devices',
    );
    expect(within(body as HTMLElement).getByText('5 MB').tagName).toBe('CODE');
    expect(body).toHaveTextContent('Raw <b>HTML</b> stays text.');
    expect(body?.querySelector('b')).toBeNull();
    const fieldset = body?.closest('fieldset');
    expect(fieldset).toHaveAccessibleDescription(expect.stringContaining('Keep in mind:'));
  });

  it('UIC-CHAT-31.9 draws option descriptions as Markdown', () => {
    renderCard(syncQuestion, 'pending');
    const merge = screen.getByRole('radio', { name: 'Merge edits' });
    expect(merge).toHaveAccessibleDescription('Combines edits line by line.');
    expect(screen.getByText('line by line').tagName).toBe('STRONG');
    const latest = screen.getByRole('radio', { name: 'Latest wins' });
    expect(latest).toHaveAccessibleDescription(expect.stringContaining('The newest save'));
    expect(screen.getByText('The newest save').closest('li')).not.toBeNull();
  });

  it('UIC-CHAT-31.9 names a free-text field by the words of the title', () => {
    renderCard(
      {
        id: 'name',
        question: 'What should the **sync** setting be called?\n\nFor example _Keep in sync_.',
        selectionMode: 'none',
        options: [],
      },
      'pending',
    );
    expect(
      screen.getByRole('textbox', { name: 'What should the sync setting be called?' }),
    ).toBeInTheDocument();
  });

  it('UIC-CHAT-31.9 makes a question that opens with a list all title', () => {
    const { container } = renderCard(
      { ...syncQuestion, question: '- Merge or **replace**?\n- Pick one' },
      'pending',
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Merge or replace? Pick one' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.ui-chat-question__body')).toBeNull();
  });

  it('UIC-CHAT-31.9 keeps the title in the answered summary and the dismissed card', () => {
    const { container, rerender } = renderCard(syncQuestion, 'answered');
    const term = container.querySelector('.ui-chat-question__summary-question');
    expect(term).toHaveTextContent(title);
    expect(term).not.toHaveTextContent('Keep in mind');
    expect(within(term as HTMLElement).getByText('sync').tagName).toBe('STRONG');
    rerender(<ChatQuestion id="ask" questions={[syncQuestion]} status="dismissed" />);
    const question = container.querySelector('.ui-chat-question__question');
    expect(question).toHaveTextContent(title);
    expect(question).not.toHaveTextContent('Keep in mind');
  });
});
