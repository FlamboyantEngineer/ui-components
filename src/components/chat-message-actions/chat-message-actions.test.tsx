import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import {
  ChatMessageActions,
  type ChatFeedback,
  type ChatMessageActionsProps,
} from './chat-message-actions.js';

type EmojiList = Awaited<ReturnType<NonNullable<ChatMessageActionsProps['loadEmoji']>>>;

const emojiList: EmojiList = [
  {
    unicode: '🎉',
    hexcode: '1F389',
    label: 'party popper',
    category: 'smileys',
    shortcodes: ['tada'],
    keywords: [],
  },
];
const loadEmoji = () => Promise.resolve(emojiList);
const otter = { shortcode: 'otter', src: '/otter.png', label: 'Happy otter' };

const reasons = ['Accurate', 'Too long', 'Off topic'];

afterEach(() => {
  vi.useRealTimers();
});

function buttonNames() {
  return within(screen.getByRole('toolbar'))
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'));
}

describe('ChatMessageActions', () => {
  it('UIC-CHAT-MESSAGE-ACTIONS-1.1 UIC-CHAT-MESSAGE-ACTIONS-1.4 draws a named toolbar of the commands whose callbacks are given', () => {
    const { container, rerender } = render(
      <ChatMessageActions
        copyText="Lisbon in May"
        onFeedback={() => {}}
        onReply={() => {}}
        onReact={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        className="host"
        id="actions"
        data-origin-host="list"
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Message actions' });
    expect(toolbar).toHaveClass('ui-chat-message-actions', 'host');
    expect(toolbar).toHaveAttribute('id', 'actions');
    expect(toolbar).toHaveAttribute('data-origin-host', 'list');
    expect(buttonNames()).toEqual([
      'Copy',
      'Good response',
      'Bad response',
      'Reply',
      'Add reaction',
      'Edit',
      'Delete',
    ]);
    expectHooksMatchSpec(container, 'CHAT-MESSAGE-ACTIONS', {
      slots: ['copy', 'status', 'rating', 'reply', 'react', 'edit', 'delete'],
      callerAttributes: ['data-origin-host'],
    });
    rerender(<ChatMessageActions onReply={() => {}} aria-label="Actions for Ana's message" />);
    expect(screen.getByRole('toolbar', { name: "Actions for Ana's message" })).toBeVisible();
    expect(buttonNames()).toEqual(['Reply']);
    rerender(<ChatMessageActions />);
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-1.2 moves focus between the commands with the arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ChatMessageActions copyText="Text" onReply={() => {}} onEdit={() => {}} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveFocus();
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-1.3 copies the text and shows and announces the outcome', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onCopy = vi.fn();
    render(<ChatMessageActions copyText="  Lisbon in May " onCopy={onCopy} />);
    const toolbar = screen.getByRole('toolbar');
    const copy = screen.getByRole('button', { name: 'Copy' });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.click(copy);
    expect(await navigator.clipboard.readText()).toBe('  Lisbon in May ');
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(toolbar).toHaveAttribute('data-copied', 'true');
    expect(copy.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'check');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(toolbar).not.toHaveAttribute('data-copied');
    expect(copy.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'copy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-1.3 announces only the latest of two quick copies', async () => {
    const user = userEvent.setup();
    let settleFirst!: () => void;
    vi.spyOn(navigator.clipboard, 'writeText')
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            settleFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(undefined);
    render(<ChatMessageActions copyText="Lisbon in May" />);
    const copy = screen.getByRole('button', { name: 'Copy' });
    await user.click(copy);
    await user.click(copy);
    const status = screen.getByRole('status');
    await waitFor(() => expect(status).toHaveTextContent('Copied'));
    const announced = status.textContent ?? '';
    await act(async () => settleFirst());
    // The superseded copy leaves the live region as the latest copy set it.
    expect(status).toHaveTextContent(new RegExp(`^${announced}$`));
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-1.3 shows and announces a refused copy', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    const onCopy = vi.fn();
    render(<ChatMessageActions copyText="Secret" onCopy={onCopy} />);
    const copy = screen.getByRole('button', { name: 'Copy' });
    await user.click(copy);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Copy failed'));
    expect(onCopy).not.toHaveBeenCalled();
    expect(copy.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'error');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-2.1 UIC-CHAT-MESSAGE-ACTIONS-2.2 UIC-CHAT-MESSAGE-ACTIONS-2.4 reports a rating at once without reasons and clears it on a second press', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn<(feedback: ChatFeedback) => void>();
    render(<ChatMessageActions onFeedback={onFeedback} />);
    const up = screen.getByRole('button', { name: 'Good response' });
    const down = screen.getByRole('button', { name: 'Bad response' });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(up).toHaveAttribute('data-rating', 'up');
    expect(down).toHaveAttribute('data-rating', 'down');
    expect(up).not.toHaveAttribute('aria-haspopup');
    await user.click(up);
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'up', reasons: [] });
    expect(up).toHaveAttribute('aria-pressed', 'true');
    await user.click(down);
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'down', reasons: [] });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    expect(down).toHaveAttribute('aria-pressed', 'true');
    await user.click(down);
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: null, reasons: [] });
    expect(down).toHaveAttribute('aria-pressed', 'false');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-2.1 shows the rating the host controls', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    const { rerender } = render(<ChatMessageActions feedback="down" onFeedback={onFeedback} />);
    const up = screen.getByRole('button', { name: 'Good response' });
    const down = screen.getByRole('button', { name: 'Bad response' });
    expect(down).toHaveAttribute('aria-pressed', 'true');
    await user.click(up);
    expect(onFeedback).toHaveBeenCalledWith({ rating: 'up', reasons: [] });
    expect(down).toHaveAttribute('aria-pressed', 'true');
    rerender(<ChatMessageActions feedback={null} onFeedback={onFeedback} />);
    expect(down).toHaveAttribute('aria-pressed', 'false');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-2.3 asks for reasons and a comment after a rating and submits them', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn<(feedback: ChatFeedback) => void>();
    render(<ChatMessageActions onFeedback={onFeedback} feedbackReasons={reasons} />);
    const toolbar = screen.getByRole('toolbar');
    const down = screen.getByRole('button', { name: 'Bad response' });
    expect(down).toHaveAttribute('aria-haspopup', 'dialog');
    expect(down).toHaveAttribute('aria-expanded', 'false');
    await user.click(down);
    const dialog = await screen.findByRole('dialog', { name: 'What went wrong?' });
    expect(down).toHaveAttribute('aria-pressed', 'true');
    expect(down).toHaveAttribute('aria-expanded', 'true');
    expect(toolbar).toHaveAttribute('data-open', 'true');
    expect(onFeedback).not.toHaveBeenCalled();
    const chips = within(within(dialog).getByRole('group', { name: 'Reasons' })).getAllByRole(
      'button',
    );
    expect(chips.map((chip) => chip.textContent)).toEqual(reasons);
    await user.click(within(dialog).getByRole('button', { name: 'Off topic' }));
    await user.click(within(dialog).getByRole('button', { name: 'Too long' }));
    await user.click(within(dialog).getByRole('button', { name: 'Off topic' }));
    await user.click(within(dialog).getByRole('button', { name: 'Accurate' }));
    expect(within(dialog).getByRole('button', { name: 'Accurate' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Comment (optional)' }),
      ' Cut it ',
    );
    expectHooksMatchSpec(document.body, 'CHAT-MESSAGE-ACTIONS', {
      slots: ['feedback', 'reasons', 'reason', 'comment', 'feedback-actions'],
    });
    await user.click(within(dialog).getByRole('button', { name: 'Submit' }));
    expect(onFeedback).toHaveBeenCalledTimes(1);
    expect(onFeedback).toHaveBeenCalledWith({
      rating: 'down',
      reasons: ['Accurate', 'Too long'],
      comment: 'Cut it',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toolbar).not.toHaveAttribute('data-open');
    await waitFor(() => expect(down).toHaveFocus());
    expect(down).toHaveAttribute('aria-pressed', 'true');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-2.3 keeps the rating without details on Skip or Escape', async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    render(<ChatMessageActions onFeedback={onFeedback} feedbackReasons={[]} />);
    const up = screen.getByRole('button', { name: 'Good response' });
    await user.click(up);
    const dialog = await screen.findByRole('dialog', { name: 'What went well?' });
    expect(within(dialog).queryByRole('group')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Skip' }));
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'up', reasons: [] });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(up).toHaveFocus());
    const down = screen.getByRole('button', { name: 'Bad response' });
    await user.click(down);
    await screen.findByRole('dialog', { name: 'What went wrong?' });
    await user.keyboard('{Escape}');
    expect(onFeedback).toHaveBeenLastCalledWith({ rating: 'down', reasons: [] });
    expect(onFeedback).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(down).toHaveFocus());
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-3.1 runs Reply and Edit', async () => {
    const user = userEvent.setup();
    const onReply = vi.fn();
    const onEdit = vi.fn();
    render(<ChatMessageActions onReply={onReply} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: 'Reply' }));
    expect(onReply).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-3.2 UIC-CHAT-MESSAGE-ACTIONS-3.4 reacts with an emoji chosen in the picker', async () => {
    const user = userEvent.setup();
    const onReact = vi.fn();
    const onRecentEmojiChange = vi.fn();
    render(
      <ChatMessageActions
        onReact={onReact}
        loadEmoji={loadEmoji}
        customEmoji={[otter]}
        recentEmoji={['🎉']}
        onRecentEmojiChange={onRecentEmojiChange}
      />,
    );
    const toolbar = screen.getByRole('toolbar');
    const react = screen.getByRole('button', { name: 'Add reaction' });
    expect(react).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(react);
    const picker = await screen.findByRole('dialog', { name: 'Emoji picker' });
    expect(react).toHaveAttribute('aria-expanded', 'true');
    expect(toolbar).toHaveAttribute('data-open', 'true');
    expect(picker.closest('.ui-chat-message-actions__emoji-popover')).not.toBeNull();
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveFocus());
    await user.click(await screen.findByRole('row', { name: 'party popper' }));
    expect(onReact).toHaveBeenCalledWith('🎉');
    expect(onRecentEmojiChange).toHaveBeenCalledWith(['🎉']);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toolbar).not.toHaveAttribute('data-open');
    await waitFor(() => expect(react).toHaveFocus());
    await user.click(react);
    await user.type(await screen.findByRole('searchbox'), 'otter');
    await user.click(await screen.findByRole('row', { name: 'Happy otter' }));
    expect(onReact).toHaveBeenLastCalledWith(':otter:');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-3.3 deletes after the reader confirms', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<ChatMessageActions onDelete={onDelete} />);
    const toolbar = screen.getByRole('toolbar');
    const remove = screen.getByRole('button', { name: 'Delete' });
    await user.click(remove);
    let dialog = await screen.findByRole('alertdialog', { name: 'Delete message?' });
    expect(dialog).toHaveAccessibleDescription(
      'The message will be removed from the conversation.',
    );
    expect(toolbar).toHaveAttribute('data-open', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(remove).toHaveFocus());
    await user.click(remove);
    dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(toolbar).not.toHaveAttribute('data-open');
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-3.4 keeps keys and secondary clicks in its overlays from the message around it', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    const onContextMenu = vi.fn();
    render(
      <article onKeyDown={onKeyDown} onContextMenu={onContextMenu}>
        <ChatMessageActions onFeedback={() => {}} feedbackReasons={['Accurate']} />
      </article>,
    );
    await user.click(screen.getByRole('button', { name: 'Good response' }));
    const field = await screen.findByRole('textbox', { name: 'Comment (optional)' });
    await user.type(field, 'x');
    await user.pointer({ keys: '[MouseRight]', target: field });
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onContextMenu).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Good response' })).toHaveFocus(),
    );
    await user.keyboard('x');
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('UIC-CHAT-MESSAGE-ACTIONS-1.1 takes its strings from the provider', () => {
    render(
      <UiProvider messages={{ messageActions: 'Aktionen', goodResponse: 'Gut' }}>
        <ChatMessageActions onFeedback={() => {}} />
      </UiProvider>,
    );
    expect(screen.getByRole('toolbar', { name: 'Aktionen' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Gut' })).toBeVisible();
  });
});
