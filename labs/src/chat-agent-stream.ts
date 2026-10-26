// Timing helpers for the Chat lab's fake agent: pauses that Stop interrupts, and streamed text.

import type { ChatStreamEvent } from '../../src/components/chat-controller/index.js';

const pause = Number(new URLSearchParams(window.location.search).get('pause'));

/** How long the agent pauses between chunks, in milliseconds; `?pause=` in the URL changes it. */
export const agentTiming = { word: pause > 0 ? pause : 60 };

/** Waits `ms`, or rejects when the reader stops the reply. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** Streams `text` a few characters at a time, as a model does. */
export async function* streamText(text: string, signal: AbortSignal) {
  for (const chunk of text.match(/.{1,6}/gs) ?? []) {
    await sleep(agentTiming.word, signal);
    yield { type: 'text-delta', text: chunk } satisfies ChatStreamEvent;
  }
}
