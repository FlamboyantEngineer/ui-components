import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { cloneElement, createRef } from 'react';
import { userEvent } from '@testing-library/user-event';
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
  installTranscriptLayout({ viewportHeight: 100, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

const ana = { name: 'Ana Lima' };

function KeyboardConversation({ onEscape }: { onEscape?: () => void }) {
  return (
    <>
      <button type="button">Before</button>
      <ChatTranscript onEscape={onEscape}>
        <ChatMessage id="m1" author={ana}>
          First
        </ChatMessage>
        <p>Today</p>
        <ChatMessage id="m2" author={ana} actions={<button type="button">Copy second</button>}>
          Second, with <a href="#notes">notes</a>
        </ChatMessage>
        <ChatMessage id="m3" author={ana}>
          Third
        </ChatMessage>
      </ChatTranscript>
      <input aria-label="Composer" />
    </>
  );
}

const message = (name: string) =>
  screen
    .getAllByRole('article')
    .find((article) => article.textContent?.includes(name)) as HTMLElement;

describe('ChatTranscript keyboard', () => {
  it('UIC-CHAT-TRANSCRIPT-3.1 UIC-CHAT-TRANSCRIPT-3.7 is one tab stop entered at the newest message', async () => {
    const user = userEvent.setup();
    const { container } = render(<KeyboardConversation />);
    expect(message('Third')).toHaveAttribute('tabindex', '0');
    expect(message('First')).toHaveAttribute('tabindex', '-1');
    expect(message('Second')).toHaveAttribute('aria-posinset', '2');
    expect(message('Second')).toHaveAttribute('aria-setsize', '3');
    expect(screen.getByRole('button', { name: 'Copy second' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('link', { name: 'notes' })).toHaveAttribute('tabindex', '-1');
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['feed'] });
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(message('Third')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Composer' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(message('Third')).toHaveFocus();
  });

  it('UIC-CHAT-TRANSCRIPT-3.1 keeps the tab stop on the focused message until focus leaves', async () => {
    const user = userEvent.setup();
    render(<KeyboardConversation />);
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    await user.keyboard('{ArrowUp}');
    expect(message('Second')).toHaveAttribute('tabindex', '0');
    expect(message('Third')).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Composer' })).toHaveFocus();
    expect(message('Third')).toHaveAttribute('tabindex', '0');
    expect(message('Second')).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-CHAT-TRANSCRIPT-3.2 moves between messages with the arrows, Home and End', async () => {
    const user = userEvent.setup();
    render(<KeyboardConversation />);
    const viewport = getViewport();
    act(() => message('Third').focus());
    await user.keyboard('{ArrowUp}');
    expect(message('Second')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(message('First')).toHaveFocus();
    expect(offsetInViewport(message('First'))).toBe(0);
    await user.keyboard('{ArrowUp}');
    expect(message('First')).toHaveFocus();
    await user.keyboard('{End}');
    expect(message('Third')).toHaveFocus();
    expect(viewport.scrollTop).toBe(70);
    await user.keyboard('{Home}');
    expect(message('First')).toHaveFocus();
    expect(viewport.scrollTop).toBe(0);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(message('Third')).toHaveFocus();
    await user.keyboard('{Control>}{ArrowUp}{/Control}');
    expect(message('Third')).toHaveFocus();
  });

  it('UIC-CHAT-TRANSCRIPT-3.2 brings a separator before the first message into view with Home', async () => {
    const user = userEvent.setup();
    render(
      <ChatTranscript>
        <p>Monday</p>
        <ChatMessage id="m1">First</ChatMessage>
        <ChatMessage id="m2">Second</ChatMessage>
        <ChatMessage id="m3">Third</ChatMessage>
      </ChatTranscript>,
    );
    const viewport = getViewport();
    act(() => message('Third').focus());
    expect(viewport.scrollTop).toBe(70);
    await user.keyboard('{Home}');
    expect(message('First')).toHaveFocus();
    expect(viewport.scrollTop).toBe(0);
    expect(offsetInViewport(message('First'))).toBe(20);
  });

  it('UIC-CHAT-TRANSCRIPT-3.3 enters a message with Enter, cycles its controls and leaves with Escape', async () => {
    const user = userEvent.setup();
    render(<KeyboardConversation />);
    act(() => message('Second').focus());
    await user.keyboard('{Enter}');
    const link = screen.getByRole('link', { name: 'notes' });
    const copy = screen.getByRole('button', { name: 'Copy second' });
    expect(link).toHaveFocus();
    expect(link).not.toHaveAttribute('tabindex');
    expect(copy).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(copy).toHaveFocus();
    await user.tab();
    expect(link).toHaveFocus();
    await user.tab({ shift: true });
    expect(copy).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(message('Second')).toHaveFocus();
    expect(copy).toHaveAttribute('tabindex', '-1');
    expect(link).toHaveAttribute('tabindex', '-1');
  });

  it('UIC-CHAT-TRANSCRIPT-3.3 leaves a composing Escape in a field inside a message to the input method', async () => {
    const user = userEvent.setup();
    render(
      <ChatTranscript>
        <ChatMessage id="m1" author={ana} actions={<input aria-label="Reason" />}>
          First
        </ChatMessage>
      </ChatTranscript>,
    );
    const field = screen.getByRole('textbox', { name: 'Reason' });
    act(() => field.focus());
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(field, { key: 'Escape', isComposing: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set keyCode on a keydown
    fireEvent.keyDown(field, { key: 'Escape', keyCode: 229 });
    expect(field).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(message('First')).toHaveFocus();
  });

  it('UIC-CHAT-TRANSCRIPT-3.3 keeps focus on a message without controls and enters on a click', async () => {
    const user = userEvent.setup();
    render(<KeyboardConversation />);
    act(() => message('Third').focus());
    await user.keyboard('{Enter}');
    expect(message('Third')).toHaveFocus();
    const copy = screen.getByRole('button', { name: 'Copy second' });
    await user.click(copy);
    expect(copy).toHaveFocus();
    expect(copy).not.toHaveAttribute('tabindex');
    expect(message('Second')).toHaveAttribute('tabindex', '0');
    await user.tab();
    expect(screen.getByRole('link', { name: 'notes' })).toHaveFocus();
  });

  it('UIC-CHAT-TRANSCRIPT-3.1 takes controls that render later out of the tab order', async () => {
    const { rerender } = render(
      <ChatTranscript>
        <ChatMessage id="m1">First</ChatMessage>
      </ChatTranscript>,
    );
    rerender(
      <ChatTranscript>
        <ChatMessage id="m1" actions={<button type="button">Retry</button>}>
          First
        </ChatMessage>
      </ChatTranscript>,
    );
    const retry = screen.getByRole('button', { name: 'Retry' });
    await vi.waitFor(() => expect(retry).toHaveAttribute('tabindex', '-1'));
  });

  it('UIC-CHAT-TRANSCRIPT-3.4 calls onEscape on Escape from a message, which goes no further', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    const onOuterKey = vi.fn();
    render(
      <div onKeyDown={(event) => onOuterKey(event.key)}>
        <KeyboardConversation onEscape={onEscape} />
      </div>,
    );
    act(() => message('Second').focus());
    await user.keyboard('{Enter}{Escape}');
    expect(onEscape).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onOuterKey).not.toHaveBeenCalledWith('Escape');
  });

  it('UIC-CHAT-TRANSCRIPT-3.4 leaves Escape to the page without onEscape', async () => {
    const user = userEvent.setup();
    const onOuterKey = vi.fn();
    render(
      <div onKeyDown={(event) => onOuterKey(event.key)}>
        <KeyboardConversation />
      </div>,
    );
    act(() => message('Third').focus());
    await user.keyboard('{Escape}');
    expect(onOuterKey).toHaveBeenCalledWith('Escape');
  });

  it('UIC-CHAT-TRANSCRIPT-3.5 focuses the message at the top once native paging scrolled', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ChatTranscript>
        {Array.from({ length: 8 }, (_, index) => (
          <ChatMessage key={index} id={`m${index + 1}`}>
            Message {index + 1}
          </ChatMessage>
        ))}
      </ChatTranscript>,
    );
    const viewport = getViewport();
    const feed = screen.getByRole('feed');
    const last = within(feed).getByText('Message 8').closest('article') as HTMLElement;
    act(() => last.focus());
    await user.keyboard('{PageUp}');
    scrollViewport(viewport, 120);
    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(last).toHaveFocus();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(within(feed).getByText('Message 4').closest('article')).toHaveFocus();
    expect(viewport.scrollTop).toBe(120);
  });

  it('UIC-CHAT-TRANSCRIPT-3.7 keeps the ref a wrapper gives the message', () => {
    const ref = createRef<HTMLElement>();
    // A wrapper such as the actions menu clones the message with its own ref.
    const message = cloneElement(<ChatMessage id="m1">Hello</ChatMessage>, { ref } as object);
    render(<ChatTranscript>{message}</ChatTranscript>);
    expect(ref.current).toBe(screen.getByRole('article'));
    expect(ref.current).toHaveAttribute('tabindex', '0');
  });
});
