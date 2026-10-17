import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { PresenceStrip } from '../../src/components/presence-strip/presence-strip.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePeople } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const windows = ['all', 'max 4', 'max 4, 2 left out', 'left out only', 'one person'] as const;

function windowProps(setup: (typeof windows)[number]) {
  switch (setup) {
    case 'all':
      return { people: samplePeople };
    case 'max 4':
      return { people: samplePeople, maxVisible: 4 };
    case 'max 4, 2 left out':
      return {
        people: samplePeople,
        maxVisible: 4,
        overflowCount: 2,
        hiddenNames: ['Ines Duarte', 'Kofi Mensah'],
      };
    case 'left out only':
      return { people: [], overflowCount: 3 };
    case 'one person':
      return { people: samplePeople.slice(0, 1) };
  }
}

function Following() {
  const [followed, setFollowed] = useState('nobody');
  const [leftOut, setLeftOut] = useState(0);
  return (
    <div>
      <PresenceStrip
        people={samplePeople.slice(0, 4)}
        overflowCount={leftOut}
        hiddenNames={Array.from({ length: leftOut }, (_, index) => `Guest ${index + 1}`)}
        data-lab-strip="following"
        onAction={(id) => setFollowed(samplePeople.find((person) => person.id === id)?.name ?? id)}
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
          <PresenceStrip people={samplePeople} maxVisible={4} variant={variant} size={size} />
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
      <Button aria-label="Photos, 3 people here">
        Photos <PresenceStrip people={samplePeople.slice(0, 3)} variant="dots" />
      </Button>
    </LabSection>
    <LabSection
      title="Person cards"
      description="Pressing a person opens the card renderCard returns for them."
    >
      <PresenceStrip
        people={samplePeople.slice(0, 3)}
        data-lab-strip="cards"
        renderCard={(person) => (
          <UserCard name={person.name} src={person.src} statusLabel={person.statusLabel} />
        )}
      />
    </LabSection>
  </>,
);
