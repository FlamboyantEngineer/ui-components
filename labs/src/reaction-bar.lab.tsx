import { useState } from 'react';
import { ReactionBar, type ReactionEntry } from '../../src/components/reaction-bar/reaction-bar.js';
import { UiProvider } from '../../src/core/provider.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { ReactionBarHostCases } from './reaction-bar-host-cases.js';
import { customEmoji, sets, toggleReaction } from './reaction-samples.js';

function LiveReactions() {
  const [reactions, setReactions] = useState<readonly ReactionEntry[]>(sets.several.slice(0, 3));
  const [recent, setRecent] = useState<string[]>(['🚀', ':plus_one:']);
  const [last, setLast] = useState('nothing yet');
  return (
    <div>
      <ReactionBar
        reactions={reactions}
        customEmoji={customEmoji}
        recentEmoji={recent}
        onRecentEmojiChange={setRecent}
        onToggle={(emoji, isReacted) => {
          setLast(`${isReacted ? 'reacted with' : 'removed'} ${emoji}`);
          setReactions((list) => toggleReaction(list, emoji, isReacted));
        }}
        data-lab-bar="live"
      />
      <p>
        Last change: <output data-lab-output="toggle">{last}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="No reactions, one and several (with a custom emoji and a count larger than the names known), interactive and read-only. Hover or focus a chip to read who reacted."
    >
      <StateMatrix
        axes={{ mode: ['interactive', 'read-only'], reactions: ['empty', 'one', 'several'] }}
        render={({ mode, reactions }) => (
          <ReactionBar
            reactions={sets[reactions]}
            customEmoji={customEmoji}
            onToggle={mode === 'interactive' ? () => {} : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Names"
      description="A chip names at most three people by default; here one, then the rest are counted."
    >
      <StateMatrix
        axes={{ maxNames: ['1', '3'] }}
        render={({ maxNames }) => (
          <ReactionBar reactions={sets.several.slice(0, 2)} maxNames={Number(maxNames)} />
        )}
      />
    </LabSection>
    <LabSection
      title="Locales"
      description="Counts in the locale's digits and grouping, on the chip and in its name."
    >
      <StateMatrix
        axes={{ locale: ['en-US', 'de-DE', 'ar-EG'] }}
        render={({ locale }) => (
          <UiProvider locale={locale}>
            <ReactionBar
              aria-label={`Reactions, ${locale}`}
              reactions={[
                { emoji: '👍', count: 1234, people: ['Maria Santos'] },
                { emoji: '🎉', count: 56789 },
              ]}
            />
          </UiProvider>
        )}
      />
    </LabSection>
    <LabSection
      title="Live"
      description="Press a chip to toggle your reaction, or add one from the picker: recent and custom emoji included."
    >
      <LiveReactions />
    </LabSection>
    <ReactionBarHostCases />
  </>,
);
