import { useEffect, useState } from 'react';
import { Avatar } from '../../src/components/avatar/avatar.js';
import { AvatarGroup } from '../../src/components/avatar-group/avatar-group.js';
import { Button } from '../../src/components/button/button.js';
import { Card } from '../../src/components/card/card.js';
import { DescriptionList, DescriptionRow } from '../../src/components/description-list/index.js';
import { PreviewTrigger, usePreviewOwner } from '../../src/components/hover-card/index.js';
import { Cluster, Stack } from '../../src/components/layout/index.js';
import { UserIdentity } from '../../src/components/user-identity/user-identity.js';
import { EditGlyph } from '../../src/core/glyphs.js';
import { LabSection } from './chrome/index.js';
import { samplePeople, samplePicture } from './people-samples.js';
import { HoverCommand, InitiallyOpen, LateCard, TimedHover } from './preview-trigger-cases.js';

/** Host-owned preview content: the library owns only its overlay and dismissal. */
function PreviewSample({
  name,
  onAction,
  isLoading,
}: {
  name: string;
  onAction?: (id: string) => void;
  isLoading?: boolean;
}) {
  const owner = usePreviewOwner();
  return (
    <Card title={name} description="Research team" isLoading={isLoading}>
      <Stack space="sm">
        <DescriptionList>
          <DescriptionRow label="Team">Research</DescriptionRow>
          <DescriptionRow label="Local time">09:30</DescriptionRow>
        </DescriptionList>
        <Cluster space="sm">
          <Button
            size="sm"
            startIcon={EditGlyph}
            onPress={(event) => {
              owner?.dismiss(event.target);
              onAction?.('message');
            }}
          >
            Message
          </Button>
          <Button
            size="sm"
            onPress={(event) => {
              owner?.dismiss(event.target);
              onAction?.('profile');
            }}
          >
            View profile
          </Button>
        </Cluster>
      </Stack>
    </Card>
  );
}

function Triggers() {
  const [log, setLog] = useState('nothing yet');
  const card = (name: string) => (
    <PreviewSample name={name} onAction={(id) => setLog(`${id} for ${name}`)} />
  );
  return (
    <div>
      <p data-lab-triggers="">
        <PreviewTrigger preview={card('Maria Santos')} data-lab-trigger="avatar">
          <Avatar name="Maria Santos" size="sm" />
        </PreviewTrigger>{' '}
        <PreviewTrigger preview={card('Jon Berg')} data-lab-trigger="identity">
          <UserIdentity name="Jon Berg" src={samplePicture} description="Research team" size="sm" />
        </PreviewTrigger>{' '}
        Photos by{' '}
        <PreviewTrigger preview={card('Lena Ortiz')} data-lab-trigger="name">
          Lena Ortiz
        </PreviewTrigger>
        , edited by{' '}
        <PreviewTrigger preview={card('Sam Okafor')} data-lab-trigger="disabled" isDisabled>
          Sam Okafor
        </PreviewTrigger>
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
    <PreviewSample name={name} onAction={(id) => setLog(`${id} for ${name}`)} />
  );
  return (
    <div>
      <p>
        <PreviewTrigger
          trigger="hover"
          preview={card('Priya Nair')}
          data-lab-trigger="hover-avatar"
        >
          <Avatar name="Priya Nair" size="sm" />
        </PreviewTrigger>{' '}
        Reviewed by{' '}
        <PreviewTrigger trigger="hover" preview={card('Tom Li')} data-lab-trigger="hover-name">
          Tom Li
        </PreviewTrigger>
      </p>
      <p>
        <PreviewTrigger
          trigger="hover"
          preview={<PreviewSample name="Ines Duarte" isLoading={isLoading} />}
          onOpenChange={(open) => setLoading(open)}
          data-lab-trigger="loading"
        >
          Ines Duarte
        </PreviewTrigger>{' '}
        loads her details when her card opens.
      </p>
      <p>
        <PreviewTrigger
          preview={card('Kofi Mensah')}
          isOpen={isOpen}
          onOpenChange={setOpen}
          data-lab-trigger="controlled"
        >
          Kofi Mensah
        </PreviewTrigger>{' '}
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
  const card = (name: string) => <PreviewSample name={name} />;
  return (
    <div>
      {Object.entries(textSizes).map(([size, fontSize]) => (
        <p key={size} data-lab-sentence={size} style={{ maxWidth: '16em', fontSize }}>
          Photos by{' '}
          <PreviewTrigger preview={card(inlineNames[0])} data-lab-inline-name="">
            {inlineNames[0]}
          </PreviewTrigger>
          , captions by{' '}
          <PreviewTrigger preview={card(inlineNames[1])} trigger="hover" data-lab-inline-name="">
            {inlineNames[1]}
          </PreviewTrigger>{' '}
          and layout by{' '}
          <PreviewTrigger preview={card(inlineNames[2])} data-lab-inline-name="">
            {inlineNames[2]}
          </PreviewTrigger>{' '}
          for the spring issue.
        </p>
      ))}
    </div>
  );
}

export function HoverCardPreviewCases() {
  return (
    <div data-lab-family="preview-trigger">
      <LabSection
        title="Opening a card"
        description="Click an avatar, an identity row, a name or a present person, or Tab to it and press Enter or Space. Escape or a press outside closes the card."
      >
        <Triggers />
      </LabSection>
      <LabSection
        title="Hover and focus"
        description="The first pointer entry or Tab to a person opens their card after a short delay without taking focus. Move into the card or Tab to enter it. Escape closes it even when hover leaves focus on the page. One card loads its details on opening; another is opened from outside."
      >
        <HoverCards />
      </LabSection>
      <LabSection
        title="Names in a sentence"
        description="A name alone sits on the sentence's baseline and wraps with it, at small, body and large text, by click or hover. Avatar and identity triggers stay centred."
      >
        <InlineNames />
      </LabSection>
      <LabSection
        title="Hover timings"
        description="Pick how long the card waits to open and to close, then hover the name or Tab to it: the card opens after the open delay and closes after the close delay once the pointer and focus leave. Each open change shows below."
      >
        <TimedHover />
      </LabSection>
      <LabSection
        title="Open at first"
        description="Mount a trigger whose card opens on its first render, uncontrolled: Escape or a press outside closes it like any other."
      >
        <InitiallyOpen />
      </LabSection>
      <LabSection
        title="A card that comes later"
        description="Without a card the trigger is a plain button: pressing it runs onPress. Attach the card, then focus the name before two seconds pass: the same button keeps focus, and a press now opens the card. Removing the card makes it a plain button again."
      >
        <LateCard />
      </LabSection>
      <LabSection
        title="Press beside a hover preview"
        description="Hover or focus the name to preview the card; a click, Enter or Space runs the trigger's own command instead of opening a dialog. Disable the trigger, then hover it before two seconds pass: locking closes the card, and enabling leaves it closed."
      >
        <HoverCommand />
      </LabSection>
    </div>
  );
}
