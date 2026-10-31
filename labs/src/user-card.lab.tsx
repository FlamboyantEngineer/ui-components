import { EditGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Modal, ModalTrigger } from '../../src/components/modal/modal.js';
import { UserCard } from '../../src/components/user-card/user-card.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

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
  </>,
);
