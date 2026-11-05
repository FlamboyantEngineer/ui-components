// The Chat Message Actions lab's emoji options: a message whose React command, from the bar or the
// context menu, opens a picker with the host's custom emoji, recent emoji and emoji loader.

import { useMemo, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { ChatMessageActionsMenu } from '../../src/components/chat-message-actions/chat-message-actions.js';
import { ChatMessage, ChatTranscript } from '../../src/components/chat-transcript/index.js';
import {
  type CustomEmoji,
  loadEmojiData,
  type NativeEmoji,
} from '../../src/components/emoji-picker/index.js';
import { LabOutput } from './lab-output.js';

function badge(text: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="${ground}"/><text x="16" y="21" font-size="13" font-family="sans-serif" text-anchor="middle" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Inline images, so the lab makes no network request. */
const customEmoji: CustomEmoji[] = [
  { shortcode: 'on_my_way', src: badge('GO', '#15803d'), label: 'On my way', keywords: ['leave'] },
  { shortcode: 'see_you', src: badge('HI', '#1d4ed8'), label: 'See you', keywords: ['meet'] },
];

const loaderModes = ['bundled', 'slow', 'fails once'] as const;
type LoaderMode = (typeof loaderModes)[number];

/** How long the slow loader waits before it hands over the bundled emoji. */
const slowDelay = 3000;

/**
 * The emoji loader of a mode, counting its calls: the bundled set at once, after a pause, or a
 * failure on its first call and the bundled set on every call after, so reopening the picker
 * recovers.
 */
function useLoader(mode: LoaderMode) {
  const [attempts, setAttempts] = useState(0);
  const calls = useRef(0);
  const loadEmoji = useMemo(
    () => (): Promise<readonly NativeEmoji[]> => {
      calls.current += 1;
      setAttempts(calls.current);
      if (mode === 'slow') {
        return new Promise((resolve) => {
          window.setTimeout(() => resolve(loadEmojiData()), slowDelay);
        });
      }
      if (mode === 'fails once' && calls.current === 1) {
        return Promise.reject(new Error('The emoji could not be fetched'));
      }
      return loadEmojiData();
    },
    [mode],
  );
  /** Starts the count over, for another loader. */
  const reset = () => {
    calls.current = 0;
    setAttempts(0);
  };
  return { loadEmoji, attempts, reset };
}

/**
 * One message whose React command offers the host's custom emoji and keeps its recent emoji, from
 * the bar and the context menu alike, with a loader to switch between bundled, slow and failing.
 */
export function EmojiOptionsDemo() {
  const [mode, setMode] = useState<LoaderMode>('bundled');
  const [recent, setRecent] = useState<readonly string[]>(['🚆']);
  const [reacted, setReacted] = useState('nothing');
  const { loadEmoji, attempts, reset } = useLoader(mode);
  return (
    <div data-lab-demo="emoji-options">
      <div role="group" aria-label="Emoji loader">
        {loaderModes.map((option) => (
          <Button
            key={option}
            size="sm"
            onPress={() => {
              reset();
              setMode(option);
            }}
          >
            {`Load ${option}`}
          </Button>
        ))}
      </div>
      <div style={{ height: 200 }}>
        <ChatTranscript aria-label="Meeting at the station">
          <ChatMessageActionsMenu
            copyText="Meet at the station at eight."
            onReact={setReacted}
            customEmoji={customEmoji}
            recentEmoji={recent}
            onRecentEmojiChange={setRecent}
            loadEmoji={mode === 'bundled' ? undefined : loadEmoji}
          >
            {(actions) => (
              <ChatMessage
                origin="received"
                author={{ name: 'Ana Lopez', colorKey: 'ana' }}
                actions={actions}
                data-lab-message="emoji"
              >
                Meet at the station at eight.
              </ChatMessage>
            )}
          </ChatMessageActionsMenu>
        </ChatTranscript>
      </div>
      <LabOutput name="loader">{mode}</LabOutput>
      <LabOutput name="reacted">{reacted}</LabOutput>
      <LabOutput name="recent">{recent.join(' ')}</LabOutput>
      <LabOutput name="load attempts">{attempts}</LabOutput>
    </div>
  );
}
