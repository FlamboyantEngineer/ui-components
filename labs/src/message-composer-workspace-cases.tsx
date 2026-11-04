import { useState } from 'react';
import { MessageComposer } from '../../src/components/message-composer/index.js';
import { RichMessageComposer } from '../../src/components/message-composer/rich/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { UiProvider } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { LabSection } from './chrome/index.js';
import { requireDefined } from './require-defined.js';

const draft = JSON.stringify({ text: 'Same text in both', tokens: [] });

const workspaces = [
  { value: 'north', label: 'North', storage: createMemoryStorage({ draft }) },
  { value: 'south', label: 'South', storage: createMemoryStorage({ draft }) },
];

/**
 * One composer under two storage adapters that hold the same draft: a message sent in one
 * workspace waits two seconds for the host, and switching workspace meanwhile leaves the other's
 * draft alone and lets it send.
 */
function WorkspaceComposer() {
  const [workspace, setWorkspace] = useState('north');
  const [sent, setSent] = useState<string[]>([]);
  const current = requireDefined(workspaces.find((item) => item.value === workspace));
  const send = (text: string) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setSent((list) => [...list, `${current.label}: ${text}`]);
        resolve();
      }, 2000);
    });
  return (
    <>
      <SegmentedChoice
        aria-label="Workspace"
        options={workspaces}
        value={workspace}
        onChange={(value) => {
          if (value) setWorkspace(value);
        }}
      />
      <UiProvider storage={current.storage}>
        <MessageComposer
          aria-label={`Message in ${current.label}`}
          persistKey="draft"
          onSubmit={send}
          data-lab-composer="workspace"
        />
      </UiProvider>
      <output data-lab-workspace-sent>{sent.join(' · ') || 'Nothing accepted yet.'}</output>
    </>
  );
}

const richWorkspaces = [
  { value: 'east', label: 'East', storage: createMemoryStorage({ draft }) },
  { value: 'west', label: 'West', storage: createMemoryStorage({ draft }) },
];

/** One rich composer under two storage adapters holding the same text: each has its own undo. */
function RichWorkspaceComposer() {
  const [workspace, setWorkspace] = useState('east');
  const current = requireDefined(richWorkspaces.find((item) => item.value === workspace));
  return (
    <>
      <SegmentedChoice
        aria-label="Rich workspace"
        options={richWorkspaces}
        value={workspace}
        onChange={(value) => {
          if (value) setWorkspace(value);
        }}
      />
      <UiProvider storage={current.storage}>
        <RichMessageComposer
          aria-label={`Rich message in ${current.label}`}
          persistKey="draft"
          data-lab-composer="rich-workspace"
        />
      </UiProvider>
    </>
  );
}

export function WorkspaceComposerSection() {
  return (
    <>
      <LabSection
        title="Sending across storage"
        description="Each workspace keeps its draft in its own storage adapter, under the same key and with the same text. Send in North, then switch to South before the host accepts the message: South stays free to send and keeps its draft, and only North's stored draft empties."
      >
        <WorkspaceComposer />
      </LabSection>
      <LabSection
        title="Undo per draft owner"
        description="A rich composer whose two workspaces hold the same text. Edit East, pause, put the text back, then switch to West: Ctrl+Z there changes nothing, since each draft owner starts its own undo history."
      >
        <RichWorkspaceComposer />
      </LabSection>
    </>
  );
}
