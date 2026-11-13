import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessageData } from '../../src/components/chat-parts/index.js';
import { renderChat } from '../../test/chat-fixtures.js';
import { installEditorDom } from '../../test/rich-text-fixtures.js';
import {
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../test/transcript-layout-fixtures.js';
import { nativeMessages, retainChatSnapshot } from './chat-native-samples.js';

installEditorDom();
beforeEach(() => installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 }));
afterEach(() => uninstallTranscriptLayout());

const clone = (messages: readonly ChatMessageData[]) =>
  JSON.parse(JSON.stringify(messages)) as ChatMessageData[];

describe('Immutable JSON transport example', () => {
  it('UIC-CHAT-1.7 retains unchanged snapshots and notices text, tool, streaming, order and deletion changes', () => {
    const original = nativeMessages.slice(-3);
    expect(retainChatSnapshot(original, clone(original))).toBe(original);
    const changed = clone(original).map((message, index) =>
      index === 0
        ? {
            ...message,
            parts: [{ type: 'text' as const, text: 'Edited', status: 'streaming' as const }],
          }
        : message,
    );
    const next = retainChatSnapshot(original, changed);
    expect(next[0]).not.toBe(original[0]);
    expect(next[1]).toBe(original[1]);
    const tool = clone(original).map((message) => ({
      ...message,
      parts: message.parts.map((part) =>
        part.type === 'tool-call' ? { ...part, result: 'Changed result' } : part,
      ),
    }));
    expect(retainChatSnapshot(original, tool)[1]).not.toBe(original[1]);
    expect(retainChatSnapshot(original, clone(original).reverse())).toEqual(
      [...original].reverse(),
    );
    expect(retainChatSnapshot(original, clone(original).slice(1))).toEqual(original.slice(1));
  });

  it(
    'UIC-CHAT-1.5 UIC-CHAT-1.7 renders no historical message while typing or receiving an unchanged 1,002-message snapshot',
    // Mounting a 1,002-message chat takes over two seconds alone, more on a loaded runner.
    { timeout: 15_000 },
    async () => {
      const messages = nativeMessages.map((message) => ({
        ...message,
        parts: [
          ...message.parts,
          { type: 'custom' as const, id: `probe-${message.id}`, name: 'render-probe' },
        ],
      }));
      const renderPart = vi.fn(() => null);
      const { user, container, rerenderWith } = renderChat({ messages, renderPart });
      expect(container.querySelectorAll('article').length).toBeLessThan(40);
      expect(renderPart).toHaveBeenCalled();
      renderPart.mockClear();
      await user.click(screen.getByRole('textbox', { name: 'Message' }));
      await user.keyboard('Keep typing');
      expect(renderPart).not.toHaveBeenCalled();
      rerenderWith({ messages: retainChatSnapshot(messages, clone(messages)), renderPart });
      expect(renderPart).not.toHaveBeenCalled();
    },
  );
});
