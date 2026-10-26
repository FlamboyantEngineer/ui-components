import { useState } from 'react';
import { UiProvider } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { Button } from '../../src/components/button/button.js';
import {
  CharacterGrid,
  type CharacterGridCategory,
  type CharacterGridCharacter,
} from '../../src/components/character-grid/character-grid.js';
import { Popover, PopoverTrigger } from '../../src/components/popover/popover.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const symbols: CharacterGridCategory[] = [
  {
    id: 'ar rows',
    label: 'Arrows',
    characters: [
      { char: '←', name: 'Leftwards arrow' },
      { char: '↑', name: 'Upwards arrow' },
      { char: '→', name: 'Rightwards arrow' },
      { char: '↓', name: 'Downwards arrow' },
      { char: '↔', name: 'Left right arrow' },
      { char: '⇒', name: 'Rightwards double arrow' },
    ],
  },
  {
    id: 'currency',
    label: 'Currency',
    characters: [
      { char: '€', name: 'Euro sign' },
      { char: '£', name: 'Pound sign' },
      { char: '¥', name: 'Yen sign' },
      { char: '¢', name: 'Cent sign' },
      { char: '₹', name: 'Indian rupee sign' },
    ],
  },
  {
    id: 'math',
    label: 'Mathematics',
    characters: [
      { char: '±', name: 'Plus-minus sign' },
      { char: '×', name: 'Multiplication sign' },
      { char: '÷', name: 'Division sign' },
      { char: '≈', name: 'Almost equal to' },
      { char: '≠', name: 'Not equal to' },
      { char: '≤', name: 'Less-than or equal to' },
      { char: '≥', name: 'Greater-than or equal to' },
      { char: '∞', name: 'Infinity' },
      { char: '√', name: 'Square root' },
      { char: '°', name: 'Degree sign' },
    ],
  },
  {
    id: 'marks',
    label: 'Marks',
    characters: [
      { char: '©', name: 'Copyright sign' },
      { char: '®', name: 'Registered sign' },
      { char: '™', name: 'Trade mark sign' },
      { char: '§', name: 'Section sign' },
      { char: '¶', name: 'Pilcrow sign' },
      { char: '…', name: 'Horizontal ellipsis' },
      { char: '–', name: 'En dash' },
      { char: '—', name: 'Em dash' },
    ],
  },
];

const recentStates = ['none', 'stored'] as const;
const sets = ['all', 'one'] as const;

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function describe(character: CharacterGridCharacter | null) {
  return character ? `${character.char} ${character.name}` : 'none';
}

function MatrixCell({
  recent,
  set,
}: {
  recent: (typeof recentStates)[number];
  set: (typeof sets)[number];
}) {
  const [storage] = useState(() =>
    createMemoryStorage(recent === 'stored' ? { 'lab-matrix': '["©","€","→"]' } : {}),
  );
  return (
    <UiProvider storage={storage}>
      <CharacterGrid
        aria-label={`Symbols, ${recent} recent, ${set}`}
        categories={set === 'all' ? symbols : symbols.slice(1, 2)}
        persistKey="lab-matrix"
        onSelect={() => {}}
      />
    </UiProvider>
  );
}

function InlineGrid() {
  const [chosen, setChosen] = useState<CharacterGridCharacter | null>(null);
  return (
    <>
      <CharacterGrid
        categories={symbols}
        persistKey="lab-inline"
        onSelect={setChosen}
        data-lab-field="inline"
      />
      <Output name="inline" value={describe(chosen)} />
    </>
  );
}

function InsertSymbol() {
  const [text, setText] = useState('Total: 42');
  return (
    <>
      <PopoverTrigger>
        <Button data-lab-trigger>Insert symbol</Button>
        <Popover aria-label="Insert symbol" placement="bottom start">
          {({ close }) => (
            <CharacterGrid
              autoFocus
              categories={symbols}
              persistKey="lab-popover"
              onSelect={(character) => {
                setText((current) => current + character.char);
                close();
              }}
            />
          )}
        </Popover>
      </PopoverTrigger>
      <Output name="text" value={text} />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Recent characters and sets"
      description="Without and with recently chosen characters in storage, over every category or a single one."
    >
      <StateMatrix
        axes={{ recent: recentStates, set: sets }}
        render={({ recent, set }) => <MatrixCell recent={recent} set={set} />}
      />
    </LabSection>
    <LabSection
      title="Inline"
      description="Search the whole set by name, ignoring accents, or by code point (try “arrow”, “u+00b0” or “°”), move with the arrow keys, choose with a press or Enter; choices lead the grid."
    >
      <InlineGrid />
    </LabSection>
    <LabSection
      title="In a popover"
      description="The insert command opens the grid with the search focused; choosing appends the character and closes it."
    >
      <InsertSymbol />
    </LabSection>
  </>,
);
