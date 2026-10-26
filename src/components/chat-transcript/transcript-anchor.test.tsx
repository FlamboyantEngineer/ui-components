import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  distanceToBottom,
  getViewport,
  installTranscriptLayout,
  offsetInViewport,
  scrollViewport,
  uninstallTranscriptLayout,
  type TranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import {
  ChatMessage,
  ChatTranscript,
  type ChatMessageOrigin,
  type ChatTranscriptScrollMode,
} from './chat-transcript.js';

let layout: TranscriptLayout;

beforeEach(() => {
  layout = installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
});

/** Six messages, then `extra` more: odd ones sent by the reader, even ones received. */
function Chat({
  extra = 0,
  mode = 'anchor',
  streaming = false,
}: {
  extra?: number;
  mode?: ChatTranscriptScrollMode;
  streaming?: boolean;
}) {
  const count = 6 + extra;
  return (
    <ChatTranscript scrollMode={mode}>
      {Array.from({ length: count }, (_, index) => {
        const origin: ChatMessageOrigin = index % 2 === 0 ? 'sent' : 'received';
        const isLast = index === count - 1;
        return (
          <ChatMessage
            key={index}
            id={`m${index + 1}`}
            origin={origin}
            status={isLast && streaming ? 'streaming' : 'complete'}
          >
            Message {index + 1}
          </ChatMessage>
        );
      })}
    </ChatTranscript>
  );
}

const article = (id: string) => document.getElementById(id) as HTMLElement;
const spacer = () => document.querySelector<HTMLElement>('.ui-chat-transcript__spacer');

describe('ChatTranscript anchor mode', () => {
  it('UIC-CHAT-TRANSCRIPT-1.5 keeps the reader’s sent message at the top while the reply fills in', () => {
    const { container, rerender } = render(<Chat />);
    const viewport = getViewport();
    expect(viewport.scrollTop).toBe(100);
    rerender(<Chat extra={1} />);
    expect(offsetInViewport(article('m7'))).toBe(0);
    expect(spacer()).toHaveStyle({ height: '150px' });
    expectHooksMatchSpec(container, 'CHAT-TRANSCRIPT', { slots: ['spacer'] });
    rerender(<Chat extra={2} streaming />);
    expect(offsetInViewport(article('m7'))).toBe(0);
    expect(spacer()).toHaveStyle({ height: '100px' });
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).not.toBeInTheDocument();
    layout.heights.set('m8', 400);
    rerender(<Chat extra={2} streaming />);
    expect(offsetInViewport(article('m7'))).toBe(0);
    expect(spacer()).toHaveStyle({ height: '0px' });
    expect(distanceToBottom(viewport)).toBe(250);
    expect(screen.getByRole('button', { name: 'Jump to latest' })).toBeInTheDocument();
  });

  it('UIC-CHAT-TRANSCRIPT-1.5 stops anchoring once the reader scrolls away, keeping the range', () => {
    const { rerender } = render(<Chat />);
    const viewport = getViewport();
    rerender(<Chat extra={1} />);
    rerender(<Chat extra={2} streaming />);
    scrollViewport(viewport, 280);
    layout.heights.set('m8', 120);
    rerender(<Chat extra={2} streaming />);
    expect(viewport.scrollTop).toBe(280);
    expect(offsetInViewport(article('m7'))).toBe(20);
    expect(spacer()).toHaveStyle({ height: '30px' });
  });

  it('UIC-CHAT-TRANSCRIPT-1.5 keeps a scroll the reader made before its event arrived', () => {
    const { rerender } = render(<Chat />);
    const viewport = getViewport();
    rerender(<Chat extra={1} />);
    rerender(<Chat extra={2} streaming />);
    viewport.scrollTop = 280;
    layout.heights.set('m8', 120);
    rerender(<Chat extra={2} streaming />);
    expect(offsetInViewport(article('m7'))).toBe(20);
  });

  it('UIC-CHAT-TRANSCRIPT-1.5 drops the anchor and the spacer in follow mode', () => {
    const { rerender } = render(<Chat />);
    const viewport = getViewport();
    rerender(<Chat extra={1} />);
    rerender(<Chat extra={1} mode="follow" />);
    expect(spacer()).toBeNull();
    expect(distanceToBottom(viewport)).toBe(0);
    rerender(<Chat extra={2} mode="follow" />);
    expect(distanceToBottom(viewport)).toBe(0);
  });

  it('UIC-CHAT-TRANSCRIPT-1.2 follows again when the reader sends a message while away', () => {
    const { rerender } = render(<Chat mode="follow" />);
    const viewport = getViewport();
    scrollViewport(viewport, 0);
    rerender(<Chat extra={1} mode="follow" />);
    expect(viewport.scrollTop).toBe(150);
  });
});
