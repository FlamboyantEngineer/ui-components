import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { ChatDateSeparator } from './chat-date-separator.js';
import { ChatTypingIndicator } from './chat-typing-indicator.js';
import { ChatUnreadDivider } from './chat-unread-divider.js';

/** One child of the transcript: a message, or a part between messages such as a separator. */
export interface TranscriptItem {
  /** The child's `id`, else its React key, else its position: how the transcript finds it. */
  key: string;
  node: ReactNode;
  /**
   * The child is one of the family's parts between messages (a date separator, the unread divider,
   * the typing indicator), so it is known not to be a message before it ever mounts.
   */
  isPart: boolean;
}

/** What changed in the children since the last commit. */
export interface TranscriptChange {
  /** No message survived (or nothing was there before the first commit): a fresh conversation. */
  isReset: boolean;
  /** Keys added after the first surviving message: what arrived. */
  arrivals: string[];
  /** Keys added before the first surviving message: older history. */
  older: string[];
}

/** The family's components that sit between messages. */
const partTypes: ReadonlySet<unknown> = new Set([
  ChatDateSeparator,
  ChatUnreadDivider,
  ChatTypingIndicator,
]);

/** The child's own key: its `id` prop, else its React key, else its position. */
function readKey(child: ReactNode, index: number): string {
  if (!isValidElement(child)) return `#${index}`;
  const { id } = child.props as { id?: unknown };
  if (typeof id === 'string' && id !== '') return id;
  return child.key ?? `#${index}`;
}

/** Adds the children to `items`, flattening fragments so each child draws one element. */
function collectInto(children: ReactNode, items: TranscriptItem[], used: Set<string>) {
  Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (isValidElement(child) && child.type === Fragment) {
      collectInto((child.props as { children?: ReactNode }).children, items, used);
      return;
    }
    let key = readKey(child, items.length);
    // A repeated key keeps the first child's identity; later ones are told apart by position.
    if (used.has(key)) key = `${key}#${items.length}`;
    used.add(key);
    items.push({ key, node: child, isPart: isValidElement(child) && partTypes.has(child.type) });
  });
}

/** The transcript's children, flattened, each with a key unique among them. */
export function collectTranscriptItems(children: ReactNode): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  collectInto(children, items, new Set());
  return items;
}

/**
 * Sorts the keys that are new since `previous` into arrivals and older history, around the first
 * message that survived. A part that survived (`isPart`), such as the separator of a day both
 * lists share, places nothing: history loaded under it is still older history, and a list that
 * kept only its parts shows another conversation.
 */
export function diffTranscriptKeys(
  previous: readonly string[] | null,
  next: readonly string[],
  isPart: (key: string) => boolean = () => false,
): TranscriptChange {
  if (previous === null) return { isReset: true, arrivals: [], older: [] };
  const before = new Set(previous);
  const isNew = (key: string) => !before.has(key);
  // Nothing but parts came before, so there was no conversation to replace: what is new arrived.
  if (previous.every(isPart)) return { isReset: false, arrivals: next.filter(isNew), older: [] };
  const firstSurvivor = next.findIndex((key) => before.has(key) && !isPart(key));
  if (firstSurvivor === -1) return { isReset: true, arrivals: [], older: [] };
  return {
    isReset: false,
    arrivals: next.slice(firstSurvivor + 1).filter(isNew),
    older: next.slice(0, firstSurvivor).filter(isNew),
  };
}
