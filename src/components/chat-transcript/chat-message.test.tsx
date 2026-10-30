import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatMessage, type ChatMessageDelivery } from './chat-message.js';

const getNow = () => new Date('2026-04-20T10:30:00');
const maria = { name: 'Maria Santos', colorKey: 'maria' };
const time = '2026-04-20T10:25:00';

/** The accessible name of Maria's message at 10:25, whatever space the locale puts before AM. */
const mariaAt1025 = /^Maria Santos, Apr 20, 2026, 10:25\sAM$/;

function messageElement(container: HTMLElement): HTMLElement {
  const message = container.querySelector<HTMLElement>('.ui-chat-message');
  if (!message) throw new Error('no message rendered');
  return message;
}

describe('ChatMessage name, presence and grouping', () => {
  it('UIC-CHAT-TRANSCRIPT-2.4 is named by its author and absolute time and carries its id', () => {
    const { container } = render(
      <ChatMessage id="m1" author={maria} time={time} getNow={getNow}>
        The samples arrived.
      </ChatMessage>,
    );
    const article = screen.getByRole('article', { name: mariaAt1025 });
    expect(article).toHaveAttribute('id', 'm1');
    expect(container.querySelector('.ui-chat-message__time')).toHaveTextContent('5 minutes ago');
    const { container: bare } = render(<ChatMessage origin="system">Lena joined.</ChatMessage>);
    expect(messageElement(bare)).not.toHaveAttribute('aria-labelledby');
  });

  it('UIC-CHAT-TRANSCRIPT-2.5 marks the author with their presence', () => {
    const { container } = render(
      <ChatMessage author={{ ...maria, status: 'away', statusLabel: 'Away' }}>
        Back soon.
      </ChatMessage>,
    );
    const avatar = container.querySelector('.ui-chat-message__avatar');
    expect(avatar).toHaveClass('ui-avatar');
    expect(avatar).toHaveAttribute('data-status', 'away');
    expect(screen.getByRole('img', { name: 'Maria Santos, Away' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['avatar'] });
  });

  it('UIC-CHAT-TRANSCRIPT-2.6 leaves the avatar and the name out after the first message of a group', () => {
    const { container } = render(
      <>
        {(['first', 'middle', 'last'] as const).map((position) => (
          <ChatMessage
            key={position}
            author={maria}
            time={time}
            getNow={getNow}
            groupPosition={position}
          >
            {position}
          </ChatMessage>
        ))}
      </>,
    );
    const [first, middle, last] = screen.getAllByRole('article');
    expect(first).toHaveAttribute('data-group-position', 'first');
    expect(first?.querySelector('.ui-chat-message__avatar')).not.toBeNull();
    expect(first?.querySelector('.ui-chat-message__author')).toHaveTextContent('Maria Santos');
    for (const [message, position] of [
      [middle, 'middle'],
      [last, 'last'],
    ] as const) {
      expect(message).toHaveAttribute('data-group-position', position);
      expect(message?.querySelector('.ui-chat-message__avatar')).toBeNull();
      expect(message?.querySelector('.ui-chat-message__author')).toBeNull();
      expect(message?.querySelector('.ui-chat-message__time')).toHaveTextContent('5 minutes ago');
      expect(message).toHaveAccessibleName(mariaAt1025);
    }
    const { container: single } = render(<ChatMessage>Alone</ChatMessage>);
    expect(messageElement(single)).toHaveAttribute('data-group-position', 'single');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-2.7 publishes hover and focus within the message', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <ChatMessage
          author={maria}
          time={time}
          getNow={getNow}
          groupPosition="middle"
          actions={<button>Copy</button>}
        >
          Two crates were cold.
        </ChatMessage>
        <button>After</button>
      </>,
    );
    const message = messageElement(container);
    await user.hover(message);
    expect(message).toHaveAttribute('data-hovered', 'true');
    await user.unhover(message);
    expect(message).not.toHaveAttribute('data-hovered');
    await user.tab();
    expect(container.querySelector('.ui-chat-message__time')).toHaveFocus();
    expect(message).toHaveAttribute('data-focus-within', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveFocus();
    expect(message).toHaveAttribute('data-focus-within', 'true');
    await user.tab();
    expect(message).not.toHaveAttribute('data-focus-within');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });
});

describe('ChatMessage avatar, name and background', () => {
  it('UIC-CHAT-TRANSCRIPT-2.13 hides the avatar and the name while keeping the message named', () => {
    const { container } = render(
      <ChatMessage
        author={maria}
        time={time}
        getNow={getNow}
        showAvatar={false}
        showAuthorName={false}
      >
        The samples arrived.
      </ChatMessage>,
    );
    const message = messageElement(container);
    expect(message).toHaveAttribute('data-avatar-hidden', 'true');
    expect(container.querySelector('.ui-chat-message__avatar')).toBeNull();
    expect(container.querySelector('.ui-chat-message__author')).toBeNull();
    expect(container.querySelector('.ui-chat-message__time')).toHaveTextContent('5 minutes ago');
    expect(screen.getByRole('article', { name: mariaAt1025 })).toBe(message);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['header', 'time'] });
  });

  it('UIC-CHAT-TRANSCRIPT-2.13 hides the avatar or the name on its own', () => {
    const { container } = render(
      <>
        <ChatMessage author={maria} showAvatar={false}>
          No avatar
        </ChatMessage>
        <ChatMessage author={maria} showAuthorName={false}>
          No name
        </ChatMessage>
      </>,
    );
    const [noAvatar, noName] = screen.getAllByRole('article');
    expect(noAvatar?.querySelector('.ui-chat-message__avatar')).toBeNull();
    expect(noAvatar?.querySelector('.ui-chat-message__author')).toHaveTextContent('Maria Santos');
    expect(noName?.querySelector('.ui-chat-message__avatar')).not.toBeNull();
    expect(noName?.querySelector('.ui-chat-message__author')).toBeNull();
    expect(noName).not.toHaveAttribute('data-avatar-hidden');
    expect(noName?.querySelector('.ui-chat-message__header')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-2.13 hides the time, also from a grouped message, while keeping it in the name', () => {
    const { container } = render(
      <>
        <ChatMessage author={maria} time={time} getNow={getNow} timePlacement="none">
          Named, no time
        </ChatMessage>
        <ChatMessage
          author={maria}
          time={time}
          getNow={getNow}
          groupPosition="last"
          timePlacement="none"
        >
          Grouped, no time
        </ChatMessage>
      </>,
    );
    const [named, grouped] = screen.getAllByRole('article');
    expect(named?.querySelector('.ui-chat-message__time')).toBeNull();
    expect(named?.querySelector('.ui-chat-message__author')).toHaveTextContent('Maria Santos');
    expect(grouped?.querySelector('.ui-chat-message__header')).toBeNull();
    expect(named).toHaveAccessibleName(mariaAt1025);
    expect(grouped).toHaveAccessibleName(mariaAt1025);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-2.13 places the time in the footer, also for a grouped or deleted message', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <ChatMessage author={maria} time={time} getNow={getNow} timePlacement="footer" isEdited>
          Footer time
        </ChatMessage>
        <ChatMessage
          author={maria}
          time={time}
          getNow={getNow}
          groupPosition="last"
          timePlacement="footer"
        >
          Grouped
        </ChatMessage>
        <ChatMessage author={maria} time={time} getNow={getNow} timePlacement="footer" isDeleted>
          Gone
        </ChatMessage>
      </>,
    );
    const [named, grouped, deleted] = screen.getAllByRole('article');
    for (const message of [named, grouped, deleted]) {
      const footerTime = message?.querySelector('.ui-chat-message__footer .ui-chat-message__time');
      expect(footerTime).toHaveTextContent('5 minutes ago');
      expect(message?.querySelector('.ui-chat-message__header .ui-chat-message__time')).toBeNull();
      expect(message).toHaveAccessibleName(mariaAt1025);
    }
    expect(named?.querySelector('.ui-chat-message__author')).toHaveTextContent('Maria Santos');
    expect(named?.querySelector('.ui-chat-message__footer')).toHaveTextContent(/Edited/);
    expect(grouped?.querySelector('.ui-chat-message__header')).toBeNull();
    await user.tab();
    expect(named?.querySelector('.ui-chat-message__time')).toHaveFocus();
    expect(named).toHaveAttribute('data-focus-within', 'true');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-2.13 marks a footer that holds only the time, and collapses it on request', () => {
    render(
      <>
        <ChatMessage author={maria} time={time} getNow={getNow} timePlacement="footer">
          Time only
        </ChatMessage>
        <ChatMessage author={maria} time={time} getNow={getNow} timePlacement="footer" isEdited>
          With a marker
        </ChatMessage>
        <ChatMessage
          author={maria}
          time={time}
          getNow={getNow}
          timePlacement="footer"
          collapseFooterTime
        >
          Collapsed
        </ChatMessage>
      </>,
    );
    const [timeOnly, marked, collapsed] = screen.getAllByRole('article');
    const footer = (message: HTMLElement | undefined) =>
      message?.querySelector('.ui-chat-message__footer');
    expect(footer(timeOnly)).toHaveAttribute('data-time-only', 'true');
    expect(footer(marked)).not.toHaveAttribute('data-time-only');
    expect(timeOnly).not.toHaveAttribute('data-collapse-footer-time');
    expect(collapsed).toHaveAttribute('data-collapse-footer-time', 'true');
  });

  it('UIC-CHAT-TRANSCRIPT-2.13 shows the time in a tooltip once the message is hovered for the delay', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ChatMessage author={maria} time={time} getNow={getNow} timePlacement="tooltip">
        Tooltip time
      </ChatMessage>,
    );
    const article = screen.getByRole('article', { name: mariaAt1025 });
    expect(container.querySelector('.ui-chat-message__time')).toBeNull();
    await user.hover(within(article).getByText('Tooltip time'));
    expect(document.querySelector('.ui-tooltip')).toBeNull();
    const tooltip = await screen.findByRole('tooltip', { hidden: true }, { timeout: 2000 });
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(within(tooltip).getByText('5 minutes ago')).toHaveClass('ui-chat-message__time');
    await user.unhover(article);
    await waitFor(() =>
      expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument(),
    );
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });

  it('UIC-CHAT-TRANSCRIPT-2.13 publishes the bubble variant by default and plain on request', () => {
    const { container } = render(
      <>
        <ChatMessage author={maria}>Bubble</ChatMessage>
        <ChatMessage author={maria} variant="plain">
          Plain
        </ChatMessage>
      </>,
    );
    const [bubble, plain] = screen.getAllByRole('article');
    expect(bubble).toHaveAttribute('data-variant', 'bubble');
    expect(plain).toHaveAttribute('data-variant', 'plain');
    expect(plain?.querySelector('.ui-chat-message__content')).toHaveTextContent('Plain');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });
});

describe('ChatMessage status, delivery and errors', () => {
  it('UIC-CHAT-TRANSCRIPT-2.2 keeps a cancelled reply and marks it stopped', () => {
    const { container } = render(
      <ChatMessage status="cancelled">Checking the notes for</ChatMessage>,
    );
    const message = messageElement(container);
    expect(message).toHaveAttribute('data-status', 'cancelled');
    expect(message).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.ui-chat-message__content')).toHaveTextContent(
      'Checking the notes for',
    );
    expect(container.querySelector('.ui-chat-message__stopped')).toHaveTextContent('Stopped');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['footer', 'stopped'] });
  });

  it('UIC-CHAT-TRANSCRIPT-2.8 says each delivery status in words', () => {
    const labels: Record<ChatMessageDelivery, [string, string]> = {
      sending: ['Sending', 'clock'],
      sent: ['Sent', 'check'],
      delivered: ['Delivered', 'success'],
      read: ['Read', 'eye'],
      failed: ['Not sent', 'error'],
    };
    for (const [delivery, [label, glyph]] of Object.entries(labels)) {
      const { container, unmount } = render(
        <ChatMessage origin="sent" delivery={delivery as ChatMessageDelivery}>
          On my way.
        </ChatMessage>,
      );
      expect(messageElement(container)).toHaveAttribute('data-delivery', delivery);
      expect(container.querySelector('.ui-chat-message__delivery-label')).toHaveTextContent(label);
      expect(container.querySelector('.ui-chat-message__delivery-icon')).toHaveAttribute(
        'data-glyph',
        glyph,
      );
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
      expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', {
        slots: ['footer', 'delivery', 'delivery-icon', 'delivery-label'],
      });
      unmount();
    }
  });

  it('UIC-CHAT-TRANSCRIPT-2.8 retries a failed send from the footer', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { container } = render(
      <ChatMessage origin="sent" delivery="failed" onRetry={onRetry}>
        On my way.
      </ChatMessage>,
    );
    const footer = container.querySelector<HTMLElement>('.ui-chat-message__footer');
    await user.click(within(footer as HTMLElement).getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['retry'] });
  });

  it('UIC-CHAT-TRANSCRIPT-2.9 shows an error as an alert with one Retry button', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { container } = render(
      <ChatMessage origin="sent" delivery="failed" error="The network dropped." onRetry={onRetry}>
        On my way.
      </ChatMessage>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('The network dropped.');
    const error = container.querySelector<HTMLElement>('.ui-chat-message__error');
    expect(screen.getAllByRole('button', { name: 'Retry' })).toHaveLength(1);
    await user.click(within(error as HTMLElement).getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    const { container: plain } = render(<ChatMessage error="No reply came back.">Hi</ChatMessage>);
    expect(plain.querySelector('.ui-chat-message__error')).toHaveTextContent('No reply came back.');
    expect(plain.querySelector('.ui-chat-message__retry')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['error', 'retry'] });
  });
});

describe('ChatMessage markers, quote and slots', () => {
  it('UIC-CHAT-TRANSCRIPT-2.10 marks an edited message', () => {
    const { container } = render(<ChatMessage isEdited>Lunch at one instead.</ChatMessage>);
    expect(container.querySelector('.ui-chat-message__edited')).toHaveTextContent('Edited');
    expect(messageElement(container)).not.toHaveAttribute('data-deleted');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['edited'] });
  });

  it('UIC-CHAT-TRANSCRIPT-2.10 replaces a deleted message with a placeholder', () => {
    const { container } = render(
      <ChatMessage
        author={maria}
        time={time}
        getNow={getNow}
        isDeleted
        isEdited
        delivery="read"
        error="Not sent."
        quote={{ authorName: 'Ana Lopez', excerpt: 'Lunch?' }}
        reactions={<span>👍 2</span>}
        readers={<span>Seen by Ana</span>}
        actions={<button>Copy</button>}
      >
        The secret plan.
      </ChatMessage>,
    );
    const message = messageElement(container);
    expect(message).toHaveAttribute('data-deleted', 'true');
    expect(container.querySelector('.ui-chat-message__content')).toHaveTextContent(
      'Message deleted',
    );
    expect(message).not.toHaveTextContent('The secret plan.');
    for (const slot of ['quote', 'footer', 'error', 'reactions', 'actions']) {
      expect(container.querySelector(`.ui-chat-message__${slot}`)).toBeNull();
    }
    expect(container.querySelector('.ui-chat-message__readers')).toHaveTextContent('Seen by Ana');
    expect(container.querySelector('.ui-chat-message__author')).toHaveTextContent('Maria Santos');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['readers'] });
  });

  it('UIC-CHAT-TRANSCRIPT-2.11 quotes the message it replies to and jumps to it', async () => {
    const user = userEvent.setup();
    const onQuotePress = vi.fn();
    const quote = { authorName: 'Ana Lopez', excerpt: 'Lunch at noon?', messageId: 'm0' };
    const { container } = render(
      <ChatMessage quote={quote} onQuotePress={onQuotePress}>
        Yes, see you there.
      </ChatMessage>,
    );
    const quoteElement = container.querySelector('.ui-chat-message__quote');
    expect(quoteElement).toHaveClass('ui-chat-quote');
    expect(quoteElement?.nextElementSibling).toHaveClass('ui-chat-message__content');
    await user.click(screen.getByRole('button', { name: 'Quote from Ana Lopez: Lunch at noon?' }));
    expect(onQuotePress).toHaveBeenCalledWith('m0');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['quote'] });
    const { container: still } = render(
      <ChatMessage
        quote={{ authorName: 'Ana Lopez', excerpt: 'Lunch?' }}
        onQuotePress={onQuotePress}
      >
        Yes.
      </ChatMessage>,
    );
    expect(still.querySelector('blockquote.ui-chat-message__quote')).toHaveTextContent(
      'Ana Lopez Lunch?',
    );
  });

  it('UIC-CHAT-TRANSCRIPT-2.12 renders the reactions before the actions and the readers last', () => {
    const { container } = render(
      <ChatMessage
        reactions={<span>👍 2</span>}
        readers={<span>Seen by Ana</span>}
        actions={<button>Copy</button>}
      >
        Done.
      </ChatMessage>,
    );
    const body = container.querySelector('.ui-chat-message__body');
    const slots = [...(body?.children ?? [])].map((child) => child.className);
    expect(slots).toEqual([
      'ui-chat-message__content',
      'ui-chat-message__reactions',
      'ui-chat-message__actions',
      'ui-chat-message__readers',
    ]);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['reactions', 'readers'] });
    const { container: bare } = render(<ChatMessage>Done.</ChatMessage>);
    expect(bare.querySelector('.ui-chat-message__reactions')).toBeNull();
    expect(bare.querySelector('.ui-chat-message__readers')).toBeNull();
  });
});

describe('ChatMessage streaming caret', () => {
  it('UIC-CHAT-TRANSCRIPT-2.13 publishes the caret only when asked, on a received message that streams', () => {
    const caretOf = (props: Parameters<typeof ChatMessage>[0]) => {
      const { container, unmount } = render(
        <ChatMessage author={maria} time={time} getNow={getNow} {...props}>
          Saturday suits
        </ChatMessage>,
      );
      const message = messageElement(container);
      const result = {
        caret: message.hasAttribute('data-streaming-caret'),
        busy: message.getAttribute('aria-busy'),
      };
      unmount();
      return result;
    };
    expect(caretOf({ status: 'streaming' })).toEqual({ caret: false, busy: 'true' });
    expect(caretOf({ status: 'streaming', streamingCaret: true })).toEqual({
      caret: true,
      busy: 'true',
    });
    for (const props of [
      { status: 'complete' },
      { status: 'cancelled' },
      { status: 'error' },
      { status: 'streaming', origin: 'sent' },
      { status: 'streaming', origin: 'system' },
      { status: 'streaming', isDeleted: true },
    ] as const) {
      expect(caretOf({ ...props, streamingCaret: true }).caret).toBe(false);
    }
    const { container } = render(
      <ChatMessage status="streaming" streamingCaret>
        Saturday
      </ChatMessage>,
    );
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
  });
});
