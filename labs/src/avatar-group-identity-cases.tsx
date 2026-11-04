import { useState } from 'react';
import { resolveAvatarColor } from '../../src/components/avatar/index.js';
import {
  AvatarGroup,
  type AvatarGroupPerson,
} from '../../src/components/avatar-group/avatar-group.js';
import { Button } from '../../src/components/button/button.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import { LabSection } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

const colorCount = 12;

/** People whose identity overrides the group must carry into every avatar it draws. */
function IdentityGroup() {
  const [firstName, setFirstName] = useState('Maria Santos');
  const [isReversed, setReversed] = useState(false);
  const people: AvatarGroupPerson[] = [
    { id: 'maria', name: firstName, colorKey: 'person-maria', initials: 'MS' },
    { id: 'kim', name: 'Kim Lee', initials: 'K', shape: 'square', colorIndex: 14 },
    {
      id: 'jon',
      name: 'Jon Berg',
      src: samplePicture,
      imageProps: { loading: 'lazy', referrerPolicy: 'no-referrer' },
    },
    { id: 'ana', name: 'Ana Ruiz', colorKey: 'person-ana' },
    { id: 'omar', name: 'Omar Haddad', shape: 'square', colorIndex: 3 },
  ];
  const ordered = isReversed ? [...people].reverse() : people;
  return (
    <div data-lab-demo="group-identity">
      <div role="group" aria-label="People">
        <TextField label="First person's name" value={firstName} onChange={setFirstName} />
        <Button size="sm" onPress={() => setReversed((value) => !value)}>
          Reverse the order
        </Button>
      </div>
      <p>
        Overflow menu:{' '}
        <AvatarGroup
          people={ordered}
          maxVisible={2}
          overflow="menu"
          colorCount={colorCount}
          data-lab-group="identity-menu"
        />
      </p>
      <p>
        Everyone in a list:{' '}
        <AvatarGroup
          people={ordered}
          maxVisible={3}
          action="list"
          colorCount={colorCount}
          data-lab-group="identity-list"
        />
      </p>
      <ul aria-label="Expected colour slots" data-lab-output="slots">
        {ordered.map((person) => (
          <li key={person.id} data-lab-person={person.id}>
            {`${person.name}: ${String(resolveAvatarColor(person, colorCount))}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AvatarGroupIdentityCases() {
  return (
    <LabSection
      title="Identity overrides and palette size"
      description="Each person may set initials, shape, imageProps, colorKey and colorIndex, and the group spreads colours over colorCount 12 slots. Rename the first person or reverse the order, then open the overflow menu and the full list: every avatar keeps its initials, shape, picture attributes and the colour slot listed below."
    >
      <IdentityGroup />
    </LabSection>
  );
}
