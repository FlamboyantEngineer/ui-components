import { EditGlyph } from '../../src/core/glyphs.js';
import { useEffect, useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { AvatarGroup } from '../../src/components/avatar-group/avatar-group.js';
import { Button } from '../../src/components/button/button.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { UserCardTrigger } from '../../src/components/user-card-trigger/user-card-trigger.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { LabSection, mountLab } from './chrome/index.js';
import { samplePicture, samplePeople } from './people-samples.js';

const actions = [
  { id: 'message', label: 'Message', icon: EditGlyph },
  { id: 'profile', label: 'View profile' },
];
const details = [
  { id: 'team', label: 'Team', value: 'Research' },
  { id: 'time', label: 'Local time', value: '09:30' },
];

function statusProps() {
  return { status: 'away' as const, statusLabel: 'Away until 14:00' };
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

const inlineNames = ['Lena Ortiz', 'Tom Li', 'Priya Nair'] as const;
const textSizes = { small: '0.8125rem', body: '1rem', large: '1.375rem' } as const;

/** Names inside running text, in a narrow column so the sentence wraps, at three text sizes. */
function InlineNames() {
  const card = (name: string) => <UserCard name={name} description="Research team" />;
  return (
    <div>
      {Object.entries(textSizes).map(([size, fontSize]) => (
        <p key={size} data-lab-sentence={size} style={{ maxWidth: '16em', fontSize }}>
          Photos by{' '}
          <UserCardTrigger card={card(inlineNames[0])} data-lab-inline-name="">
            {inlineNames[0]}
          </UserCardTrigger>
          , captions by{' '}
          <UserCardTrigger card={card(inlineNames[1])} trigger="hover" data-lab-inline-name="">
            {inlineNames[1]}
          </UserCardTrigger>{' '}
          and layout by{' '}
          <UserCardTrigger card={card(inlineNames[2])} data-lab-inline-name="">
            {inlineNames[2]}
          </UserCardTrigger>{' '}
          for the spring issue.
        </p>
      ))}
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Opening a card"
      description="Click an avatar, an identity row, a name or a present person, or Tab to it and press Enter or Space. Escape or a press outside closes the card."
    >
      <Triggers />
    </LabSection>
    <LabSection
      title="Hover and focus"
      description="The first pointer entry or Tab to a person opens their card after a short delay without taking focus. Move into the card or Tab to enter it. One card loads its details on opening; another is opened from outside."
    >
      <HoverCards />
    </LabSection>
    <LabSection
      title="Names in a sentence"
      description="A name alone sits on the sentence's baseline and wraps with it, at small, body and large text, by click or hover. Avatar and identity triggers stay centred."
    >
      <InlineNames />
    </LabSection>
  </>,
);
