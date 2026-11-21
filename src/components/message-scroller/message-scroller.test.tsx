import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  distanceToBottom,
  installTranscriptLayout,
  offsetInViewport,
  resizeContent,
  scrollViewport,
  type TranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { Message } from '../message/message.js';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  type MessageScrollerDefaultScrollPosition,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './index.js';

let layout: TranscriptLayout;

beforeEach(() => {
  layout = installTranscriptLayout();
});
afterEach(uninstallTranscriptLayout);

interface ConversationProps {
  ids?: string[] | undefined;
  anchor?: string | undefined;
  streaming?: string | undefined;
  autoScroll?: boolean | undefined;
  position?: MessageScrollerDefaultScrollPosition | undefined;
  isBusy?: boolean | undefined;
}

const history = ['A', 'B', 'C', 'D', 'E', 'F'];
const turn = [...history, 'Prompt', 'Reply'];

function Conversation({
  ids = history,
  anchor,
  streaming,
  position,
  isBusy,
  autoScroll = true,
}: ConversationProps) {
  return (
    <MessageScrollerProvider autoScroll={autoScroll} defaultScrollPosition={position}>
      <MessageScroller>
        <MessageScrollerViewport aria-label="Thread">
          <MessageScrollerContent aria-label="Messages">
            {ids.map((id) => (
              <MessageScrollerItem
                key={id}
                messageId={id}
                scrollAnchor={anchor === id}
                isStreaming={streaming === id}
                aria-busy={streaming === id ? isBusy : undefined}
              >
                <Message aria-label={id} id={id}>
                  {id}
                </Message>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="start">First message</MessageScrollerButton>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

const viewport = () => screen.getByRole('region', { name: 'Thread' });
const message = (name: string) => screen.getByRole('article', { name });

describe('MessageScroller', () => {
  it('UIC-MESSAGE-SCROLLER-1.1 exposes a keyboard-scrollable region with a semantic log', () => {
    const { container } = render(<Conversation />);
    expect(viewport()).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('log', { name: 'Messages' })).toHaveAttribute('aria-live', 'off');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expectHooksMatchSpec(container, 'MESSAGE-SCROLLER', { slots: 'all' });
  });

  it('UIC-MESSAGE-SCROLLER-2.1 holds the prompt at the top, then follows after the reply fills the reserve', async () => {
    const { rerender } = render(<Conversation />);
    expect(viewport().scrollTop).toBe(100);
    rerender(<Conversation ids={turn} anchor="Prompt" streaming="Reply" />);
    await waitFor(() => expect(offsetInViewport(message('Prompt'))).toBe(0));
    expect(distanceToBottom(viewport())).toBe(0);

    layout.heights.set('Reply', 140);
    resizeContent();
    expect(offsetInViewport(message('Prompt'))).toBe(0);
    layout.heights.set('Reply', 250);
    resizeContent();
    expect(distanceToBottom(viewport())).toBe(0);
    expect(offsetInViewport(message('Prompt'))).toBe(-100);

    layout.heights.set('Reply', 300);
    resizeContent();
    expect(offsetInViewport(message('Prompt'))).toBe(-150);
  });

  it('UIC-MESSAGE-SCROLLER-2.1 respects a one-pixel reader scroll before its event arrives', () => {
    render(<Conversation ids={turn} anchor="Prompt" position="last-anchor" />);
    viewport().scrollTop -= 1;
    layout.heights.set('Reply', 250);
    resizeContent();
    expect(offsetInViewport(message('Prompt'))).toBe(1);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
  });

  it('UIC-MESSAGE-SCROLLER-2.1 holds an explicit anchor with following disabled', async () => {
    const { rerender } = render(<Conversation autoScroll={false} />);
    rerender(<Conversation ids={turn} anchor="Prompt" autoScroll={false} />);
    await waitFor(() => expect(offsetInViewport(message('Prompt'))).toBe(0));
    layout.heights.set('Reply', 300);
    resizeContent();
    expect(offsetInViewport(message('Prompt'))).toBe(0);
    expect(distanceToBottom(viewport())).toBe(150);
  });

  it('UIC-MESSAGE-SCROLLER-2.2 preserves a reader scroll and prepended history, then jumps immediately on activation', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Conversation ids={turn} anchor="Prompt" position="last-anchor" />);
    expect(offsetInViewport(message('Prompt'))).toBe(0);
    scrollViewport(viewport(), viewport().scrollTop - 40);
    expect(offsetInViewport(message('Prompt'))).toBe(40);

    layout.heights.set('Reply', 260);
    resizeContent();
    expect(offsetInViewport(message('Prompt'))).toBe(40);

    rerender(<Conversation ids={['Older', ...turn]} anchor="Prompt" position="last-anchor" />);
    await waitFor(() => expect(offsetInViewport(message('Prompt'))).toBe(40));
    const jump = screen.getByRole('button', { name: 'Jump to latest' });
    jump.focus();
    await user.keyboard('{Enter}');
    expect(distanceToBottom(viewport())).toBe(0);
    expect(viewport()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'First message' }));
    expect(viewport().scrollTop).toBe(0);
  });

  it('UIC-MESSAGE-SCROLLER-2.2 opens from the start when requested', () => {
    render(<Conversation position="start" />);
    expect(viewport().scrollTop).toBe(0);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
  });

  it('UIC-MESSAGE-SCROLLER-1.2 announces a streaming append only on completion and stays quiet for old history', async () => {
    const { rerender } = render(<Conversation />);
    const status = screen.getByRole('status');
    rerender(<Conversation ids={['Older', ...history, 'Reply']} streaming="Reply" />);
    await waitFor(() =>
      expect(message('Reply').parentElement).toHaveAttribute('aria-busy', 'true'),
    );
    expect(status).toBeEmptyDOMElement();
    rerender(<Conversation ids={['Older', ...history, 'Reply']} />);
    await waitFor(() => expect(status).toHaveTextContent('1 new message'));
    expect(message('Reply').parentElement).not.toHaveAttribute('aria-busy', 'true');
  });

  it('UIC-MESSAGE-SCROLLER-1.2 leaves a busy override intact without announcing an unfinished reply', async () => {
    const { rerender } = render(<Conversation />);
    rerender(<Conversation ids={turn} streaming="Reply" isBusy={false} />);
    const status = screen.getByRole('status');
    await waitFor(() => expect(status).toHaveTextContent('1 new message'));
    expect(message('Reply').parentElement).toHaveAttribute('aria-busy', 'false');
  });

  it('UIC-MESSAGE-SCROLLER-1.2 announces an already completed row appended to an empty thread', async () => {
    const { rerender } = render(<Conversation ids={[]} />);
    rerender(<Conversation ids={['First']} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 new message'));
  });
});
