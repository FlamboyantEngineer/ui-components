import { EditGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';
import { badges } from './avatar-badge-cases.js';
import {
  badgePlacements,
  identityOptionProps,
  identityOptions,
  identityShapes,
} from './identity-options.js';

const statuses = ['active', 'away', 'busy', 'idle'] as const;
const statusTexts: Record<(typeof statuses)[number], string> = {
  active: 'In the office',
  away: 'Away until 14:00',
  busy: 'In a meeting',
  idle: 'Back soon',
};

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
  { id: 'team', label: 'Team', value: 'Research' },
  { id: 'time', label: 'Local time', value: '09:30' },
];

function contentProps(content: (typeof contents)[number]) {
  const description = content === 'name only' ? undefined : 'maria@example.com';
  const status = content === 'name only' || content === 'secondary line' ? {} : statusProps();
  const extra = content === 'details and actions' ? { details, actions } : {};
  return { description, ...status, ...extra, isLoading: content === 'loading' };
}

function statusProps() {
  return { status: 'away' as const, statusLabel: 'Away until 14:00' };
}

/** Details whose order the reader changes; the note keeps its draft because each row has an id. */
function ReorderedDetails() {
  const [isReversed, setReversed] = useState(false);
  const rows = [
    { id: 'team', label: 'Team', value: 'Research' },
    { id: 'note', label: 'Note', value: <input aria-label="Note for Maria" /> },
  ];
  return (
    <div data-lab-reordered="">
      <Button size="sm" onPress={() => setReversed((value) => !value)}>
        Reverse details
      </Button>
      <UserCard name="Maria Santos" details={isReversed ? rows.toReversed() : rows} />
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
      title="Every status"
      description="Each presence status with the provider's default words and with the caller's own statusLabel; the indicator and the status row follow the status."
    >
      <StateMatrix
        axes={{ label: ['default', 'caller'], status: statuses }}
        render={({ label, status }) => (
          <UserCard
            name="Lena Ortiz"
            description="Research"
            status={status}
            statusLabel={label === 'caller' ? statusTexts[status] : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Avatar options"
      description="Each shape against initials given by the caller (MF), a stable colour key, an explicit colour slot in a six-colour palette, and a picture with a sharper candidate for dense screens, loaded lazily."
    >
      <StateMatrix
        axes={{ option: identityOptions, shape: identityShapes }}
        render={({ option, shape }) => (
          <UserCard
            name="Maria Santos"
            description={option}
            shape={shape}
            {...identityOptionProps(option)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Corner badges"
      description="A flag in each logical corner, labelled (its words follow the name) or decorative, without a status and with one. The card shows its status in its own row rather than on the avatar, so the avatar's status corner stays free and a badge keeps the corner it asks for, bottom-end included."
    >
      <StateMatrix
        axes={{
          badge: ['labelled', 'decorative'],
          status: ['none', 'active'],
          placement: badgePlacements,
        }}
        render={({ badge, status, placement }) => (
          <UserCard
            name="Maria Santos"
            description="Lisbon office"
            status={status === 'none' ? undefined : status}
            badge={badges.flag.badge}
            badgeLabel={badge === 'labelled' ? badges.flag.badgeLabel : undefined}
            badgePlacement={placement}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Reordered details"
      description="Each detail carries an id, so a value keeps its state when the details change order."
    >
      <ReorderedDetails />
    </LabSection>
    <LabSection
      title="In a modal"
      description="A card shown in place inside a modal: its actions report without closing the modal, and it takes no focus."
    >
      <InModal />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the picture sits on the right and the loading skeleton fades toward the left, the end side."
    >
      <div dir="rtl" style={{ display: 'flex', gap: 16 }} data-lab-demo="rtl">
        <UserCard name="Maria Santos" {...contentProps('details and actions')} />
        <UserCard name="Maria Santos" {...contentProps('loading')} />
      </div>
    </LabSection>
  </>,
);
