import { useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { PresenceStrip } from '../../src/components/presence-strip/presence-strip.js';
import { UserCard, UserCardTrigger } from '../../src/components/user-card/user-card.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture, samplePeople } from './people-samples.js';

const contents = ['name only', 'secondary line', 'status', 'details and actions'] as const;
const actions = [
  { id: 'message', label: 'Message', icon: 'edit' as const },
  { id: 'profile', label: 'View profile' },
];
const details = [
  { label: 'Team', value: 'Research' },
  { label: 'Local time', value: '09:30' },
];

function contentProps(content: (typeof contents)[number]) {
  const description = content === 'name only' ? undefined : 'maria@example.com';
  const status = content === 'name only' || content === 'secondary line' ? {} : statusProps();
  const extra = content === 'details and actions' ? { details, actions } : {};
  return { description, ...status, ...extra };
}

function statusProps() {
  return { status: 'away', statusLabel: 'Away until 14:00' };
}

function Triggers() {
  const [log, setLog] = useState('nothing yet');
  const card = (name: string) => (
    <UserCard
      name={name}
      description="Research team"
      {...statusProps()}
      details={details}
      actions={actions}
      onAction={(id) => setLog(`${id} for ${name}`)}
    />
  );
  return (
    <div>
      <p data-lab-triggers="">
        <UserCardTrigger card={card('Maria Santos')} data-lab-trigger="avatar">
          <Avatar name="Maria Santos" size="sm" />
        </UserCardTrigger>{' '}
        <UserCardTrigger card={card('Jon Berg')} data-lab-trigger="identity">
          <UserIdentity name="Jon Berg" src={samplePicture} description="Research team" size="sm" />
        </UserCardTrigger>{' '}
        Photos by{' '}
        <UserCardTrigger card={card('Lena Ortiz')} data-lab-trigger="name">
          Lena Ortiz
        </UserCardTrigger>
        , edited by{' '}
        <UserCardTrigger card={card('Sam Okafor')} data-lab-trigger="disabled" isDisabled>
          Sam Okafor
        </UserCardTrigger>
      </p>
      <p>
        <PresenceStrip
          people={samplePeople}
          maxVisible={4}
          size="sm"
          data-lab-strip="cards"
          renderCard={(person) => card(person.name)}
        />
      </p>
      <p>
        Last action: <output data-lab-output="action">{log}</output>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Content and avatars"
      description="Each part the card draws, for a person with initials, with a picture and for a group."
    >
      <StateMatrix
        axes={{ content: contents, avatar: ['initials', 'picture', 'group'] }}
        render={({ content, avatar }) => (
          <UserCard
            name={avatar === 'group' ? 'Design team' : 'Maria Santos'}
            kind={avatar === 'group' ? 'group' : 'person'}
            src={avatar === 'picture' ? samplePicture : undefined}
            {...contentProps(content)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Opening a card"
      description="Click an avatar, an identity row, a name or a present person, or Tab to it and press Enter or Space. Escape or a press outside closes the card."
    >
      <Triggers />
    </LabSection>
  </>,
);
