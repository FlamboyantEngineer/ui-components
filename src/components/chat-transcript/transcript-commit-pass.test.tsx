import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getViewport,
  installTranscriptLayout,
  resizeContent,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';
import { ChatMessage, ChatTranscript } from './chat-transcript.js';

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 100, messageHeight: 100 });
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.restoreAllMocks();
});

const getNow = () => new Date('2026-04-20T10:30:00');

/** A long conversation whose last reply is still streaming `reply`. */
function Streaming({
  count,
  reply,
  virtualized,
}: {
  count: number;
  reply: string;
  virtualized?: boolean;
}) {
  return (
    <ChatTranscript virtualized={virtualized}>
      {Array.from({ length: count }, (_, index) => (
        <ChatMessage key={index} id={`m${index + 1}`} author={{ name: 'Ana' }} getNow={getNow}>
          Message {index + 1}
        </ChatMessage>
      ))}
      <ChatMessage key="reply" id="reply" status="streaming" getNow={getNow}>
        {reply}
      </ChatMessage>
    </ChatTranscript>
  );
}

describe('ChatTranscript commit pass', () => {
  it.each([false, true])(
    'UIC-CHAT-TRANSCRIPT-1.2 reads no layout for a token-only render (virtualized=%s)',
    (virtualized) => {
      const { rerender } = render(<Streaming count={200} reply="The" virtualized={virtualized} />);
      const viewport = getViewport();
      expect(viewport.scrollTop).toBe(20_000);
      const reads = vi.spyOn(Element.prototype, 'getBoundingClientRect');
      rerender(<Streaming count={200} reply="The orchard" virtualized={virtualized} />);
      rerender(<Streaming count={200} reply="The orchard opens" virtualized={virtualized} />);
      expect(reads).not.toHaveBeenCalled();
      // The content's resize keeps the bottom in view, once per change of size.
      resizeContent();
      expect(reads).toHaveBeenCalled();
      expect(viewport.scrollTop).toBe(20_000);
    },
  );

  it('UIC-CHAT-TRANSCRIPT-1.2 runs the pass again when a message arrives', () => {
    const { rerender } = render(<Streaming count={3} reply="The" />);
    const viewport = getViewport();
    rerender(<Streaming count={4} reply="The" />);
    expect(viewport.scrollTop).toBe(400);
  });
});
