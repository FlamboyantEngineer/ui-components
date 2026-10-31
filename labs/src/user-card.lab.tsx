import { EditGlyph } from '../../src/core/glyphs.js';
import { useEffect, useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { Button } from '../../src/components/button/button.js';
import { AvatarGroup } from '../../src/components/avatar-group/avatar-group.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { UserCard, UserCardTrigger } from '../../src/components/user-card/user-card.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture, samplePeople } from './people-samples.js';

const contents = [
  'name only',
  'secondary line',
  'status',
  'details and actions',
  'loading',
] as const;
const actions = [
  { id: 'message', label: 'Message', icon: EditGlyph },
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
  return { description, ...status, ...extra, isLoading: content === 'loading' };
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
        <AvatarGroup
          layout="strip"
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

function HoverCards() {
  const [isOpen, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [log, setLog] = useState('nothing yet');
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [isLoading]);
  const card = (name: string) => (
    <UserCard
      name={name}
      description="Research team"
      {...statusProps()}
      actions={actions}
      onAction={(id) => setLog(`${id} for ${name}`)}
    />
  );
  return (
    <div>
      <p>
        <UserCardTrigger trigger="hover" card={card('Priya Nair')} data-lab-trigger="hover-avatar">
          <Avatar name="Priya Nair" size="sm" />
        </UserCardTrigger>{' '}
        Reviewed by{' '}
        <UserCardTrigger trigger="hover" card={card('Tom Li')} data-lab-trigger="hover-name">
          Tom Li
        </UserCardTrigger>
      </p>
      <p>
        <UserCardTrigger
          trigger="hover"
          card={
            <UserCard
              name="Ines Duarte"
              description="Research team"
              details={details}
              isLoading={isLoading}
            />
          }
          onOpenChange={(open) => setLoading(open)}
          data-lab-trigger="loading"
        >
          Ines Duarte
        </UserCardTrigger>{' '}
        loads her details when her card opens.
      </p>
      <p>
        <UserCardTrigger
          card={card('Kofi Mensah')}
          isOpen={isOpen}
          onOpenChange={setOpen}
          data-lab-trigger="controlled"
        >
          Kofi Mensah
        </UserCardTrigger>{' '}
        <Button size="sm" onPress={() => setOpen(true)}>
          Show Kofi&apos;s card
        </Button>{' '}
        Card: <output data-lab-output="controlled">{isOpen ? 'open' : 'closed'}</output>
      </p>
      <p>
        Last action: <output data-lab-output="hover-action">{log}</output>
      </p>
    </div>
  );
}

function InModal() {
  const [log, setLog] = useState('nothing yet');
  return (
    <div>
      <ModalTrigger>
        <Button data-lab-trigger="editor">Open editor</Button>
        <Modal title="Editor">
          <input aria-label="Draft" defaultValue="" />
          <UserCard
            name="Maria Santos"
            description="Research team"
            actions={actions}
            onAction={(id) => setLog(`${id} for Maria Santos`)}
          />
        </Modal>
      </ModalTrigger>{' '}
      Last action: <output data-lab-output="modal-action">{log}</output>
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
    <LabSection
      title="Hover and focus"
      description="Rest the pointer on a person or Tab to them: the card opens after a short delay without taking focus, stays open while the pointer moves into it, and Tab enters it. One card loads its details on opening; another is opened from outside."
    >
      <HoverCards />
    </LabSection>
    <LabSection
      title="In a modal"
      description="A card shown in place inside a modal: its actions report without closing the modal, and it takes no focus."
    >
      <InModal />
    </LabSection>
  </>,
);
