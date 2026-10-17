import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { PresenceStrip } from '../../src/components/presence-strip/presence-strip.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { SAMPLE_PEOPLE } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const windows = ['all', 'max 4', 'max 4, 2 left out', 'left out only', 'one person'] as const;

function windowProps(setup: (typeof windows)[number]) {
  switch (setup) {
    case 'all':
      return { people: SAMPLE_PEOPLE };
    case 'max 4':
      return { people: SAMPLE_PEOPLE, maxVisible: 4 };
    case 'max 4, 2 left out':
      return {
        people: SAMPLE_PEOPLE,
        maxVisible: 4,
        overflowCount: 2,
        hiddenNames: ['Ines Duarte', 'Kofi Mensah'],
      };
    case 'left out only':
      return { people: [], overflowCount: 3 };
    case 'one person':
      return { people: SAMPLE_PEOPLE.slice(0, 1) };
  }
}

function Following() {
  const [followed, setFollowed] = useState('nobody');
  const [leftOut, setLeftOut] = useState(0);
  return (
    <div>
      <PresenceStrip
        people={SAMPLE_PEOPLE.slice(0, 4)}
        overflowCount={leftOut}
        hiddenNames={Array.from({ length: leftOut }, (_, index) => `Guest ${index + 1}`)}
        data-lab-strip="following"
        onAction={(id) => setFollowed(SAMPLE_PEOPLE.find((person) => person.id === id)?.name ?? id)}
      />
      <p>
        Following: <output data-lab-output="following">{followed}</output>
      </p>
      <p>
        <Button size="sm" onPress={() => setLeftOut((count) => count + 1)}>
          Add a person left out
        </Button>{' '}
        <Button
          size="sm"
          variant="tertiary"
          isDisabled={leftOut === 0}
          onPress={() => setLeftOut(0)}
        >
          Clear
        </Button>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants and sizes"
      description="Six people, at most four visible, as avatars and as decorative dots."
    >
      <StateMatrix
        axes={{ variant: ['avatars', 'dots'], size: sizes }}
        render={({ variant, size }) => (
          <PresenceStrip people={SAMPLE_PEOPLE} maxVisible={4} variant={variant} size={size} />
        )}
      />
    </LabSection>
    <LabSection
      title="Windowing and overflow"
      description="The overflow counts the people past the maximum plus the ones the caller left out, and is absent at zero."
    >
      <StateMatrix
        axes={{ setup: windows, variant: ['avatars', 'dots'] }}
        render={({ setup, variant }) => (
          <PresenceStrip {...windowProps(setup)} variant={variant} size="sm" />
        )}
      />
    </LabSection>
    <LabSection
      title="Pressing a person"
      description="Click a person, or Tab to them and press Enter or Space. Add people left out to grow the count."
    >
      <Following />
    </LabSection>
    <LabSection
      title="Inside a control"
      description="Dots inside a button; the button's own label says who is present."
    >
      <Button aria-label="Sheet 1, 3 people here">
        Sheet 1 <PresenceStrip people={SAMPLE_PEOPLE.slice(0, 3)} variant="dots" />
      </Button>
    </LabSection>
  </>,
);
