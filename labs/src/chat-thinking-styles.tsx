// Two ways to show an assistant thinking, built from Chat's options: a shimmering summary that
// gives way to the reasoning's own label, and a pulsing icon that stays until the reply ends.

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Chat, type ChatProps } from '../../src/components/chat/index.js';
import type { ChatMessageData, ChatPart } from '../../src/components/chat-parts/index.js';
import { Cluster, Stack } from '../../src/components/layout/layout.js';
import { requireDefined } from './require-defined.js';
import { assistantPeople, getLabNow, plannerId, readerId, textMessage } from './chat-samples.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const styles = ['summary', 'icon'] as const;
const phases = ['waiting', 'reasoning', 'searching', 'writing', 'done'] as const;

type ThinkingStyle = (typeof styles)[number];
type ThinkingPhase = (typeof phases)[number];

/** A decorative four-pointed star, standing in for a host's own icon. */
export const sparkle: ReactNode = (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" focusable="false">
    <path d="M8 0l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
  </svg>
);

/** The Chat options each style sets. */
const styleOptions: Record<ThinkingStyle, Partial<ChatProps>> = {
  summary: { thinkingUntil: 'content', expandsActivity: false },
  icon: { thinkingUntil: 'end', expandsActivity: false, thinkingIcon: sparkle },
};

const reasoningText = 'The castle opens at nine and is quietest early, so a morning visit suits.';

const reasoning = (isStreaming: boolean): ChatPart => ({
  type: 'reasoning',
  id: 'why',
  text: reasoningText,
  title: 'Weighing opening hours',
  status: isStreaming ? 'streaming' : 'complete',
  durationMs: isStreaming ? undefined : 4000,
});

const search = (isRunning: boolean): ChatPart => ({
  type: 'tool-call',
  id: 'hours',
  name: 'opening_hours',
  label: 'Check opening hours',
  status: isRunning ? 'running' : 'succeeded',
});

const answer = (isStreaming: boolean): ChatPart => ({
  type: 'text',
  text: isStreaming ? 'Saturday morning suits the' : 'Saturday morning suits the castle best.',
  status: isStreaming ? 'streaming' : 'complete',
});

/** The reply's parts and status at each phase. */
const replyByPhase: Record<ThinkingPhase, Pick<ChatMessageData, 'parts' | 'status'>> = {
  waiting: { parts: [], status: 'streaming' },
  reasoning: { parts: [reasoning(true)], status: 'streaming' },
  searching: { parts: [reasoning(false), search(true)], status: 'streaming' },
  writing: { parts: [reasoning(false), search(false), answer(true)], status: 'streaming' },
  done: { parts: [reasoning(false), search(false), answer(false)], status: 'complete' },
};

/** The reader's question and the reply at `phase`, with ids unique to `key`. */
function styleMessages(key: string, phase: ThinkingPhase): ChatMessageData[] {
  return [
    textMessage({
      id: `${key}-1`,
      authorId: readerId,
      time: '2026-04-20T10:00:00',
      text: 'Which day is best for the castle?',
    }),
    {
      id: `${key}-2`,
      authorId: plannerId,
      createdAt: '2026-04-20T10:00:05',
      ...replyByPhase[phase],
    },
  ];
}

function StyleChat({
  style,
  phase,
  id,
}: {
  style: ThinkingStyle;
  phase: ThinkingPhase;
  id: string;
}) {
  return (
    <div style={{ height: 340 }}>
      <Chat
        {...styleOptions[style]}
        aria-label={`Conversation (${style}, ${phase})`}
        messages={styleMessages(id, phase)}
        participants={assistantPeople}
        currentUserId={readerId}
        getNow={getLabNow}
        scrollMode="follow"
        placeholder="Ask the trip planner…"
        onSend={() => undefined}
      />
    </div>
  );
}

/** One tick of Play, in milliseconds. */
const tick = 1600;

/** A style's reply played phase by phase. */
function StyleReplay({ style }: { style: ThinkingStyle }) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const last = phases.length - 1;
  useEffect(() => {
    if (!isPlaying) return undefined;
    if (index >= last) {
      setPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setIndex((value) => value + 1), tick);
    return () => window.clearTimeout(timer);
  }, [index, isPlaying, last]);
  return (
    <Stack space="sm" data-lab-demo={`thinking-${style}`}>
      <Cluster space="sm">
        <Button
          isDisabled={isPlaying}
          onPress={() => {
            setIndex(0);
            setPlaying(true);
          }}
        >
          Play {style} style
        </Button>
        <span>Phase: {phases[index]}</span>
      </Cluster>
      <StyleChat style={style} phase={requireDefined(phases[index])} id={`replay-${style}`} />
    </Stack>
  );
}

export function ChatThinkingStyles() {
  return (
    <LabSection
      title="Thinking styles"
      description="Two styles from the same options. Summary: thinkingUntil content and expandsActivity false, so a shimmering Thinking… gives way to the closed reasoning and steps, labelled by the reasoning's title while it streams. Icon: thinkingUntil end, expandsActivity false and a thinkingIcon that pulses beside the reply until it ends, alone while the text streams. Play runs a reply through each phase."
    >
      <Cluster space="lg">
        {styles.map((style) => (
          <div key={style} style={{ width: 320 }}>
            <StyleReplay style={style} />
          </div>
        ))}
      </Cluster>
      <StateMatrix
        axes={{ style: styles, phase: phases }}
        render={({ style, phase }) => (
          <StyleChat style={style} phase={phase} id={`style-${style}-${phase}`} />
        )}
      />
    </LabSection>
  );
}
