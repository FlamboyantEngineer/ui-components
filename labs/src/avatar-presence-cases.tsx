import { useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix } from './chrome/index.js';
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
      <Avatar
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

export function AvatarPresenceCases() {
  return (
    <div data-lab-family="avatar-presence-cases">
      <>
        <LabSection
          title="Presence: Statuses, interaction and sizes"
          description="Each status word the reference sheet styles, as a named image and as a button."
        >
          <StateMatrix
            axes={{ interaction: ['image', 'button'], status: statuses, size: sizes }}
            render={({ interaction, status, size }) => (
              <Avatar
                name="Maria Santos"
                status={status === 'none' ? undefined : status}
                statusLabel={label(status)}
                size={size}
                onPress={interaction === 'button' ? () => {} : undefined}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Presence: Content"
          description="Initials, a picture, a group and a square bot, each with a status."
        >
          <StateMatrix
            axes={{ content: ['initials', 'picture', 'group', 'square'], size: sizes }}
            render={({ content, size }) => (
              <Avatar
                name={
                  content === 'group'
                    ? 'Design team'
                    : content === 'square'
                      ? 'Build bot'
                      : 'Jon Berg'
                }
                kind={content === 'group' ? 'group' : 'person'}
                shape={content === 'square' ? 'square' : undefined}
                src={content === 'picture' ? samplePicture : undefined}
                status="away"
                statusLabel="Away"
                size={size}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Presence: Pressing"
          description="Click the avatar, or Tab to it and press Enter or Space; holding a key presses once."
        >
          <PressCounter />
        </LabSection>
        <LabSection
          title="Presence: Person card"
          description="Pressing the avatar opens a card about the person; Escape returns to the avatar."
        >
          <Avatar
            name="Jon Berg"
            src={samplePicture}
            status="away"
            statusLabel="Away"
            data-lab-avatar="card"
            card={<UserCard name="Jon Berg" src={samplePicture} status="away" statusLabel="Away" />}
          />
        </LabSection>
        <LabSection
          title="Presence: Name tooltip"
          description="Rest the pointer on an avatar or Tab to it: a tooltip shows the name and status. The static avatar takes focus for it."
        >
          <p>
            <Avatar
              name="Maria Santos"
              status="active"
              statusLabel="Active"
              nameTooltip
              data-lab-avatar="tooltip-image"
            />{' '}
            <Avatar
              name="Priya Nair"
              src={samplePicture}
              status="away"
              statusLabel="Away"
              nameTooltip
              onPress={() => {}}
              data-lab-avatar="tooltip-button"
            />{' '}
            <Avatar
              name="Lena Ortiz"
              status="busy"
              statusLabel="Busy"
              nameTooltip
              card={<UserCard name="Lena Ortiz" status="busy" statusLabel="Busy" />}
              data-lab-avatar="tooltip-card"
            />
          </p>
        </LabSection>
        <LabSection
          title="Presence: Card on hover"
          description="Rest the pointer on the avatar or Tab to it: after a short delay its card opens without taking focus."
        >
          <Avatar
            name="Sam Okafor"
            status="idle"
            statusLabel="Idle"
            cardTrigger="hover"
            data-lab-avatar="hover-card"
            card={
              <UserCard name="Sam Okafor" status="idle" statusLabel="Idle" description="Design" />
            }
          />
        </LabSection>
      </>
    </div>
  );
}
