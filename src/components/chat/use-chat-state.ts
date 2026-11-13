'use client';

import {
  type RefCallback,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getOwnerWindow } from '../../utils/owner-window.js';

/** What the composer edits instead of a new message: one of the reader's messages, or a queued one. */
interface ChatEditing {
  kind: 'message' | 'queued';
  id: string;
}

/** The chat's own state about one conversation. */
interface ChatOwnState {
  conversationId: string | undefined;
  /**
   * Counts each edit or reply the reader starts or leaves, across conversations too, so a late
   * acceptance ends only its own: a conversation shown again never reuses an earlier session.
   */
  session: number;
  editing: ChatEditing | null;
  replyingId: string | null;
  /** The message a quote jumped to, a new object for each press, until its mark ends. */
  jump: { id: string } | undefined;
  /** The reader's open and closed choices of each message's parts, by message id. */
  expanded: Readonly<Record<string, Readonly<Record<string, boolean>>>>;
}

/** The chat's state and the stable commands that change it. */
export interface ChatState extends Omit<ChatOwnState, 'conversationId' | 'jump'> {
  /** The message a quote jumped to, while it is marked. */
  jumpedId: string | undefined;
  /** The composer's text box, kept while the composer is mounted. */
  composerRef: RefObject<HTMLDivElement | null>;
  /** The composer's ref, which records its text box. */
  setComposer: RefCallback<HTMLDivElement>;
  startEdit: (editing: ChatEditing) => void;
  cancelEdit: () => void;
  startReply: (messageId: string) => void;
  cancelReply: () => void;
  /** Ends a reply once its sending is accepted, if the chat still shows that conversation and reply session. */
  endReply: (conversationId: string | undefined, session: number) => void;
  /** Ends an edit once its sending is accepted, if the chat still shows that conversation and edit session. */
  endEdit: (conversationId: string | undefined, session: number) => void;
  jumpTo: (messageId: string) => void;
  setExpandedParts: (messageId: string, expanded: Record<string, boolean>) => void;
  focusComposer: () => void;
}

function createState(conversationId: string | undefined, session: number): ChatOwnState {
  return {
    conversationId,
    session,
    editing: null,
    replyingId: null,
    jump: undefined,
    expanded: {},
  };
}

/** How long the message a quote jumped to stays marked, in milliseconds. */
const jumpMarkDuration = 2000;

/**
 * Ends a quote jump's mark once it has shown for `jumpMarkDuration`, so the transcript's highlight
 * is free again: the same quote jumps again, and a search that loses its match does not fall back
 * to a message the reader left long ago.
 */
function useJumpExpiry(jump: ChatOwnState['jump'], endJump: (jump: { id: string }) => void) {
  useEffect(() => {
    if (!jump) return undefined;
    const timer = setTimeout(() => endJump(jump), jumpMarkDuration);
    return () => clearTimeout(timer);
  }, [jump, endJump]);
}

/**
 * The editing, replying, quote jump and expansion state of a chat, which starts over when the
 * conversation changes. The commands keep their identities, so the messages need not re-render.
 */
export function useChatState(conversationId: string | undefined): ChatState {
  const [own, setOwn] = useState(() => createState(conversationId, 0));
  const composerRef = useRef<HTMLDivElement>(null);
  // The editor detaches and reattaches its ref on each render, after the layout effects of the
  // queue above it; keeping the last text box lets those effects still find it.
  const setComposer = useCallback((element: HTMLDivElement | null) => {
    if (element) composerRef.current = element;
  }, []);
  let current = own;
  if (own.conversationId !== conversationId) {
    // The count goes on, so an acceptance from an earlier visit cannot match a later session.
    current = createState(conversationId, own.session + 1);
    setOwn(current);
  }
  // Focus moves at once, and again once an overlay that ran the command, such as a context menu,
  // has handed focus back to where it opened. A key or a pointer pressed meanwhile is the reader
  // moving on, so the focus they chose stays.
  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
    const view = getOwnerWindow(composerRef.current);
    const wait = new AbortController();
    const listening = { capture: true, signal: wait.signal };
    view.addEventListener('pointerdown', () => wait.abort(), listening);
    view.addEventListener('keydown', () => wait.abort(), listening);
    view.requestAnimationFrame(() =>
      view.requestAnimationFrame(() => {
        if (!wait.signal.aborted) composerRef.current?.focus();
        wait.abort();
      }),
    );
  }, []);
  const commands = useMemo(() => {
    const update = (patch: Partial<ChatOwnState>) => setOwn((state) => ({ ...state, ...patch }));
    // Starting or leaving an edit or a reply begins a new session.
    const renew = (patch: Partial<ChatOwnState>) =>
      setOwn((state) => ({ ...state, ...patch, session: state.session + 1 }));
    return {
      startEdit: (editing: ChatEditing) => {
        renew({ editing, replyingId: null });
        focusComposer();
      },
      cancelEdit: () => renew({ editing: null }),
      startReply: (replyingId: string) => {
        renew({ replyingId, editing: null });
        focusComposer();
      },
      cancelReply: () => renew({ replyingId: null }),
      endReply: (scope: string | undefined, session: number) =>
        setOwn((state) =>
          state.conversationId === scope && state.session === session
            ? { ...state, replyingId: null, session: session + 1 }
            : state,
        ),
      endEdit: (scope: string | undefined, session: number) =>
        setOwn((state) =>
          state.conversationId === scope && state.session === session
            ? { ...state, editing: null, session: session + 1 }
            : state,
        ),
      jumpTo: (id: string) => update({ jump: { id } }),
      endJump: (jump: { id: string }) =>
        setOwn((state) => (state.jump === jump ? { ...state, jump: undefined } : state)),
      setExpandedParts: (messageId: string, parts: Record<string, boolean>) =>
        setOwn((state) => ({ ...state, expanded: { ...state.expanded, [messageId]: parts } })),
    };
  }, [focusComposer]);
  const { endJump, ...shared } = commands;
  useJumpExpiry(current.jump, endJump);
  const { conversationId: _scope, jump, ...state } = current;
  return { ...state, jumpedId: jump?.id, ...shared, composerRef, setComposer, focusComposer };
}
