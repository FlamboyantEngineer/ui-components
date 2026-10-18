import {
  AvatarGroup,
  type AvatarGroupPerson,
} from '../../src/components/avatar-group/avatar-group.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { brokenPicture, samplePeople } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const roles = ['Owner', 'Reviewer', 'Reviewer', 'Editor', 'Editor', 'Viewer'];

const team: readonly AvatarGroupPerson[] = samplePeople.map(({ id, name, src }, index) => ({
  id,
  name,
  src,
  description: roles[index],
}));

const windows = ['all', 'max 3', 'max 0', 'one person'] as const;

function windowProps(setup: (typeof windows)[number]) {
  switch (setup) {
    case 'all':
      return { people: team };
    case 'max 3':
      return { people: team, maxVisible: 3 };
    case 'max 0':
      return { people: team, maxVisible: 0 };
    case 'one person':
      return { people: team.slice(0, 1) };
  }
}

mountLab(
  <>
    <LabSection
      title="Sizes and variants"
      description="Six people, at most four visible, filled and outlined."
    >
      <StateMatrix
        axes={{ variant: ['filled', 'outlined'], size: sizes }}
        render={({ variant, size }) => (
          <AvatarGroup people={team} maxVisible={4} size={size} variant={variant} />
        )}
      />
    </LabSection>
    <LabSection
      title="Maximum and overflow"
      description="The +N count holds the people past the maximum and is absent at zero."
    >
      <StateMatrix
        axes={{ setup: windows, action: ['none', 'list'] }}
        render={({ setup, action }) => (
          <AvatarGroup {...windowProps(setup)} action={action} size="sm" />
        )}
      />
    </LabSection>
    <LabSection
      title="Names"
      description="A caller label, a blank name and a picture that fails to load, which falls back to initials."
    >
      <p>
        <AvatarGroup
          aria-label="Reviewers"
          people={[
            { id: 'a', name: 'Maria Santos' },
            { id: 'b', name: ' ' },
            { id: 'c', name: 'Jon Berg', src: brokenPicture },
          ]}
          data-lab-group="names"
        />
      </p>
    </LabSection>
    <LabSection
      title="Listing everyone"
      description="Press the stack, or Tab to it and press Enter: a popover lists everyone with their role. Escape closes it."
    >
      <p>
        Assignees: <AvatarGroup people={team} maxVisible={3} action="list" data-lab-group="list" />
      </p>
    </LabSection>
  </>,
);
