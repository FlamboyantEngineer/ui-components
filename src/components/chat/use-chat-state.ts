import { useCallback, useMemo, useRef, useState, type RefCallback, type RefObject } from 'react';

/** What the composer edits instead of a new message: one of the reader's messages, or a queued one. */
export interface ChatEditing {
  kind: 'message' | 'queued';
  id: string;
}

/** The chat's own state about one conversation. */
interface ChatOwnState {
  conversationId: string | undefined;
  editing: ChatEditing | null;
  replyingId: string | null;
  /** The message a quote jumped to. */
  jumpedId: string | undefined;
  /** The reader's open and closed choices of each message's parts, by message id. */
  expanded: Readonly<Record<string, Readonly<Record<string, boolean>>>>;
}

/** The chat's state and the stable commands that change it. */
export interface ChatState extends Omit<ChatOwnState, 'conversationId'> {
  /** The composer's text box, kept while the composer is mounted. */
  composerRef: RefObject<HTMLDivElement | null>;
  /** The composer's ref, which records its text box. */
  setComposer: RefCallback<HTMLDivElement>;
  startEdit: (editing: ChatEditing) => void;
  cancelEdit: () => void;
  startReply: (messageId: string) => void;
  cancelReply: () => void;
  jumpTo: (messageId: string) => void;
  setExpandedParts: (messageId: string, expanded: Record<string, boolean>) => void;
  focusComposer: () => void;
}

function createState(conversationId: string | undefined): ChatOwnState {
  return { conversationId, editing: null, replyingId: null, jumpedId: undefined, expanded: {} };
}

/**
 * The editing, replying, quote jump and expansion state of a chat, which starts over when the
 * conversation changes. The commands keep their identities, so the messages need not re-render.
 */
export function useChatState(conversationId: string | undefined): ChatState {
  const [own, setOwn] = useState(() => createState(conversationId));
  const composerRef = useRef<HTMLDivElement>(null);
  // The editor detaches and reattaches its ref on each render, after the layout effects of the
  // queue above it; keeping the last text box lets those effects still find it.
  const setComposer = useCallback((element: HTMLDivElement | null) => {
    if (element) composerRef.current = element;
  }, []);
  let current = own;
  if (own.conversationId !== conversationId) {
    current = createState(conversationId);
    setOwn(current);
  }
  // Focus moves once overlays that pressed a command, such as a context menu, have handed it back.
  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => composerRef.current?.focus()));
  }, []);
  const commands = useMemo(() => {
    const update = (patch: Partial<ChatOwnState>) => setOwn((state) => ({ ...state, ...patch }));
    return {
      startEdit: (editing: ChatEditing) => {
        update({ editing, replyingId: null });
        focusComposer();
      },
      cancelEdit: () => update({ editing: null }),
      startReply: (replyingId: string) => {
        update({ replyingId, editing: null });
        focusComposer();
      },
      cancelReply: () => update({ replyingId: null }),
      jumpTo: (jumpedId: string) => update({ jumpedId }),
      setExpandedParts: (messageId: string, parts: Record<string, boolean>) =>
        setOwn((state) => ({ ...state, expanded: { ...state.expanded, [messageId]: parts } })),
    };
  }, [focusComposer]);
  const { conversationId: _scope, ...state } = current;
  return { ...state, ...commands, composerRef, setComposer, focusComposer };
}
