import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  distanceToBottom,
  getViewport,
  installTranscriptLayout,
  offsetInViewport,
  scrollViewport,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript, type ChatTranscriptProps } from './chat-transcript.js';

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
});

/** Messages `first` to `last`, the last one sent by the reader when `lastSent`. */
function LongHistory({
  first = 1,
  last = 3000,
  lastSent = false,
  ...props
}: { first?: number; last?: number; lastSent?: boolean } & ChatTranscriptProps) {
  return (
    <ChatTranscript virtualized {...props}>
      {Array.from({ length: last - first + 1 }, (_, index) => {
        const number = first + index;
        return (
          <ChatMessage
            key={number}
            id={`m${number}`}
            origin={lastSent && number === last ? 'sent' : 'received'}
          >
            Message {number}
          </ChatMessage>
        );
      })}
    </ChatTranscript>
  );
}

const article = (id: string) => document.getElementById(id);

describe('ChatTranscript virtualized', () => {
  it('UIC-CHAT-TRANSCRIPT-1.6 mounts only the messages near the view of a long history', () => {
    const { container } = render(<LongHistory />);
    const viewport = getViewport();
    expect(container.querySelector('.ui-chat-transcript')).toHaveAttribute(
      'data-virtualized',
      'true',
    );
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    expect(viewport.scrollHeight).toBe(150_000);
    expect(distanceToBottom(viewport)).toBe(0);
    expect(offsetInViewport(article('m3000') as HTMLElement)).toBe(150);
    expect(article('m3000')).toHaveAttribute('aria-posinset', '3000');
    expect(article('m1')).toBeNull();
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
    scrollViewport(viewport, 75_000);
    expect(offsetInViewport(article('m1501') as HTMLElement)).toBe(0);
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 mounts the message the keyboard moves to', async () => {
    const user = userEvent.setup();
    render(<LongHistory />);
    const viewport = getViewport();
    act(() => article('m3000')?.focus());
    await user.keyboard('{Home}');
    expect(article('m1')).toHaveFocus();
    expect(viewport.scrollTop).toBe(0);
    await user.keyboard('{ArrowDown}');
    expect(article('m2')).toHaveFocus();
    await user.keyboard('{End}');
    expect(article('m3000')).toHaveFocus();
    expect(distanceToBottom(viewport)).toBe(0);
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 follows, keeps the place as history loads and reaches a highlight', () => {
    const { rerender } = render(<LongHistory first={1001} last={4000} hasOlder />);
    const viewport = getViewport();
    rerender(<LongHistory first={1001} last={4001} hasOlder />);
    expect(distanceToBottom(viewport)).toBe(0);
    expect(article('m4001')).not.toBeNull();
    scrollViewport(viewport, 10_030);
    expect(offsetInViewport(article('m1201') as HTMLElement)).toBe(0);
    rerender(<LongHistory first={1} last={4001} hasOlder />);
    expect(offsetInViewport(article('m1201') as HTMLElement)).toBe(0);
    expect(viewport.scrollTop).toBe(60_030);
    rerender(<LongHistory first={1} last={4001} highlightedMessageId="m10" />);
    expect(article('m10')).toHaveFocus();
    expect(article('m10')).toHaveAttribute('data-highlighted', 'true');
    expect(offsetInViewport(article('m10') as HTMLElement)).toBe(75);
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 anchors the reader’s message in a long history', () => {
    const { rerender } = render(<LongHistory scrollMode="anchor" />);
    rerender(<LongHistory scrollMode="anchor" last={3001} lastSent />);
    expect(offsetInViewport(article('m3001') as HTMLElement)).toBe(0);
    rerender(<LongHistory scrollMode="anchor" last={3002} />);
    expect(offsetInViewport(article('m3001') as HTMLElement)).toBe(0);
    expect(offsetInViewport(article('m3002') as HTMLElement)).toBe(50);
  });
});
