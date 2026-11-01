import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import {
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';

installEditorDom();

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  uninstallTranscriptLayout();
  vi.useRealTimers();
});

describe('Chat conversation switch', () => {
  it('UIC-CHAT-1.1 starts the transcript over for another conversation with the same message ids', () => {
    const messages = [message('m1', 'ana'), message('m2', 'sam')];
    const a = { onLoadOlder: vi.fn(), onRead: vi.fn() };
    const b = { onLoadOlder: vi.fn(), onRead: vi.fn() };
    const { rerenderWith } = renderChat({ conversationId: 'a', messages, hasOlder: true, ...a });
    expect(a.onLoadOlder).toHaveBeenCalledTimes(1);
    rerenderWith({ conversationId: 'b', messages, hasOlder: true, ...b });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(b.onLoadOlder).toHaveBeenCalledTimes(1);
    expect(b.onRead).toHaveBeenLastCalledWith('m2');
    expect(a.onRead).not.toHaveBeenCalled();
  });
});
