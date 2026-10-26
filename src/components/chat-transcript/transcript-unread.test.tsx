import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Fragment } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  getViewport,
  installTranscriptLayout,
  offsetInViewport,
  scrollViewport,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript } from './chat-transcript.js';

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

const ana = { name: 'Ana Lima' };

/** `count` messages from Ana, with a divider before the first unread one. */
function Thread({
  count,
  firstUnreadId,
  onRead,
}: {
  count: number;
  firstUnreadId?: string;
  onRead?: (id: string) => void;
}) {
  return (
    <ChatTranscript firstUnreadId={firstUnreadId} onRead={onRead}>
      {Array.from({ length: count }, (_, index) => {
        const id = `m${index + 1}`;
        return (
          <Fragment key={id}>
            {id === firstUnreadId ? <p>New messages</p> : null}
            <ChatMessage id={id} author={ana}>
              Message {index + 1}
            </ChatMessage>
          </Fragment>
        );
      })}
    </ChatTranscript>
  );
}

const article = (id: string) => document.getElementById(id) as HTMLElement;

describe('ChatTranscript unread', () => {
  it('UIC-CHAT-TRANSCRIPT-4.4 counts the messages that arrive while the reader is away', () => {
    const { rerender } = render(<Thread count={10} />);
    const viewport = getViewport();
    rerender(<Thread count={11} />);
    scrollViewport(viewport, 0);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
    rerender(<Thread count={12} />);
    expect(screen.getByRole('button', { name: '1 new message' })).toBeInTheDocument();
    rerender(<Thread count={14} />);
    expect(screen.getByRole('button', { name: '3 new messages' })).toBeInTheDocument();
    scrollViewport(viewport, viewport.scrollHeight);
    expect(screen.queryByRole('button', { name: /new message/ })).not.toBeInTheDocument();
    scrollViewport(viewport, 0);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-4.5 shows the unread bar while the first unread message is above and jumps to it', async () => {
    const user = userEvent.setup();
    const { container } = render(<Thread count={30} firstUnreadId="m19" />);
    const viewport = getViewport();
    const jump = screen.getByRole('button', { name: 'Jump' });
    expect(container.querySelector('.ui-chat-transcript__unread')).toHaveTextContent('12 unread');
    expect(jump).toHaveAccessibleDescription('12 unread');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['unread'] });
    await user.click(jump);
    expect(article('m19')).toHaveFocus();
    expect(viewport.scrollTop).toBe(900);
    expect(offsetInViewport(article('m19'))).toBe(20);
    expect(screen.queryByRole('button', { name: 'Jump' })).not.toBeInTheDocument();
    scrollViewport(viewport, viewport.scrollHeight);
    expect(screen.getByRole('button', { name: 'Jump' })).toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-4.5 shows no bar without a first unread message or when it is in view', () => {
    const { rerender } = render(<Thread count={30} />);
    expect(screen.queryByRole('button', { name: 'Jump' })).not.toBeInTheDocument();
    rerender(<Thread count={30} firstUnreadId="m29" />);
    expect(screen.queryByRole('button', { name: 'Jump' })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-4.6 reports the newest message seen or focused, once it settles', () => {
    vi.useFakeTimers();
    const onRead = vi.fn();
    const { rerender } = render(<Thread count={10} onRead={onRead} />);
    const viewport = getViewport();
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(onRead).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onRead).toHaveBeenLastCalledWith('m10');
    scrollViewport(viewport, 0);
    rerender(<Thread count={12} onRead={onRead} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onRead).toHaveBeenCalledTimes(1);
    act(() => article('m11').focus());
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onRead).toHaveBeenLastCalledWith('m11');
    scrollViewport(viewport, viewport.scrollHeight);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onRead).toHaveBeenLastCalledWith('m12');
    expect(onRead).toHaveBeenCalledTimes(3);
  });
});
