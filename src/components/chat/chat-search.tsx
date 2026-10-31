'use client';

import { SearchGlyph } from '../../core/glyphs.js';
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { ChatMessageData } from '../chat-parts/chat-parts.js';
import { FindBar } from '../find-bar/find-bar.js';
import { Button } from '../button/button.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { findMessageMatches } from './chat-model.js';
import { getElementByIdFrom } from '../../utils/owner-window.js';

/** The search within a conversation: its query, the matching messages and the current one. */
interface ChatSearchModel {
  isOpen: boolean;
  query: string;
  /** The ids of the matching messages, oldest first. */
  matches: readonly string[];
  /** The current match, zero-based; -1 without matches. */
  currentIndex: number;
  /** The current match's message, for the transcript to highlight. */
  highlightedId: string | undefined;
  toggle: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  step: (by: 1 | -1) => void;
  barId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  toggleRef: RefObject<HTMLButtonElement | null>;
}

/** Moves focus to the current match's message, else back to the toggle, once the bar closes. */
function focusAfterClose(highlightedId: string | undefined, toggle: HTMLButtonElement | null) {
  const message = highlightedId ? getElementByIdFrom(toggle, highlightedId) : null;
  (message ?? toggle)?.focus();
}

/**
 * Searches the conversation's data rather than its mounted messages, so a virtualized history is
 * searched whole; the newest match is current first, and the steps wrap around.
 */
export function useChatSearch(messages: readonly ChatMessageData[]): ChatSearchModel {
  const [isOpen, setOpen] = useState(false);
  const [query, setQueryState] = useState('');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const barId = useId();
  const matches = useMemo(
    () => (isOpen ? findMessageMatches(messages, query) : []),
    [messages, query, isOpen],
  );
  const chosen = chosenId === null ? -1 : matches.indexOf(chosenId);
  const currentIndex = chosen >= 0 ? chosen : matches.length - 1;
  const highlightedId = matches[currentIndex];
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);
  const close = () => {
    setOpen(false);
    setQueryState('');
    setChosenId(null);
    focusAfterClose(highlightedId, toggleRef.current);
  };
  return {
    ...{ isOpen, query, matches, currentIndex, highlightedId, barId, inputRef, toggleRef },
    toggle: () => (isOpen ? close() : setOpen(true)),
    close,
    setQuery: (next) => {
      setQueryState(next);
      setChosenId(null);
    },
    step: (by) => {
      if (matches.length === 0) return;
      const next = (currentIndex + by + matches.length) % matches.length;
      setChosenId(matches[next] ?? null);
    },
  };
}

/** The button in the header that opens and closes the search. */
export function ChatSearchToggle({ search }: { search: ChatSearchModel }) {
  const strings = useUiStrings();
  return (
    <Button
      ref={search.toggleRef}
      icon={SearchGlyph}
      label={strings.chatSearch}
      size="sm"
      aria-expanded={search.isOpen}
      aria-controls={search.isOpen ? search.barId : undefined}
      className={hooks.slotClass('search-toggle')}
      onPress={search.toggle}
    />
  );
}

/** The find row under the header: the query, the match count, the steps and Close. */
export function ChatSearchBar({ search }: { search: ChatSearchModel }) {
  const strings = useUiStrings();
  if (!search.isOpen) return null;
  return (
    <FindBar
      id={search.barId}
      label={strings.chatSearch}
      query={search.query}
      onQueryChange={search.setQuery}
      matchCount={search.query.trim() ? search.matches.length : undefined}
      currentIndex={search.currentIndex}
      onNext={() => search.step(1)}
      onPrevious={() => search.step(-1)}
      onClose={search.close}
      inputRef={search.inputRef}
      className={hooks.slotClass('search')}
    />
  );
}
