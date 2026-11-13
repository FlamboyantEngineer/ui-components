import { act, render, screen, within } from '@testing-library/react';
import { Activity } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  getViewport,
  installTranscriptLayout,
  offsetInViewport,
  resizeContent,
  scrollViewport,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, type ChatMessageProps, ChatTranscript } from './chat-transcript.js';

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
  error?: string;
  author?: string;
}

const history: Line[] = [
  { id: 'h1', text: 'Shall we book the train?', origin: 'sent' },
  { id: 'h2', text: 'Yes, the morning one.', author: 'Ana Lima' },
];

function Conversation({ lines, virtualized }: { lines: Line[]; virtualized?: boolean }) {
  return (
    <ChatTranscript virtualized={virtualized}>
      {lines.map((line) => (
        <ChatMessage
          key={line.id}
          id={line.id}
          origin={line.origin}
          status={line.status}
          error={line.error}
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

const longHistory: Line[] = Array.from({ length: 100 }, (_, index) => ({
  id: `h${index + 1}`,
  text: `Message ${index + 1}`,
}));

const batch: Line[] = Array.from({ length: 100 }, (_, index) => ({
  id: `n${index + 1}`,
  text: `Reply ${index + 1}`,
}));

describe('ChatTranscript announcements', () => {
  it('UIC-CHAT-TRANSCRIPT-1.6 UIC-CHAT-TRANSCRIPT-3.6 announces every received arrival once after a batch releases', () => {
    const lines = [
      ...longHistory,
      { id: 'sent', text: 'Thanks', origin: 'sent' as const },
      ...batch,
    ];
    const { rerender } = render(<Conversation virtualized lines={longHistory} />);
    rerender(<Conversation virtualized lines={lines} />);
    expect(announcer()).toHaveTextContent(/^New message: Reply 1$/);
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(announcer()).toHaveTextContent(/^99 new messages$/);
    scrollViewport(getViewport(), 2500);
    rerender(<Conversation virtualized lines={[...lines]} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(announcer()).toHaveTextContent(/^99 new messages$/);
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    expect(screen.queryByText('Reply 1')).not.toBeInTheDocument();
  });

  it.each(['complete', 'error', 'cancelled'] as const)(
    'UIC-CHAT-TRANSCRIPT-1.6 UIC-CHAT-TRANSCRIPT-3.6 retains an offscreen streaming arrival until %s then releases it',
    (terminal) => {
      const layout = installTranscriptLayout();
      // Measure all initial rows so the extent does not depend on estimated heights.
      const initial = longHistory.slice(0, 30);
      const streaming = [
        ...initial,
        { id: 'reply', text: 'Working', status: 'streaming' as const },
        ...batch.slice(1),
      ];
      const { rerender } = render(<Conversation virtualized lines={initial} />);
      const viewport = getViewport();
      scrollViewport(viewport, 500);
      rerender(<Conversation virtualized lines={streaming} />);
      expect(screen.getByText('Working')).toBeInTheDocument();
      expect(screen.queryByText('Reply 2')).not.toBeInTheDocument();
      expect(screen.getAllByRole('article').length).toBeLessThan(40);
      expect(viewport.scrollHeight).toBe(6500);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(announcer()).toHaveTextContent(/^98 new messages$/);
      const finished = streaming.map((line) =>
        line.id === 'reply'
          ? {
              ...line,
              text: 'Finished',
              status: terminal,
              error: terminal === 'error' ? 'Reply unavailable.' : undefined,
            }
          : line,
      );
      layout.heights.set('reply', 500);
      rerender(<Conversation virtualized lines={finished} />);
      expect(screen.queryByText('Finished')).not.toBeInTheDocument();
      expect(screen.getAllByRole('article').length).toBeLessThan(40);
      // Resize observers run after the layout effects that release the temporary mount.
      resizeContent();
      expect(viewport.scrollHeight).toBe(6950);
      expect(viewport.scrollTop).toBe(500);
      const outcomes = {
        complete: 'New message: Finished',
        error: 'Reply unavailable.',
        cancelled: '98 new messages',
      };
      const expected = outcomes[terminal];
      expect(announcer()).toHaveTextContent(new RegExp(`^${expected}$`));
      rerender(<Conversation virtualized lines={[...finished]} />);
      scrollViewport(viewport, 1500);
      expect(screen.getByText('Finished').closest('article')).toHaveAttribute(
        'data-status',
        terminal,
      );
      // The transcript announced the failure; mounting the message again is no alert.
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      const finishedArticle = screen.getByText('Finished').closest('article') as HTMLElement;
      expect(within(finishedArticle).queryAllByText('Reply unavailable.')).toHaveLength(
        terminal === 'error' ? 1 : 0,
      );
      expect(offsetInViewport(screen.getByText('Finished').closest('article') as HTMLElement)).toBe(
        0,
      );
      expect(viewport.scrollHeight).toBe(6950);
      scrollViewport(viewport, 2000);
      expect(offsetInViewport(screen.getByText('Reply 2').closest('article') as HTMLElement)).toBe(
        0,
      );
      scrollViewport(viewport, 500);
      expect(screen.queryByText('Finished')).not.toBeInTheDocument();
      expect(viewport.scrollHeight).toBe(6950);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(announcer()).toHaveTextContent(new RegExp(`^${expected}$`));
    },
  );

  it('UIC-CHAT-TRANSCRIPT-2.9 UIC-CHAT-TRANSCRIPT-3.6 announces a failure once, not the failures already there', () => {
    const failedHistory: Line[] = [
      ...history,
      { id: 'h3', text: 'Is it booked?', status: 'error', error: 'The line is busy.' },
    ];
    const { rerender } = render(<Conversation lines={failedHistory} />);
    expect(screen.getByText('The line is busy.')).not.toHaveAttribute('role');
    expect(announcer()).toHaveTextContent(/^$/);
    const sending: Line = { id: 's1', text: 'Book it.', origin: 'sent' };
    rerender(<Conversation lines={[...failedHistory, sending]} />);
    expect(announcer()).toHaveTextContent(/^$/);
    // It fails while it is shown.
    const unsent = { ...sending, error: 'The network dropped.' };
    rerender(<Conversation lines={[...failedHistory, unsent]} />);
    expect(announcer()).toHaveTextContent(/^The network dropped\.$/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // It arrives already failed.
    const refused: Line = { id: 'n1', text: 'Booking', status: 'error', error: 'No seats left.' };
    rerender(<Conversation lines={[...failedHistory, unsent, refused]} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(announcer()).toHaveTextContent(/^No seats left\.$/);
    // The same failure again, after a retry, is read again.
    rerender(<Conversation lines={[...failedHistory, sending, refused]} />);
    rerender(<Conversation lines={[...failedHistory, unsent, refused]} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(announcer()).toHaveTextContent(/^The network dropped\.$/);
  });

  it('UIC-CHAT-TRANSCRIPT-3.6 keeps announcing after it was hidden with an announcement pending', () => {
    const arrival = (index: number): Line => ({ id: `n${index}`, text: `Reply ${index}` });
    const shown = (lines: Line[], mode: 'visible' | 'hidden' = 'visible') => (
      <Activity mode={mode}>
        <Conversation lines={lines} />
      </Activity>
    );
    const { rerender } = render(shown(history));
    const arrived = [...history, arrival(1)];
    rerender(shown(arrived));
    expect(announcer()).toHaveTextContent(/^New message: Reply 1$/);
    // Hiding stops the effects within the second the announcer waits between announcements.
    rerender(shown(arrived, 'hidden'));
    rerender(shown(arrived));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(shown([...arrived, arrival(2)]));
    expect(announcer()).toHaveTextContent(/^New message: Reply 2$/);
  });

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

  it.each([false, true])(
    'UIC-CHAT-TRANSCRIPT-3.6 announces a streamed reply once it completes (virtualized=%s)',
    (virtualized) => {
      const reply = (text: string, status: Line['status']) => [
        ...history,
        { id: 'r1', text, status, author: 'Helper' },
      ];
      const { rerender } = render(<Conversation virtualized={virtualized} lines={history} />);
      rerender(<Conversation virtualized={virtualized} lines={reply('The train', 'streaming')} />);
      rerender(
        <Conversation virtualized={virtualized} lines={reply('The train leaves', 'streaming')} />,
      );
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(announcer()).toHaveTextContent(/^$/);
      rerender(
        <Conversation
          virtualized={virtualized}
          lines={reply('The train leaves at nine.', 'complete')}
        />,
      );
      expect(announcer()).toHaveTextContent('New message from Helper: The train leaves at nine.');
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      rerender(
        <Conversation
          virtualized={virtualized}
          lines={reply('The train leaves at nine.', 'complete')}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(announcer()).toHaveTextContent('New message from Helper: The train leaves at nine.');
    },
  );

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
