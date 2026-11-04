import { useState } from 'react';
import { AvatarGroup } from '../../src/components/avatar-group/avatar-group.js';
import { Button } from '../../src/components/button/button.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix } from './chrome/index.js';
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
      <AvatarGroup
        layout="strip"
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

function OverflowMenu() {
  const [chosen, setChosen] = useState('nobody');
  return (
    <div>
      <AvatarGroup
        layout="strip"
        people={samplePeople}
        maxVisible={3}
        overflowCount={1}
        hiddenNames={['Ines Duarte']}
        overflow="menu"
        data-lab-strip="menu"
        onAction={(id) => setChosen(samplePeople.find((person) => person.id === id)?.name ?? id)}
      />
      <p>
        Chosen: <output data-lab-output="menu">{chosen}</output>
      </p>
    </div>
  );
}

export function AvatarGroupPresenceCases() {
  return (
    <div data-lab-family="avatar-group-presence-cases">
      <>
        <LabSection
          title="Presence: Variants and sizes"
          description="Six people, at most four visible, as avatars and as decorative dots."
        >
          <StateMatrix
            axes={{ variant: ['avatars', 'dots'], size: sizes }}
            render={({ variant, size }) => (
              <AvatarGroup
                people={samplePeople}
                maxVisible={4}
                layout={variant === 'dots' ? 'dots' : 'strip'}
                size={size}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Presence: Windowing and overflow"
          description="The overflow counts the people past the maximum plus the ones the caller left out, and is absent at zero."
        >
          <StateMatrix
            axes={{ setup: windows, variant: ['avatars', 'dots'] }}
            render={({ setup, variant }) => (
              <AvatarGroup
                {...windowProps(setup)}
                layout={variant === 'dots' ? 'dots' : 'strip'}
                size="sm"
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Presence: Pressing a person"
          description="Click a person, or Tab to them and press Enter or Space. Add people left out to grow the count."
        >
          <Following />
        </LabSection>
        <LabSection
          title="Presence: Inside a control"
          description="Dots inside a button; the button's own label says who is present."
        >
          <Button aria-label="Photos, 3 people here">
            Photos <AvatarGroup people={samplePeople.slice(0, 3)} layout="dots" />
          </Button>
        </LabSection>
        <LabSection
          title="Presence: Person cards"
          description="Pressing a person opens the card renderCard returns for them."
        >
          <AvatarGroup
            layout="strip"
            people={samplePeople.slice(0, 3)}
            data-lab-strip="cards"
            renderCard={(person) => (
              <UserCard name={person.name} src={person.src} statusLabel={person.statusLabel} />
            )}
          />
        </LabSection>
        <LabSection
          title="Presence: Overflow menu"
          description="Press the count, or Tab to it and press Enter: a menu lists the hidden people with their status; choosing one reports them."
        >
          <OverflowMenu />
        </LabSection>
        <LabSection
          title="Presence: Name tooltips and hover cards"
          description="Rest the pointer on a person or Tab to them: the first strip shows names in tooltips, the second opens each card after a short delay."
        >
          <p>
            <AvatarGroup
              layout="strip"
              people={samplePeople.slice(0, 4)}
              nameTooltip
              data-lab-strip="tooltips"
            />
          </p>
          <p>
            <AvatarGroup
              layout="strip"
              people={samplePeople.slice(0, 4)}
              cardTrigger="hover"
              data-lab-strip="hover-cards"
              renderCard={(person) => (
                <UserCard
                  name={person.name}
                  src={person.src}
                  status={person.status}
                  statusLabel={person.statusLabel}
                />
              )}
            />
          </p>
        </LabSection>
      </>
    </div>
  );
}
