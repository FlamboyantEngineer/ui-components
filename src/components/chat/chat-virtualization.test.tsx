import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { message, renderChat } from '../../../test/chat-fixtures.js';
import { installEditorDom } from '../../../test/rich-text-fixtures.js';
import {
  installTranscriptLayout,
  uninstallTranscriptLayout,
} from '../../../test/transcript-layout-fixtures.js';

installEditorDom();

beforeEach(() => {
  installTranscriptLayout({ viewportHeight: 200, messageHeight: 50 });
});

afterEach(() => {
  uninstallTranscriptLayout();
});

/** A conversation of `count` messages, alternating between two people. */
const history = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    message(`m${index + 1}`, index % 2 === 0 ? 'ana' : 'sam'),
  );

const transcript = (container: HTMLElement) =>
  container.querySelector('.ui-chat-transcript') as HTMLElement;

describe('Chat virtualization', () => {
  it('UIC-CHAT-1.7 mounts only the messages near the view of a long conversation', () => {
    const { container } = renderChat({ messages: history(300) });
    expect(transcript(container)).toHaveAttribute('data-virtualized', 'true');
    expect(container.querySelectorAll('article').length).toBeLessThan(40);
  });

  it('UIC-CHAT-1.7 keeps every message mounted where the host turns virtualization off', () => {
    // Sixty messages: more than a window holds, and few enough to mount within the test's time.
    const { container, rerenderWith } = renderChat({ messages: history(60), virtualized: false });
    expect(transcript(container)).not.toHaveAttribute('data-virtualized');
    expect(container.querySelectorAll('article')).toHaveLength(60);
    rerenderWith({ messages: history(60) });
    expect(transcript(container)).toHaveAttribute('data-virtualized', 'true');
    expect(container.querySelectorAll('article').length).toBeLessThan(40);
  });
});
