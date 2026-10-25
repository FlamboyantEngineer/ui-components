import { act, render, screen } from '@testing-library/react';
import { Fragment } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  getViewport,
  installTranscriptLayout,
  offsetInViewport,
  scrollViewport,
  uninstallTranscriptLayout,
  type TranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript, type ChatTranscriptProps } from './chat-transcript.js';

let layout: TranscriptLayout;

beforeEach(() => {
  layout = installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

/** Messages `first` to 30. */
function History({ first = 21, ...props }: { first?: number } & ChatTranscriptProps) {
  return (
    <ChatTranscript {...props}>
      {Array.from({ length: 31 - first }, (_, index) => (
        <ChatMessage key={first + index} id={`m${first + index}`}>
          Message {first + index}
        </ChatMessage>
      ))}
    </ChatTranscript>
  );
}

const article = (id: string) => document.getElementById(id) as HTMLElement;

describe('ChatTranscript history', () => {
  it('UIC-CHAT-TRANSCRIPT-4.1 asks for older messages once near the top and shows them loading', () => {
    vi.useFakeTimers();
    const onLoadOlder = vi.fn();
    const props = { hasOlder: true, onLoadOlder };
    const { container, rerender } = render(<History {...props} />);
    const viewport = getViewport();
    expect(onLoadOlder).not.toHaveBeenCalled();
    expect(screen.getByRole('feed')).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.ui-chat-transcript__history')).toBeEmptyDOMElement();
    expect(article('m25')).toHaveAttribute('aria-setsize', '-1');
    scrollViewport(viewport, 150);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    scrollViewport(viewport, 100);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    rerender(<History {...props} isLoadingOlder />);
    expect(screen.getByRole('progressbar', { name: 'Loading older messages' })).toBeInTheDocument();
    expect(screen.getByRole('feed')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading older messages');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['history'] });
    rerender(<History {...props} first={11} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('status')).toHaveTextContent('10 older messages loaded');
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    scrollViewport(viewport, 0);
    expect(onLoadOlder).toHaveBeenCalledTimes(2);
    rerender(<History onLoadOlder={onLoadOlder} first={11} />);
    expect(container.querySelector('.ui-chat-transcript__history')).toBeNull();
  });

  it('UIC-CHAT-TRANSCRIPT-4.1 loads from the start when the messages are short, and not without hasOlder', () => {
    const onLoadOlder = vi.fn();
    const { unmount } = render(<History first={29} hasOlder onLoadOlder={onLoadOlder} />);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    unmount();
    render(<History first={29} onLoadOlder={onLoadOlder} />);
    scrollViewport(getViewport(), 0);
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
    expect(article('m30')).toHaveAttribute('aria-setsize', '2');
  });

  it('UIC-CHAT-TRANSCRIPT-4.2 keeps the reader’s place and focus as older messages load', () => {
    const { rerender } = render(<History hasOlder onLoadOlder={() => undefined} />);
    const viewport = getViewport();
    scrollViewport(viewport, 160);
    act(() => article('m24').focus());
    expect(offsetInViewport(article('m24'))).toBe(20);
    rerender(<History hasOlder isLoadingOlder />);
    expect(offsetInViewport(article('m24'))).toBe(20);
    rerender(<History hasOlder first={11} />);
    expect(offsetInViewport(article('m24'))).toBe(20);
    expect(viewport.scrollTop).toBe(660);
    expect(article('m24')).toHaveFocus();
    layout.heights.set('m12', 150);
    rerender(<History hasOlder first={11} />);
    expect(offsetInViewport(article('m24'))).toBe(20);
  });

  it('UIC-CHAT-TRANSCRIPT-4.3 scrolls to the highlighted message, marks it and focuses it', () => {
    const { container, rerender } = render(<History />);
    const viewport = getViewport();
    rerender(<History highlightedMessageId="m23" />);
    expect(article('m23')).toHaveAttribute('data-highlighted', 'true');
    expect(article('m23')).toHaveFocus();
    expect(offsetInViewport(article('m23'))).toBe(75);
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT');
    rerender(<History highlightedMessageId="m28" />);
    expect(article('m23')).not.toHaveAttribute('data-highlighted');
    expect(article('m28')).toHaveAttribute('data-highlighted', 'true');
    expect(article('m28')).toHaveFocus();
    rerender(<History />);
    expect(article('m28')).not.toHaveAttribute('data-highlighted');
    rerender(<History highlightedMessageId="m15" />);
    expect(viewport.scrollTop).toBe(275);
    rerender(<History highlightedMessageId="m15" first={11} />);
    expect(article('m15')).toHaveFocus();
    expect(offsetInViewport(article('m15'))).toBe(75);
  });

  it('UIC-CHAT-TRANSCRIPT-4.3 leaves focus on a control outside, such as a find box', () => {
    const view = (highlighted?: string) => (
      <>
        <input aria-label="Find" />
        <History highlightedMessageId={highlighted} />
      </>
    );
    const { rerender } = render(view());
    const find = screen.getByRole('textbox', { name: 'Find' });
    act(() => find.focus());
    rerender(view('m23'));
    expect(article('m23')).toHaveAttribute('data-highlighted', 'true');
    expect(offsetInViewport(article('m23'))).toBe(75);
    expect(find).toHaveFocus();
  });

  it('UIC-CHAT-TRANSCRIPT-3.7 knows a message by its own id inside a wrapper without a key', () => {
    vi.useFakeTimers();
    const onRead = vi.fn();
    function Wrapped({ messageId }: { messageId: string }) {
      return <ChatMessage id={messageId}>Message {messageId}</ChatMessage>;
    }
    const thread = (highlighted?: string) => (
      <ChatTranscript onRead={onRead} highlightedMessageId={highlighted}>
        {['a', 'b', 'c', 'd', 'e', 'f'].map((name) => (
          <Fragment key={name}>
            <div>Day {name}</div>
            <Wrapped messageId={`w-${name}`} />
          </Fragment>
        ))}
      </ChatTranscript>
    );
    const { rerender } = render(thread());
    act(() => vi.advanceTimersByTime(500));
    expect(onRead).toHaveBeenLastCalledWith('w-f');
    rerender(thread('w-a'));
    expect(article('w-a')).toHaveAttribute('data-highlighted', 'true');
    expect(article('w-a')).toHaveFocus();
  });
});
