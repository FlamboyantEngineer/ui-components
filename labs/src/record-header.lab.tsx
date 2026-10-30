import { FolderGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { ActionRow } from '../../src/components/action-row/action-row.js';
import { Attribution } from '../../src/components/attribution/attribution.js';
import { Badge } from '../../src/components/badge/badge.js';
import { RecordHeader } from '../../src/components/record-header/record-header.js';
import { StatusLight } from '../../src/components/status-light/status-light.js';
import {
  TransitionMenu,
  type TransitionMenuState,
} from '../../src/components/transition-menu/transition-menu.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

/** A fixed clock, so every time in the matrix reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);
const noop = () => undefined;
const maria = { name: 'Maria Santos', colorKey: 'maria' };

type MatrixParts = 'identity and title' | 'with status' | 'complete';

function partsProps(parts: MatrixParts) {
  if (parts === 'identity and title') return {};
  const status = (
    <>
      <Badge tone="info">Open</Badge>
      <StatusLight tone="warning">High priority</StatusLight>
    </>
  );
  if (parts === 'with status') return { status };
  return {
    status,
    meta: [
      <Attribution key="created" time="2026-04-18T09:00:00" person={maria} getNow={getNow} />,
      'Kitchen tools',
    ],
    actions: (
      <ActionRow
        size="sm"
        actions={[
          { verb: 'edit', onPress: noop },
          { verb: 'delete', onPress: noop },
        ]}
      />
    ),
  };
}

function MatrixCell({ parts, title }: { parts: MatrixParts; title: string }) {
  const [text, setText] = useState('Cooling rack for bread');
  return (
    <RecordHeader
      identifier="REQ-12"
      icon={FolderGlyph}
      title={text}
      onTitleChange={title === 'editable' ? setText : undefined}
      headingLevel={3}
      {...partsProps(parts)}
    />
  );
}

const states: TransitionMenuState[] = [
  { id: 'open', label: 'Open', tone: 'info' },
  { id: 'active', label: 'In progress', tone: 'warning' },
  { id: 'done', label: 'Done', tone: 'success' },
];

/** A requirement's header: an editable title that saves after a moment, its state and actions. */
function RequirementHeader() {
  const [title, setTitle] = useState('Cooling rack holds twelve loaves');
  const [state, setState] = useState<Key>('open');
  const [log, setLog] = useState('Nothing yet');
  const saveTitle = (next: string) =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        if (!next.trim()) {
          reject(new Error('A title is required.'));
          return;
        }
        setTitle(next);
        resolve();
      }, 400);
    });
  return (
    <div data-lab-demo="requirement">
      <RecordHeader
        identifier="REQ-42"
        icon={FolderGlyph}
        title={title}
        onTitleChange={saveTitle}
        headingLevel={3}
        status={
          <TransitionMenu
            states={states}
            value={state}
            transitions={states
              .filter((entry) => entry.id !== state)
              .map((entry) => ({ id: `to-${entry.id}`, to: entry.id }))}
            onTransition={(change) => {
              setState(change.to);
              setLog(`Moved to ${String(change.to)}`);
            }}
          />
        }
        meta={[
          <Attribution key="created" time={new Date().toISOString()} person={maria} />,
          'Kitchen tools',
        ]}
        actions={
          <ActionRow
            size="sm"
            actions={[
              { verb: 'edit', label: 'Edit details', onPress: () => setLog('Edit details') },
              { verb: 'delete', onPress: () => setLog('Delete') },
            ]}
          />
        }
      />
      <p data-lab-output="log">Last action: {log}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The identifier with its copy button and the title, then with a status, then complete with metadata and actions; a static and an editable title. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{
          parts: ['identity and title', 'with status', 'complete'],
          title: ['static', 'editable'],
        }}
        render={({ parts, title }) => <MatrixCell parts={parts} title={title} />}
      />
    </LabSection>
    <LabSection
      title="A requirement"
      description="Copy the identifier, rename the title in place (an empty title is refused), move the state and use the actions."
    >
      <RequirementHeader />
    </LabSection>
  </>,
);
