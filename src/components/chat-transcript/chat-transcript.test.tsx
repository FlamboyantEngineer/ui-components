import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  getViewport,
  installTranscriptLayout,
  scrollViewport,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript, type ChatTranscriptPresentation } from './chat-transcript.js';

let layout: ReturnType<typeof installTranscriptLayout>;

beforeEach(() => {
  layout = installTranscriptLayout({ viewportHeight: 100, messageHeight: 100 });
});

afterEach(() => {
  uninstallTranscriptLayout();
});

const getNow = () => new Date('2026-04-20T10:30:00');
const maria = { name: 'Maria Santos', colorKey: 'maria' };

function Conversation({
  count,
  presentation,
}: {
  count: number;
  presentation?: ChatTranscriptPresentation;
}) {
  return (
    <ChatTranscript emptyState="Ask a question to start." presentation={presentation}>
      {Array.from({ length: count }, (_, index) => (
        <ChatMessage key={index} id={`m${index + 1}`} author={maria} getNow={getNow}>
          Message {index + 1}
        </ChatMessage>
      ))}
    </ChatTranscript>
  );
}

const feed = () => screen.getByRole('feed', { name: 'Conversation' });

describe('ChatTranscript', () => {
  it('UIC-CHAT-TRANSCRIPT-1.1 is a named feed of articles, not a live region, with an empty state', () => {
    const { container, rerender } = render(<Conversation count={0} />);
    const transcript = container.querySelector('.ui-chat-transcript');
    expect(transcript).toHaveAttribute('data-empty', 'true');
    expect(screen.queryByRole('feed')).not.toBeInTheDocument();
    expect(container.querySelector('.ui-chat-transcript__empty')).toHaveTextContent(
      'Ask a question to start.',
    );
    expect(container.querySelector('.ui-chat-transcript__log')).toHaveClass('ui-scroll-region');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['log', 'empty', 'announcer'] });
    rerender(<Conversation count={2} />);
    expect(transcript).not.toHaveAttribute('data-empty');
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
    expect(feed()).not.toHaveAttribute('aria-live');
    expect(feed()).toHaveClass('ui-chat-transcript__feed');
    expect(within(feed()).getAllByRole('article')).toHaveLength(2);
    expect(container.querySelector('.ui-chat-transcript__empty')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['log', 'feed'] });
  });

  it('UIC-CHAT-TRANSCRIPT-1.2 follows new and growing messages at the bottom until the reader scrolls up', () => {
    const { rerender } = render(<Conversation count={3} />);
    const viewport = getViewport();
    expect(viewport.scrollTop).toBe(200);
    rerender(<Conversation count={4} />);
    expect(viewport.scrollTop).toBe(300);
    layout.heights.set('m4', 250);
    rerender(<Conversation count={4} />);
    expect(viewport.scrollTop).toBe(450);
    scrollViewport(viewport, 120);
    rerender(<Conversation count={5} />);
    expect(viewport.scrollTop).toBe(120);
  });

  it('UIC-CHAT-TRANSCRIPT-1.3 jumps back to the latest message, focuses it and follows again', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Conversation count={3} />);
    const viewport = getViewport();
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    scrollViewport(viewport, 50);
    const jump = screen.getByRole('button', { name: 'Jump to latest' });
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['jump'] });
    await user.click(jump);
    expect(viewport.scrollTop).toBe(200);
    expect(screen.getAllByRole('article').at(-1)).toHaveFocus();
    expect(jump).not.toBeInTheDocument();
    rerender(<Conversation count={4} />);
    expect(viewport.scrollTop).toBe(300);
    scrollViewport(viewport, 10);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
    scrollViewport(viewport, 300);
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-1.4 forwards attributes to the root and names the feed', () => {
    const { container } = render(
      <ChatTranscript
        id="chat"
        className="caller"
        data-testid="probe"
        aria-label="Support chat"
        aria-describedby="hint"
      >
        <ChatMessage id="m1">Hello</ChatMessage>
      </ChatTranscript>,
    );
    const transcript = container.querySelector('.ui-chat-transcript');
    expect(transcript).toHaveAttribute('id', 'chat');
    expect(transcript).toHaveClass('caller');
    expect(transcript).toHaveAttribute('data-testid', 'probe');
    expect(transcript).not.toHaveAttribute('data-virtualized');
    const named = screen.getByRole('feed', { name: 'Support chat' });
    expect(named).toHaveAttribute('aria-describedby', 'hint');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { callerAttributes: ['data-testid'] });
  });

  it('UIC-CHAT-TRANSCRIPT-1.7 frames itself by default and embeds without changing its behaviour', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Conversation count={3} />);
    const transcript = container.querySelector('.ui-chat-transcript');
    expect(transcript).toHaveAttribute('data-presentation', 'framed');
    rerender(<Conversation count={3} presentation="embedded" />);
    expect(transcript).toHaveAttribute('data-presentation', 'embedded');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['log', 'feed', 'announcer'] });
    const viewport = getViewport();
    expect(viewport.scrollTop).toBe(200);
    rerender(<Conversation count={4} presentation="embedded" />);
    expect(viewport.scrollTop).toBe(300);
    scrollViewport(viewport, 50);
    await user.click(screen.getByRole('button', { name: 'Jump to latest' }));
    expect(viewport.scrollTop).toBe(300);
    const articles = within(feed()).getAllByRole('article');
    expect(articles.at(-1)).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(articles.at(-2)).toHaveFocus();
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
