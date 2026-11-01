import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript, type ChatTranscriptProps } from './chat-transcript.js';

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
  vi.useFakeTimers();
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

/** A short conversation that fits in view: a date separator, then its messages. */
function Conversation({
  ids,
  date,
  ...props
}: { ids: string[]; date: string } & ChatTranscriptProps) {
  return (
    <ChatTranscript hasOlder {...props}>
      <div key={`date-${date}`}>{date}</div>
      {ids.map((id) => (
        <ChatMessage key={id} id={id}>
          Message {id}
        </ChatMessage>
      ))}
    </ChatTranscript>
  );
}

const settle = () =>
  act(() => {
    vi.advanceTimersByTime(1000);
  });

function callbacks() {
  return { onLoadOlder: vi.fn(), onRead: vi.fn<(id: string) => void>() };
}

describe('ChatTranscript conversations', () => {
  it.each([
    ['shared ids and date', ['m1', 'm2'], 'Monday'],
    ['shared date, other ids', ['n1', 'n2'], 'Monday'],
    ['other ids and date', ['n1', 'n2'], 'Tuesday'],
  ])(
    'UIC-CHAT-TRANSCRIPT-3.7 UIC-CHAT-TRANSCRIPT-4.1 starts over for another conversationId with %s',
    (_, ids, date) => {
      const a = callbacks();
      const b = callbacks();
      const { rerender } = render(
        <Conversation conversationId="a" ids={['m1', 'm2']} date="Monday" {...a} />,
      );
      expect(a.onLoadOlder).toHaveBeenCalledTimes(1);
      rerender(<Conversation conversationId="b" ids={ids} date={date} {...b} />);
      settle();
      expect(b.onLoadOlder).toHaveBeenCalledTimes(1);
      expect(b.onRead).toHaveBeenLastCalledWith(ids.at(-1));
      // A's pending read report was the old conversation's, so it never arrives.
      expect(a.onRead).not.toHaveBeenCalled();
      expect(a.onLoadOlder).toHaveBeenCalledTimes(1);
    },
  );

  it('UIC-CHAT-TRANSCRIPT-3.7 UIC-CHAT-TRANSCRIPT-4.1 keeps its paging and read state through updates of one conversation', () => {
    const a = callbacks();
    const { rerender } = render(
      <Conversation conversationId="a" ids={['m1', 'm2']} date="Monday" {...a} />,
    );
    settle();
    expect(a.onLoadOlder).toHaveBeenCalledTimes(1);
    expect(a.onRead).toHaveBeenCalledExactlyOnceWith('m2');
    rerender(<Conversation conversationId="a" ids={['m1', 'm2', 'm3']} date="Monday" {...a} />);
    settle();
    expect(a.onLoadOlder).toHaveBeenCalledTimes(1);
    expect(a.onRead).toHaveBeenLastCalledWith('m3');
  });

  it('UIC-CHAT-TRANSCRIPT-3.7 UIC-CHAT-TRANSCRIPT-4.1 asks for older messages again when all its messages are replaced, without a conversationId', () => {
    const a = callbacks();
    const { rerender } = render(<Conversation ids={['m1', 'm2']} date="Monday" {...a} />);
    expect(a.onLoadOlder).toHaveBeenCalledTimes(1);
    rerender(<Conversation ids={['n1', 'n2']} date="Tuesday" {...a} />);
    settle();
    expect(a.onLoadOlder).toHaveBeenCalledTimes(2);
  });
});
