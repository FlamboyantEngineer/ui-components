import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { installEditorDom } from '../../../../test/rich-text-fixtures.js';
import { MoreGlyph } from '../../../core/glyphs.js';
import type { MessageComposerMessage } from '../composer-message.js';
import {
  type MessageComposerHandle,
  type MessageComposerSuggestion,
  type MessageComposerTrigger,
  RichMessageComposer,
  type RichMessageComposerProps,
} from './rich-message-composer.js';

installEditorDom();

const box = () => screen.getByRole('textbox', { name: 'Message' });
const emptyNotice = () => document.querySelector('.ui-completion-list__empty');
const TOOLS: MessageComposerSuggestion[] = [
  { id: 'tool-sum', label: 'Summarize', text: '$summarize', description: 'Shorten a text' },
  { id: 'tool-tr', label: 'Translate', text: '$translate' },
];
const tools: MessageComposerTrigger = {
  id: 'tools',
  character: '$',
  label: 'Tools',
  getCompletions: (query) =>
    TOOLS.filter((tool) => tool.label.toLowerCase().startsWith(query.toLowerCase())),
  getIcon: () => MoreGlyph,
};

function renderComposer(props: Partial<RichMessageComposerProps> = {}) {
  const user = userEvent.setup();
  const handle = createRef<MessageComposerHandle>();
  const onChange = vi.fn<(message: MessageComposerMessage) => void>();
  const view = render(
    <RichMessageComposer
      handleRef={handle}
      onChange={onChange}
      mentions={[{ id: 'ana', label: 'Ana Lopez' }]}
      triggers={[tools]}
      {...props}
    />,
  );
  return { ...view, user, handle, onChange };
}

/** A source whose answers the test settles by hand, in any order. */
function deferredSource() {
  const calls: {
    query: string;
    signal: AbortSignal;
    resolve: (entries: MessageComposerSuggestion[]) => void;
    reject: (error: Error) => void;
  }[] = [];
  const trigger: MessageComposerTrigger = {
    id: 'files',
    character: '#',
    getCompletions: (query, { signal }) =>
      new Promise((resolve, reject) => calls.push({ query, signal, resolve, reject })),
  };
  return { trigger, calls };
}

describe('RichMessageComposer custom triggers', () => {
  it('UIC-MESSAGE-COMPOSER-4.13 inserts a host entry as a token with its raw text, label and trigger identity', async () => {
    const { user, handle } = renderComposer();
    await user.click(box());
    await user.keyboard('Run $su');
    const list = await screen.findByRole('listbox', { name: 'Tools' });
    const option = within(list).getByRole('option', { name: 'Summarize Shorten a text' });
    expect(option.querySelector('.ui-completion-list__icon')).toBeNull();
    expect(box()).toHaveAttribute('aria-activedescendant', option.id);
    await user.keyboard('{Enter}');
    expect(handle.current?.getDraft()).toEqual({
      text: 'Run $summarize ',
      tokens: [
        {
          kind: 'trigger',
          trigger: 'tools',
          id: 'tool-sum',
          label: 'Summarize',
          start: 4,
          end: 14,
        },
      ],
    });
    const pill = box().querySelector('.ui-message-composer__pill');
    expect(pill).toHaveAttribute('data-kind', 'trigger');
    expect(pill).toHaveAttribute('data-trigger', 'tools');
    expect(pill).toHaveTextContent(/^Summarize$/);
    expect(pill?.querySelector('.ui-message-composer__pill-icon')).not.toBeNull();
    // Mentions keep working beside the host's vocabulary.
    await user.keyboard('@an');
    await screen.findByRole('listbox', { name: 'Suggestions' });
    await user.keyboard('{Enter}');
    expect(handle.current?.getDraft().tokens.map((token) => token.kind)).toEqual([
      'trigger',
      'mention',
    ]);
  });

  it('UIC-MESSAGE-COMPOSER-4.13 reads a host token back from a stored message with its raw text', () => {
    const { handle } = renderComposer({
      defaultValue: {
        text: 'Go $summarize now',
        tokens: [
          {
            kind: 'trigger',
            trigger: 'tools',
            id: 'tool-sum',
            label: 'Summarize',
            start: 3,
            end: 13,
          },
        ],
      },
    });
    expect(box().querySelector('.ui-message-composer__pill')).toHaveTextContent('Summarize');
    expect(handle.current?.getDraft().text).toBe('Go $summarize now');
  });

  it('UIC-MESSAGE-COMPOSER-4.13 shows loading only for the current query and ignores answers that came out of order', async () => {
    const { trigger, calls } = deferredSource();
    const { user, handle } = renderComposer({ triggers: [trigger] });
    await user.click(box());
    await user.keyboard('#a');
    await waitFor(() => expect(emptyNotice()).toHaveTextContent('Loading'));
    await user.keyboard('b');
    expect(calls.map((call) => call.query)).toEqual(['', 'a', 'ab']);
    expect(calls[1]?.signal.aborted).toBe(true);
    await act(async () => {
      calls[2]?.resolve([{ id: 'f2', label: 'abacus.txt' }]);
      await Promise.resolve();
    });
    // The older answer arrives last and is dropped.
    await act(async () => {
      calls[1]?.resolve([{ id: 'f1', label: 'apple.txt' }]);
      await Promise.resolve();
    });
    const list = await screen.findByRole('listbox');
    expect(
      within(list)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['abacus.txt']);
    await user.keyboard('{Tab}');
    expect(handle.current?.getDraft().tokens[0]).toMatchObject({ kind: 'trigger', id: 'f2' });
  });

  it('UIC-MESSAGE-COMPOSER-4.13 shows a failure for a rejected or throwing source and no results for an empty answer, without sending on Enter', async () => {
    const onSubmit = vi.fn();
    const { trigger, calls } = deferredSource();
    const throwing: MessageComposerTrigger = {
      id: 'broken',
      character: '%',
      getCompletions: () => {
        throw new Error('no');
      },
    };
    const { user } = renderComposer({ triggers: [trigger, throwing], onSubmit });
    await user.click(box());
    await user.keyboard('#x');
    await act(async () => {
      calls.at(-1)?.reject(new Error('offline'));
      await Promise.resolve();
    });
    await waitFor(() =>
      expect(emptyNotice()).toHaveTextContent('The action could not be completed.'),
    );
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('y');
    await act(async () => {
      calls.at(-1)?.resolve([]);
      await Promise.resolve();
    });
    await waitFor(() => expect(emptyNotice()).toHaveTextContent('No results'));
    await user.keyboard(' %q');
    await waitFor(() =>
      expect(emptyNotice()).toHaveTextContent('The action could not be completed.'),
    );
  });

  it('UIC-MESSAGE-COMPOSER-4.13 asks again once the source is replaced, and aborts on unmount', async () => {
    const { trigger, calls } = deferredSource();
    const { user, rerender, unmount, handle } = renderComposer({ triggers: [trigger] });
    await user.click(box());
    await user.keyboard('#q');
    const before = calls.length;
    const replaced = { ...trigger, getCompletions: trigger.getCompletions };
    rerender(<RichMessageComposer handleRef={handle} triggers={[replaced]} />);
    expect(calls.length).toBe(before + 1);
    expect(calls[before - 1]?.signal.aborted).toBe(true);
    unmount();
    expect(calls.at(-1)?.signal.aborted).toBe(true);
    // A late answer after unmount changes nothing and throws nothing.
    calls.at(-1)?.resolve([{ id: 'late', label: 'late.txt' }]);
  });

  it('UIC-MESSAGE-COMPOSER-4.13 aborts the question on Escape or blur, asks again on reopening and drops the dismissed answer', async () => {
    const { trigger, calls } = deferredSource();
    const { user, handle } = renderComposer({ triggers: [trigger] });
    render(<button type="button">Outside</button>);
    await user.click(box());
    await user.keyboard('#a');
    await waitFor(() => expect(emptyNotice()).toHaveTextContent('Loading'));
    const dismissed = calls.at(-1);
    await user.keyboard('{Escape}');
    expect(dismissed?.signal.aborted).toBe(true);
    expect(emptyNotice()).toBeNull();
    // Tab shows the list again without changing the text: a fresh question, and the dismissed
    // question's late answer never becomes its answer.
    const asked = calls.length;
    await user.keyboard('{Tab}');
    expect(calls.length).toBe(asked + 1);
    expect(calls.at(-1)?.query).toBe('a');
    await act(async () => {
      dismissed?.resolve([{ id: 'stale', label: 'stale.txt' }]);
      await Promise.resolve();
    });
    await waitFor(() => expect(emptyNotice()).toHaveTextContent('Loading'));
    expect(screen.queryByRole('option', { name: 'stale.txt' })).not.toBeInTheDocument();
    // An edit after Escape asks again too.
    await user.keyboard('{Escape}');
    const beforeEdit = calls.length;
    await user.keyboard('p');
    expect(calls.length).toBe(beforeEdit + 1);
    expect(calls.at(-1)?.query).toBe('ap');
    // Focus leaving aborts the question; its rejection shows nothing on return.
    const blurred = calls.at(-1);
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(blurred?.signal.aborted).toBe(true);
    await act(async () => {
      blurred?.reject(new Error('late'));
      await Promise.resolve();
    });
    const beforeFocus = calls.length;
    act(() => handle.current?.focus());
    expect(calls.length).toBe(beforeFocus + 1);
    expect(calls.at(-1)?.signal.aborted).toBe(false);
    await act(async () => {
      calls.at(-1)?.resolve([{ id: 'apple', label: 'apple.txt' }]);
      await Promise.resolve();
    });
    // Pressing an option keeps the request and inserts the entry.
    await user.click(await screen.findByRole('option', { name: 'apple.txt' }));
    expect(box().querySelector('.ui-message-composer__pill')).toHaveTextContent('apple.txt');
  });
});
