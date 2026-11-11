import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../../test/hooks.js';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import { CommentComposer, type CommentComposerProps } from '../comment-composer.js';
import type { CommentMentionOptions, MentionCandidate } from '../comment-mentions.js';
import { createCommentMentions } from './create-comment-mentions.js';

installEditorDom();

const PEOPLE: MentionCandidate[] = [
  { id: 'ana', name: 'Ana Lopez', description: 'Pastry' },
  { id: 'jon', name: 'Jon Berg', avatar: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' },
  { id: 'lena', name: 'Lena Ortiz' },
];

/** Finds the people whose name starts with the query, at once. */
function searchPeople(query: string) {
  const lower = query.toLowerCase();
  return Promise.resolve(PEOPLE.filter((person) => person.name.toLowerCase().startsWith(lower)));
}

function renderComposer(
  props: Partial<CommentComposerProps> = {},
  options: Partial<CommentMentionOptions> = {},
) {
  const user = userEvent.setup();
  const onSubmit = vi.fn<(text: string) => void>();
  const search = vi.fn(options.search ?? searchPeople);
  const mentions = createCommentMentions({ ...options, search });
  const view = render(<CommentComposer onSubmit={onSubmit} mentions={mentions} {...props} />);
  const box = screen.getByRole('textbox', { name: 'Add a comment' });
  return { ...view, user, onSubmit, search, box };
}

describe('CommentComposer mentions', () => {
  it('UIC-COMMENT-COMPOSER-2.1 opens a suggestion list on @ that filters as the reader types', async () => {
    const { container, user, box, search } = renderComposer();
    expect(box).toHaveAttribute('aria-haspopup', 'listbox');
    expect(box).toHaveAttribute('aria-autocomplete', 'list');
    expect(box.closest('.ui-comment-composer__field')).toHaveClass('ui-message-composer');
    await user.click(box);
    await user.keyboard('Ask @');
    const list = await screen.findByRole('listbox', { name: 'Suggestions' });
    expect(box).toHaveAttribute('aria-controls', list.id);
    expect(within(list).getAllByRole('option')).toHaveLength(3);
    expect(within(list).getAllByRole('option')[0]).toHaveAccessibleName('Ana Lopez Pastry');
    await user.keyboard('l');
    await waitFor(() => expect(within(list).getAllByRole('option')).toHaveLength(1));
    expect(search).toHaveBeenLastCalledWith('l', expect.any(AbortSignal));
    expect(box).toHaveAttribute(
      'aria-activedescendant',
      within(list).getByRole('option', { name: 'Lena Ortiz' }).id,
    );
    expectHooksMatchSpec(container, 'COMMENT-COMPOSER', { slots: ['field', 'actions', 'submit'] });
  });

  it('UIC-COMMENT-COMPOSER-2.1 aborts a search the reader has typed past and shows a failure', async () => {
    const signals: AbortSignal[] = [];
    const { user, box } = renderComposer(
      {},
      {
        search: (query, signal) => {
          signals.push(signal);
          return query === 'x' ? Promise.reject(new Error('offline')) : new Promise(() => {});
        },
      },
    );
    await user.click(box);
    await user.keyboard('@');
    const notice = () => document.querySelector('.ui-completion-list__empty');
    await waitFor(() => expect(notice()).toHaveTextContent('Loading'));
    await user.keyboard('x');
    expect(signals[0]?.aborted).toBe(true);
    await waitFor(() => expect(notice()).toHaveTextContent('The action could not be completed.'));
  });

  it('UIC-COMMENT-COMPOSER-2.2 inserts the chosen person as a chip, then submits its token', async () => {
    const { user, box, onSubmit } = renderComposer();
    await user.click(box);
    await user.keyboard('Ask @');
    await screen.findByRole('option', { name: 'Ana Lopez Pastry' });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const chip = box.querySelector('.ui-message-composer__pill');
    expect(chip).toHaveTextContent('Jon Berg');
    expect(chip).toHaveAttribute('contenteditable', 'false');
    expect(chip).toHaveAttribute('data-kind', 'trigger');
    await user.keyboard('and @le');
    await screen.findByRole('option', { name: 'Lena Ortiz' });
    await user.keyboard('{Enter}{Enter}today');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('Ask @[Jon Berg](jon) and @[Lena Ortiz](lena) \ntoday');
  });

  it('UIC-COMMENT-COMPOSER-2.4 suggests groups with their size and writes each kind', async () => {
    const candidates: MentionCandidate[] = [
      { kind: 'group', id: 'bakers', name: 'Bakers', description: 'Team', count: 4 },
      { kind: 'assistant', id: 'helper', name: 'Helper' },
    ];
    const { user, box, onSubmit } = renderComposer(
      {},
      { search: () => Promise.resolve(candidates) },
    );
    await user.click(box);
    await user.keyboard('@');
    await screen.findByRole('option', { name: 'Bakers Team · 4 members' });
    await user.keyboard('{Enter}and @');
    await screen.findByRole('option', { name: 'Helper' });
    await user.keyboard('{ArrowDown}{Enter}{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('@group[Bakers](bakers) and @assistant[Helper](helper)');
  });

  it('UIC-COMMENT-COMPOSER-2.2 deletes a chip whole with one Backspace and announces it', async () => {
    const { user, box, onSubmit } = renderComposer({ defaultValue: 'Hi @[Ana Lopez](ana)' });
    // Focus from the keyboard keeps the caret where the editor put it: after the chip.
    await user.tab();
    await user.keyboard('{Backspace}');
    expect(box.querySelector('.ui-message-composer__pill')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Ana Lopez removed');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('Hi');
  });

  it('UIC-COMMENT-COMPOSER-2.2 closes the list on Escape without cancelling the draft', async () => {
    const onCancel = vi.fn();
    const { user, box } = renderComposer({ onCancel });
    await user.click(box);
    await user.keyboard('Hi @');
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
    expect(box).toHaveTextContent('Hi @');
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('UIC-COMMENT-COMPOSER-2.3 starts from stored text with its mentions as chips', async () => {
    const { user, box, onSubmit } = renderComposer({
      defaultValue: 'Thanks @[Ana Lopez](ana)!',
    });
    expect(box.querySelector('.ui-message-composer__pill')).toHaveTextContent('Ana Lopez');
    await user.click(screen.getByRole('button', { name: 'Comment' }));
    expect(onSubmit).toHaveBeenCalledWith('Thanks @[Ana Lopez](ana)!');
  });

  it('UIC-COMMENT-COMPOSER-2.3 writes mentions in the host format with serialize and parse', async () => {
    const onChange = vi.fn();
    const { user, box } = renderComposer(
      { defaultValue: 'Hi <@ana>', onChange },
      {
        serialize: (candidate) => `<@${candidate.id}>`,
        parse: (text) =>
          text.split(/(<@[a-z]+>)/).map((part) => {
            const person = PEOPLE.find((candidate) => `<@${candidate.id}>` === part);
            return person
              ? { kind: 'mention' as const, text: part, id: person.id, name: person.name }
              : { kind: 'text' as const, text: part };
          }),
      },
    );
    expect(box.querySelector('.ui-message-composer__pill')).toHaveTextContent('Ana Lopez');
    await user.tab();
    await user.keyboard(' and @jo');
    await screen.findByRole('option', { name: 'Jon Berg' });
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('Hi <@ana> and <@jon> ');
  });

  it('UIC-COMMENT-COMPOSER-2.3 refuses typing and suggestions while disabled', () => {
    const { box, search } = renderComposer({ isDisabled: true, defaultValue: 'Hi' });
    expect(box).toHaveAttribute('aria-disabled', 'true');
    expect(box).toHaveAttribute('contenteditable', 'false');
    expect(search).not.toHaveBeenCalled();
  });

  it('UIC-COMMENT-COMPOSER-2.3 focuses the text box on mount with autoFocus', async () => {
    const { box } = renderComposer({ autoFocus: true });
    await waitFor(() => expect(box).toHaveFocus());
  });
});
