import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript, type ChatMessageProps } from './chat-transcript.js';

beforeEach(() => {
  vi.useFakeTimers();
  installTranscriptLayout();
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

interface Line {
  id: string;
  text: string;
  origin?: ChatMessageProps['origin'];
  status?: ChatMessageProps['status'];
  author?: string;
}

const history: Line[] = [
  { id: 'h1', text: 'Shall we book the train?', origin: 'sent' },
  { id: 'h2', text: 'Yes, the morning one.', author: 'Ana Lima' },
];

function Conversation({ lines }: { lines: Line[] }) {
  return (
    <ChatTranscript>
      {lines.map((line) => (
        <ChatMessage
          key={line.id}
          id={line.id}
          origin={line.origin}
          status={line.status}
          author={line.author ? { name: line.author } : undefined}
          time="2026-04-20T10:00:00"
          getNow={() => new Date('2026-04-20T10:30:00')}
        >
          {line.text}
        </ChatMessage>
      ))}
    </ChatTranscript>
  );
}

const announcer = () => screen.getByRole('status');

describe('ChatTranscript announcements', () => {
  it('UIC-CHAT-TRANSCRIPT-3.6 announces an arriving message once, without the history', () => {
    const { container, rerender } = render(<Conversation lines={history} />);
    expect(announcer()).toHaveClass('ui-chat-transcript__announcer');
    expect(announcer()).toHaveTextContent(/^$/);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['announcer'] });
    rerender(
      <Conversation
        lines={[...history, { id: 'n1', text: 'Seats 12 and 13.', author: 'Ana Lima' }]}
      />,
    );
    expect(announcer()).toHaveTextContent('New message from Ana Lima: Seats 12 and 13.');
    expect(screen.getByRole('feed')).not.toHaveAttribute('aria-live');
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 groups what arrives within a second and skips the reader’s own', () => {
    const first = [...history, { id: 'n1', text: 'Booked.', author: 'Ana Lima' }];
    const { rerender } = render(<Conversation lines={history} />);
    rerender(<Conversation lines={first} />);
    expect(announcer()).toHaveTextContent('New message from Ana Lima: Booked.');
    const second = [
      ...first,
      { id: 'n2', text: 'Thanks!', origin: 'sent' as const },
      { id: 'n3', text: 'Platform 4.', author: 'Ana Lima' },
      { id: 'n4', text: 'Leaving at 9.', author: 'Ben Okafor' },
    ];
    rerender(<Conversation lines={second} />);
    expect(announcer()).toHaveTextContent('New message from Ana Lima: Booked.');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(announcer()).toHaveTextContent(/^2 new messages$/);
    rerender(
      <Conversation lines={[...second, { id: 'n5', text: 'Ok', origin: 'sent' as const }]} />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(announcer()).toHaveTextContent(/^2 new messages$/);
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 announces a streamed reply once it completes', () => {
    const reply = (text: string, status: Line['status']) => [
      ...history,
      { id: 'r1', text, status, author: 'Helper' },
    ];
    const { rerender } = render(<Conversation lines={history} />);
    rerender(<Conversation lines={reply('The train', 'streaming')} />);
    rerender(<Conversation lines={reply('The train leaves', 'streaming')} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(announcer()).toHaveTextContent(/^$/);
    rerender(<Conversation lines={reply('The train leaves at nine.', 'complete')} />);
    expect(announcer()).toHaveTextContent('New message from Helper: The train leaves at nine.');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender(<Conversation lines={reply('The train leaves at nine.', 'complete')} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(announcer()).toHaveTextContent('New message from Helper: The train leaves at nine.');
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 announces a notice without an author and reads a repeat again', () => {
    const notice = { id: 'n1', text: 'Ben Okafor joined.', origin: 'system' as const };
    const { rerender } = render(<Conversation lines={history} />);
    rerender(<Conversation lines={[...history, notice]} />);
    expect(announcer()).toHaveTextContent(/^New message: Ben Okafor joined\.$/);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<Conversation lines={[...history, notice, { ...notice, id: 'n2' }]} />);
    // The repeat differs by an invisible character, so the live region changes and reads it.
    expect(announcer()).toHaveTextContent(/^New message: Ben Okafor joined\.\u200b$/, {
      normalizeWhitespace: false,
    });
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 announces nothing when another conversation replaces the messages', () => {
    const { rerender } = render(<Conversation lines={history} />);
    rerender(<Conversation lines={[{ id: 'x1', text: 'Hello there.', author: 'Ben Okafor' }]} />);
    expect(announcer()).toHaveTextContent(/^$/);
  });
});
