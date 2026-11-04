import { useState } from 'react';
import {
  ChatMessage,
  type ChatMessageDelivery,
  type ChatMessageProps,
} from '../../src/components/chat-transcript/index.js';
import { CopyButton } from '../../src/components/copy-button/copy-button.js';
import { ReactionBar, type ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every time in the message cases reads the same on every day. */
export const getNow = () => new Date(2026, 3, 20, 10, 30);

export const maria = { name: 'Maria Santos', colorKey: 'maria' };
export const helper = { name: 'Helper', src: samplePicture, colorKey: 'helper' };

/** The people of the group conversation; Maria is the reader. */
export const team = {
  maria: { id: 'maria', ...maria },
  ana: { id: 'ana', name: 'Ana Lopez', colorKey: 'ana', status: 'active' as const },
  ben: {
    id: 'ben',
    name: 'Ben Okoro',
    src: samplePicture,
    colorKey: 'ben',
    status: 'away' as const,
  },
  cy: { id: 'cy', name: 'Cy Park', colorKey: 'cy', status: 'busy' as const },
  dee: { id: 'dee', name: 'Dee Nolan', colorKey: 'dee' },
  eli: { id: 'eli', name: 'Eli Brandt', colorKey: 'eli' },
};

export type TeamMemberId = keyof typeof team;

/** A local date and time on the lab's fixed day (20 April 2026) or the day before. */
export function at(day: 19 | 20, hours: number, minutes: number): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `2026-04-${day}T${pad(hours)}:${pad(minutes)}:00`;
}

/** Copy, the one action every complete message offers in the cases. */
export function CopyAction({ text }: { text: string }) {
  return <CopyButton value={text} label="Copy message" size="sm" />;
}

/** Reactions the reader can toggle. */
export function LabReactions({ initial }: { initial: readonly ReactionEntry[] }) {
  const [reactions, setReactions] = useState(initial);
  const toggle = (emoji: string, isReacted: boolean) =>
    setReactions((list) => {
      const known = list.some((entry) => entry.emoji === emoji);
      const next = known ? list : [...list, { emoji, count: 0, people: [] }];
      return next.map((entry) =>
        entry.emoji === emoji
          ? { ...entry, isReacted, count: (entry.count ?? 0) + (isReacted ? 1 : -1) }
          : entry,
      );
    });
  return <ReactionBar reactions={reactions} onToggle={toggle} />;
}

/** A sent message whose Retry sends it again: failed, then sending, then sent. */
export function RetryingMessage(props: Omit<ChatMessageProps, 'delivery' | 'onRetry'>) {
  const [delivery, setDelivery] = useState<ChatMessageDelivery>('failed');
  const retry = () => {
    setDelivery('sending');
    window.setTimeout(() => setDelivery('sent'), 800);
  };
  return (
    <ChatMessage
      {...props}
      origin="sent"
      delivery={delivery}
      onRetry={delivery === 'failed' ? retry : undefined}
    />
  );
}
