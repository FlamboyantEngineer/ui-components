import {
  isTranscriptMessage,
  resolveMessageKey,
  type TranscriptRuntime,
} from './transcript-runtime.js';

/** A render's children: their keys in order, each one's index, and the keys known to be parts. */
export interface TranscriptKeys {
  keys: string[];
  indexOf: ReadonlyMap<string, number>;
  parts: ReadonlySet<string>;
}

/** The part right before the message focus waits for: a separator comes into view with it. */
function findPartBefore(
  runtime: TranscriptRuntime,
  { keys, indexOf, parts }: TranscriptKeys,
  key: string | undefined,
) {
  const index = key === undefined ? undefined : indexOf.get(key);
  const previous = index === undefined ? undefined : keys[index - 1];
  const isPart = previous !== undefined && !isTranscriptMessage(runtime, previous, parts);
  return isPart ? previous : undefined;
}

/** The children a virtualized transcript keeps mounted wherever its window is. */
export function collectForced(
  runtime: TranscriptRuntime,
  children: TranscriptKeys,
  { arrivals, highlight }: { arrivals: readonly string[]; highlight: string | undefined },
) {
  const pending = runtime.pendingFocus?.key;
  return [
    runtime.activeKey,
    pending,
    findPartBefore(runtime, children, pending),
    runtime.keeper.anchorKey(),
    runtime.keeper.snapshot()?.key,
    runtime.registry.view.get().tabStopKey,
    highlight,
    ...children.keys.slice(-2),
    ...runtime.streaming,
    ...arrivals,
  ];
}

/** How many messages there are from the first unread one to the end, read from there on. */
export function countUnread(
  runtime: TranscriptRuntime,
  { keys, indexOf, parts }: TranscriptKeys,
  firstUnreadId?: string,
) {
  const key = resolveMessageKey(runtime, firstUnreadId);
  const start = key === undefined ? undefined : indexOf.get(key);
  if (start === undefined) return 0;
  let count = 0;
  for (let index = start; index < keys.length; index += 1) {
    if (isTranscriptMessage(runtime, keys[index] as string, parts)) count += 1;
  }
  return count;
}
