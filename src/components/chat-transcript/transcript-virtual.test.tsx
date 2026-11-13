import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Fragment } from 'react';
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
import {
  ChatDateSeparator,
  ChatMessage,
  ChatTranscript,
  type ChatTranscriptProps,
} from './chat-transcript.js';

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
  sent,
  ...props
}: { first?: number; last?: number; lastSent?: boolean; sent?: number } & ChatTranscriptProps) {
  return (
    <ChatTranscript virtualized {...props}>
      {Array.from({ length: last - first + 1 }, (_, index) => {
        const number = first + index;
        return (
          <ChatMessage
            key={number}
            id={`m${number}`}
            origin={number === sent || (lastSent && number === last) ? 'sent' : 'received'}
          >
            Message {number}
          </ChatMessage>
        );
      })}
    </ChatTranscript>
  );
}

/** Three hundred messages over six days, each day under its date separator. */
function Days(props: ChatTranscriptProps) {
  return (
    <ChatTranscript virtualized {...props}>
      {Array.from({ length: 300 }, (_, index) => {
        const day = Math.floor(index / 50) + 1;
        return (
          <Fragment key={index}>
            {index % 50 === 0 ? (
              <ChatDateSeparator
                key={`day-${day}`}
                date={`2026-04-0${day}`}
                getNow={() => new Date('2026-04-20T10:00:00')}
              />
            ) : null}
            <ChatMessage id={`m${index + 1}`}>Message {index + 1}</ChatMessage>
          </Fragment>
        );
      })}
    </ChatTranscript>
  );
}

const article = (id: string) => document.getElementById(id);

describe('ChatTranscript virtualized', () => {
  it('UIC-CHAT-TRANSCRIPT-1.6 keeps the reader in place when a shown transcript turns virtualized', () => {
    const { rerender } = render(<LongHistory last={150} virtualized={false} />);
    const viewport = getViewport();
    scrollViewport(viewport, 3000);
    expect(screen.getAllByRole('article')).toHaveLength(150);
    rerender(<LongHistory last={150} />);
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    expect(viewport.scrollHeight).toBe(7500);
    expect(viewport.scrollTop).toBe(3000);
    expect(offsetInViewport(article('m61') as HTMLElement)).toBe(0);
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 releases a large arrival batch after measuring it', () => {
    const { rerender } = render(<LongHistory last={100} />);
    const viewport = getViewport();
    rerender(<LongHistory last={200} />);
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    expect(viewport.scrollHeight).toBe(10_000);
    expect(distanceToBottom(viewport)).toBe(0);
    expect(offsetInViewport(article('m200') as HTMLElement)).toBe(150);
    for (const top of [2500, 1000, 2500]) {
      scrollViewport(viewport, top);
      rerender(<LongHistory last={200} />);
      expect(screen.getAllByRole('article').length).toBeLessThan(40);
      expect(offsetInViewport(article(`m${top / 50 + 1}`) as HTMLElement)).toBe(0);
      expect(viewport.scrollHeight).toBe(10_000);
      expect(article('m101')).toBeNull();
      expect(article('m199')).toBeInTheDocument();
      expect(article('m200')).toBeInTheDocument();
    }
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 keeps focus, the visible offset and the arrival count after release', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<LongHistory last={100} />);
    const viewport = getViewport();
    scrollViewport(viewport, 2510);
    const focused = article('m51') as HTMLElement;
    act(() => focused.focus());
    rerender(<LongHistory last={200} />);
    expect(focused).toHaveFocus();
    expect(offsetInViewport(focused)).toBe(-10);
    expect(viewport.scrollTop).toBe(2510);
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    expect(article('m101')).toBeNull();
    await user.click(screen.getByRole('button', { name: '100 new messages' }));
    expect(article('m200')).toHaveFocus();
    expect(distanceToBottom(viewport)).toBe(0);
    expect(screen.queryByRole('button', { name: /new messages/ })).not.toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-1.6 retains a sent anchor and highlight after a batch and mounts keyboard targets', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<LongHistory last={100} scrollMode="anchor" />);
    rerender(<LongHistory last={200} sent={101} scrollMode="anchor" />);
    expect(offsetInViewport(article('m101') as HTMLElement)).toBe(0);
    expect(article('m150')).toBeNull();
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    rerender(<LongHistory last={200} sent={101} scrollMode="anchor" highlightedMessageId="m150" />);
    expect(article('m150')).toHaveFocus();
    expect(article('m150')).toHaveAttribute('data-highlighted', 'true');
    expect(offsetInViewport(article('m150') as HTMLElement)).toBe(75);
    expect(article('m101')).toBeInTheDocument();
    await user.keyboard('{Home}');
    expect(article('m1')).toHaveFocus();
    expect(article('m150')).toHaveAttribute('data-highlighted', 'true');
    expect(screen.getAllByRole('article').length).toBeLessThan(40);
    await user.keyboard('{End}');
    expect(article('m200')).toHaveFocus();
    expect(distanceToBottom(getViewport())).toBe(0);
  });

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

  it('UIC-CHAT-TRANSCRIPT-1.6 draws spacers in whole pixels from fractional measurements', () => {
    uninstallTranscriptLayout();
    installTranscriptLayout({ viewportHeight: 200, messageHeight: 50.3 });
    const { container } = render(<LongHistory />);
    const spacers = [...container.querySelectorAll<HTMLElement>('.ui-chat-transcript__feed > div')];
    expect(spacers.length).toBeGreaterThan(0);
    for (const spacer of spacers) {
      expect(Number.isInteger(Number.parseFloat(spacer.style.height))).toBe(true);
    }
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

  it('UIC-CHAT-TRANSCRIPT-1.6 UIC-CHAT-TRANSCRIPT-3.7 tells separators it never mounted from messages', async () => {
    const user = userEvent.setup();
    const { container } = render(<Days firstUnreadId="m101" />);
    expect(container.querySelector('.ui-chat-transcript__unread')).toHaveTextContent('200 unread');
    const newest = article('m300') as HTMLElement;
    expect(newest).toHaveAttribute('aria-posinset', '300');
    expect(newest).toHaveAttribute('aria-setsize', '300');
    act(() => newest.focus());
    await user.keyboard('{Home}');
    expect(article('m1')).toHaveFocus();
    expect(getViewport().scrollTop).toBe(0);
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
