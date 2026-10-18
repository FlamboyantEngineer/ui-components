import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ChatMessage, ChatTranscript } from './chat-transcript.js';

/** The log viewport's layout, which jsdom does not compute. */
const geometry = { clientHeight: 100, scrollHeight: 100 };
const scrollTops = new WeakMap<Element, number>();

function isViewport(element: Element): boolean {
  return element.classList.contains('ui-scroll-region__viewport');
}

beforeEach(() => {
  geometry.clientHeight = 100;
  geometry.scrollHeight = 100;
  for (const key of ['clientHeight', 'scrollHeight'] as const) {
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get(this: HTMLElement) {
        return isViewport(this) ? geometry[key] : 0;
      },
    });
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get(this: HTMLElement) {
      return scrollTops.get(this) ?? 0;
    },
    set(this: HTMLElement, value: number) {
      const range = Math.max(0, geometry.scrollHeight - geometry.clientHeight);
      scrollTops.set(this, isViewport(this) ? Math.min(Math.max(0, value), range) : 0);
    },
  });
});

afterEach(() => {
  for (const key of ['clientHeight', 'scrollHeight', 'scrollTop']) {
    Reflect.deleteProperty(HTMLElement.prototype, key);
  }
});

const getNow = () => new Date('2026-04-20T10:30:00');
const maria = { name: 'Maria Santos', colorKey: 'maria' };

function Conversation({ count }: { count: number }) {
  return (
    <ChatTranscript emptyState="Ask a question to start.">
      {Array.from({ length: count }, (_, index) => (
        <ChatMessage key={index} author={maria} getNow={getNow}>
          Message {index + 1}
        </ChatMessage>
      ))}
    </ChatTranscript>
  );
}

const log = () => screen.getByRole('log', { name: 'Conversation' });

/** Lets the log's mutation observer see new messages. */
async function settle() {
  await act(async () => undefined);
}

function scrollLogTo(top: number) {
  log().scrollTop = top;
  fireEvent.scroll(log());
}

describe('ChatTranscript', () => {
  it('UIC-CHAT-TRANSCRIPT-1.1 is a focusable named log that shows an empty state without messages', () => {
    const { container, rerender } = render(<Conversation count={0} />);
    const transcript = container.querySelector('.ui-chat-transcript');
    expect(transcript).toHaveAttribute('data-empty', 'true');
    expect(log()).toHaveAttribute('tabindex', '0');
    expect(log()).toHaveTextContent('Ask a question to start.');
    expect(container.querySelector('.ui-chat-transcript__log')).toHaveClass('ui-scroll-region');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['log', 'empty'] });
    rerender(<Conversation count={2} />);
    expect(transcript).not.toHaveAttribute('data-empty');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(container.querySelector('.ui-chat-transcript__empty')).toBeNull();
  });

  it('UIC-CHAT-TRANSCRIPT-1.2 follows new messages at the bottom until the reader scrolls up', async () => {
    geometry.scrollHeight = 300;
    const { rerender } = render(<Conversation count={3} />);
    await settle();
    expect(log().scrollTop).toBe(200);
    fireEvent.scroll(log());
    geometry.scrollHeight = 400;
    rerender(<Conversation count={4} />);
    await settle();
    expect(log().scrollTop).toBe(300);
    fireEvent.scroll(log());
    scrollLogTo(120);
    geometry.scrollHeight = 500;
    rerender(<Conversation count={5} />);
    await settle();
    expect(log().scrollTop).toBe(120);
  });

  it('UIC-CHAT-TRANSCRIPT-1.3 jumps back to the latest message and follows again', async () => {
    const user = userEvent.setup();
    geometry.scrollHeight = 300;
    const { container, rerender } = render(<Conversation count={3} />);
    await settle();
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    scrollLogTo(50);
    const jump = screen.getByRole('button', { name: 'Jump to latest' });
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['jump'] });
    geometry.scrollHeight = 400;
    rerender(<Conversation count={4} />);
    await settle();
    expect(log().scrollTop).toBe(50);
    await user.click(jump);
    expect(log().scrollTop).toBe(300);
    expect(log()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    fireEvent.scroll(log());
    geometry.scrollHeight = 500;
    rerender(<Conversation count={5} />);
    await settle();
    expect(log().scrollTop).toBe(400);
    scrollLogTo(10);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
    scrollLogTo(400);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-1.4 forwards attributes to the root and names the log', () => {
    const { container } = render(
      <ChatTranscript id="chat" className="caller" data-testid="probe" aria-label="Support chat">
        <ChatMessage>Hello</ChatMessage>
      </ChatTranscript>,
    );
    const transcript = container.querySelector('.ui-chat-transcript');
    expect(transcript).toHaveAttribute('id', 'chat');
    expect(transcript).toHaveClass('caller');
    expect(transcript).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('log', { name: 'Support chat' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});

describe('ChatMessage', () => {
  it('UIC-CHAT-TRANSCRIPT-2.1 shows the author, the time, the content and the actions', () => {
    const { container } = render(
      <ChatMessage
        author={maria}
        time="2026-04-20T10:25:00"
        getNow={getNow}
        actions={<button>Copy</button>}
      >
        The samples arrived.
      </ChatMessage>,
    );
    const message = screen.getByRole('article');
    expect(message).toHaveClass('ui-chat-message');
    expect(container.querySelector('.ui-chat-message__avatar')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.querySelector('.ui-chat-message__author')).toHaveTextContent('Maria Santos');
    expect(container.querySelector('.ui-chat-message__time')).toHaveTextContent('5 minutes ago');
    expect(container.querySelector('.ui-chat-message__content')).toHaveTextContent(
      'The samples arrived.',
    );
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', {
      slots: ['avatar', 'body', 'header', 'author', 'time', 'content', 'actions'],
    });
  });

  it('UIC-CHAT-TRANSCRIPT-2.1 leaves out the header without an author or a time', () => {
    const { container } = render(<ChatMessage author={{ name: '  ' }}>Hello</ChatMessage>);
    expect(container.querySelector('.ui-chat-message__author')).toHaveTextContent('Unnamed');
    const { container: bare } = render(<ChatMessage origin="system">Joined</ChatMessage>);
    expect(bare.querySelector('.ui-chat-message__header')).toBeNull();
    expect(bare.querySelector('.ui-chat-message__avatar')).toBeNull();
  });

  it('UIC-CHAT-TRANSCRIPT-2.2 publishes its origin and status and is busy while streaming', () => {
    const { container, rerender } = render(<ChatMessage>Hi</ChatMessage>);
    const message = () => container.querySelector('.ui-chat-message');
    expect(message()).toHaveAttribute('data-origin', 'received');
    expect(message()).toHaveAttribute('data-status', 'complete');
    expect(message()).not.toHaveAttribute('aria-busy');
    rerender(
      <ChatMessage origin="sent" status="streaming">
        Hi
      </ChatMessage>,
    );
    expect(message()).toHaveAttribute('data-origin', 'sent');
    expect(message()).toHaveAttribute('data-status', 'streaming');
    expect(message()).toHaveAttribute('aria-busy', 'true');
    rerender(
      <ChatMessage origin="system" status="error">
        Hi
      </ChatMessage>,
    );
    expect(message()).toHaveAttribute('data-origin', 'system');
    expect(message()).toHaveAttribute('data-status', 'error');
  });

  it('UIC-CHAT-TRANSCRIPT-2.3 forwards attributes to the article', () => {
    const { container } = render(
      <ChatMessage id="m1" className="caller" data-testid="probe">
        Hi
      </ChatMessage>,
    );
    const message = container.querySelector('.ui-chat-message');
    expect(message).toHaveAttribute('id', 'm1');
    expect(message).toHaveClass('caller');
    expect(message).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });
});
