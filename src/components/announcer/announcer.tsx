'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { REANNOUNCE_MARK } from '../../utils/reannounce.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

/** How urgently a screen reader reads an announcement: after what it is reading, or at once. */
export type AnnouncePoliteness = 'polite' | 'assertive';

export interface AnnounceOptions {
  /** `polite` (the default) waits for the reader to finish; `assertive` interrupts it. */
  politeness?: AnnouncePoliteness | undefined;
}

/** Reads `text` out through the nearest `Announcer`'s live regions. */
export type Announce = (text: string, options?: AnnounceOptions) => void;

export interface AnnouncerProps extends RefProps<HTMLElement>, BaseProps {
  /** The part of the page whose `useAnnounce` calls this announcer reads out. */
  children?: ReactNode;
}

const hooks = createHooks('announcer', ['polite', 'assertive']);

const AnnounceContext = createContext<Announce | null>(null);

/** Announcements outside an `Announcer` go nowhere, so a component works without one. */
function announceNowhere() {}

/** The text a region shows next: a repeat gains an invisible mark so the region still changes. */
function nextText(current: string, text: string): string {
  return current === text ? `${text}${REANNOUNCE_MARK}` : text;
}

type Messages = Record<AnnouncePoliteness, string>;

/** An `announce` that writes into the region its politeness names. */
function createAnnounce(setMessages: (update: (current: Messages) => Messages) => void): Announce {
  return (text, { politeness = 'polite' } = {}) =>
    setMessages((current) => ({ ...current, [politeness]: nextText(current[politeness], text) }));
}

/**
 * Two visually hidden live regions, one polite and one assertive, that `useAnnounce` calls in
 * `children` read out. Each announcer serves the components inside it, so a page may hold several
 * and an inner one serves its own part; nothing is shared through a global.
 */
export function Announcer({ ref, children, className, id, ...rest }: AnnouncerProps) {
  const [messages, setMessages] = useState<Messages>({ polite: '', assertive: '' });
  const [announce] = useState(() => createAnnounce(setMessages));
  return (
    <AnnounceContext value={announce}>
      {children}
      <VisuallyHidden ref={ref} id={id} {...hooks.root({ className, props: rest })}>
        <div {...hooks.slot('polite')} role="status" aria-live="polite" aria-atomic="true">
          {messages.polite}
        </div>
        <div {...hooks.slot('assertive')} role="alert" aria-live="assertive" aria-atomic="true">
          {messages.assertive}
        </div>
      </VisuallyHidden>
    </AnnounceContext>
  );
}

/**
 * The nearest `Announcer`'s `announce(text, { politeness })`. Outside any announcer it does
 * nothing, so a component can announce without requiring one.
 */
export function useAnnounce(): Announce {
  return useContext(AnnounceContext) ?? announceNowhere;
}
