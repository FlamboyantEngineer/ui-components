import { useState } from 'react';
import { PresenceAvatar } from '../../src/components/presence-avatar/presence-avatar.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

const sizes = ['xs', 'sm', 'md', 'lg'] as const;
const statuses = ['none', 'active', 'away', 'busy', 'idle'] as const;

function label(status: string): string | undefined {
  return status === 'none' ? undefined : status.charAt(0).toUpperCase() + status.slice(1);
}

function PressCounter() {
  const [presses, setPresses] = useState(0);
  return (
    <div>
      <PresenceAvatar
        name="Lena Ortiz"
        status="active"
        statusLabel="Active"
        data-lab-avatar="counter"
        onPress={() => setPresses((count) => count + 1)}
      />
      <p>
        Presses: <output data-lab-output="presses">{presses}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Statuses, interaction and sizes"
      description="Each status word the reference sheet styles, as a named image and as a button."
    >
      <StateMatrix
        axes={{ interaction: ['image', 'button'], status: statuses, size: sizes }}
        render={({ interaction, status, size }) => (
          <PresenceAvatar
            name="Maria Santos"
            status={status === 'none' ? undefined : status}
            statusLabel={label(status)}
            size={size}
            onPress={interaction === 'button' ? () => {} : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection title="Content" description="Initials, a picture and a group, each with a status.">
      <StateMatrix
        axes={{ content: ['initials', 'picture', 'group'], size: sizes }}
        render={({ content, size }) => (
          <PresenceAvatar
            name={content === 'group' ? 'Design team' : 'Jon Berg'}
            kind={content === 'group' ? 'group' : 'person'}
            src={content === 'picture' ? samplePicture : undefined}
            status="away"
            statusLabel="Away"
            size={size}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Pressing"
      description="Click the avatar, or Tab to it and press Enter or Space; holding a key presses once."
    >
      <PressCounter />
    </LabSection>
    <LabSection
      title="Person card"
      description="Pressing the avatar opens a card about the person; Escape returns to the avatar."
    >
      <PresenceAvatar
        name="Jon Berg"
        src={samplePicture}
        status="away"
        statusLabel="Away"
        data-lab-avatar="card"
        card={<UserCard name="Jon Berg" src={samplePicture} status="away" statusLabel="Away" />}
      />
    </LabSection>
  </>,
);
