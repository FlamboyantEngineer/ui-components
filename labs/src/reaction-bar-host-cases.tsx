import { useState } from 'react';
import type { NativeEmoji } from '../../src/components/emoji-picker/index.js';
import { ReactionBar, type ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { customEmoji, sets, toggleReaction } from './reaction-samples.js';

/** A summary bar: one chip with the emoji stack and total, which opens the picker when interactive. */
function SummaryBar({ set, mode }: { set: keyof typeof sets; mode: string }) {
  const [reactions, setReactions] = useState<readonly ReactionEntry[]>(sets[set]);
  const [last, setLast] = useState('nothing yet');
  const isInteractive = mode === 'interactive';
  return (
    <div data-lab-summary={`${set} ${mode}`}>
      <ReactionBar
        aria-label={`Reactions, ${set}, ${mode}`}
        presentation="summary"
        reactions={reactions}
        customEmoji={customEmoji}
        onToggle={
          isInteractive
            ? (emoji, isReacted) => {
                setLast(`${isReacted ? 'reacted with' : 'removed'} ${emoji}`);
                setReactions((list) => toggleReaction(list, emoji, isReacted));
              }
            : undefined
        }
      />
      {isInteractive ? <LabOutput name="summary-toggle">{last}</LabOutput> : null}
    </div>
  );
}

/** A small standard set in place of the bundled one: the only glyphs the picker then offers. */
const kitchenEmoji: readonly NativeEmoji[] = [
  {
    unicode: '🍐',
    hexcode: '1F350',
    label: 'pear',
    category: 'food',
    shortcodes: ['pear'],
    keywords: ['fruit'],
  },
  {
    unicode: '🍞',
    hexcode: '1F35E',
    label: 'bread',
    category: 'food',
    shortcodes: ['bread'],
    keywords: ['loaf'],
  },
  {
    unicode: '🔥',
    hexcode: '1F525',
    label: 'fire',
    category: 'travel',
    shortcodes: ['fire'],
    keywords: ['hot'],
  },
];

const answers = ['after a second', 'fails'] as const;

/** A loader the reader steers: it answers after a second or fails; each picker opening asks again. */
function LoadedBar() {
  const [answer, setAnswer] = useState<(typeof answers)[number]>('after a second');
  const [calls, setCalls] = useState<string[]>([]);
  const [reactions, setReactions] = useState<readonly ReactionEntry[]>([
    { emoji: '🍐', people: ['Maria Santos'] },
  ]);
  const loadEmoji = () => {
    const current = answer;
    setCalls((list) => [...list, current]);
    return new Promise<readonly NativeEmoji[]>((resolve, reject) => {
      setTimeout(() => {
        if (current === 'fails') reject(new Error('The emoji could not be fetched'));
        else resolve(kitchenEmoji);
      }, 1000);
    });
  };
  return (
    <div data-lab-demo="load-emoji">
      <SegmentedChoice
        aria-label="The loader answers"
        size="sm"
        sizing="content"
        options={answers.map((value) => ({ value, label: value }))}
        value={answer}
        onChange={(value) => {
          const match = answers.find((option) => option === value);
          if (match) setAnswer(match);
        }}
      />
      <ReactionBar
        aria-label="Reactions from a loaded set"
        reactions={reactions}
        customEmoji={customEmoji}
        loadEmoji={loadEmoji}
        onToggle={(emoji, isReacted) =>
          setReactions((list) => toggleReaction(list, emoji, isReacted))
        }
      />
      <LabOutput name="loads">{calls.length === 0 ? 'none' : calls.join(', ')}</LabOutput>
    </div>
  );
}

export function ReactionBarHostCases() {
  return (
    <div data-lab-family="reaction-bar-host-cases">
      <LabSection
        title="Summary"
        description="presentation summary draws one chip with a stack of the emoji (custom ones as images) and the total. Interactive, it opens the picker, whose choice toggles the reader's reaction; read-only, it only reads."
      >
        <StateMatrix
          axes={{
            set: ['empty', 'one', 'several'] as const,
            mode: ['interactive', 'read-only'] as const,
          }}
          render={({ set, mode }) => <SummaryBar set={set} mode={mode} />}
        />
      </LabSection>
      <LabSection
        title="Loaded emoji"
        description="loadEmoji replaces the bundled emoji with the caller's set: here a pear, bread and fire beside the custom images. The picker shows Loading while the loader runs and a failure message if it rejects; opening the picker again asks the loader again, so choosing the answer that succeeds recovers."
      >
        <LoadedBar />
      </LabSection>
    </div>
  );
}
