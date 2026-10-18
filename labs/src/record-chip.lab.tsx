import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { RecordChip } from '../../src/components/record-chip/record-chip.js';
import { StatusLight } from '../../src/components/status-light/status-light.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;

interface SampleRecord {
  identifier: string;
  name: string;
  type: string;
  owner: string;
}

const initialReferences: readonly SampleRecord[] = [
  {
    identifier: 'REQ-12',
    name: 'Brake pressure limits',
    type: 'Requirement',
    owner: 'Maria Santos',
  },
  { identifier: 'TEST-48', name: 'Cold start at minus twenty', type: 'Test', owner: 'Jon Berg' },
  { identifier: 'RISK-7', name: 'Sensor drift over long trips', type: 'Risk', owner: 'Lena Ortiz' },
];

/** What a preview card shows about a record. */
function RecordPreview({ record }: { record: SampleRecord }) {
  return (
    <>
      <p>
        <strong>{record.identifier}</strong> {record.name}
      </p>
      <p>
        {record.type}, owned by {record.owner}
      </p>
    </>
  );
}

/** A field value listing references the reader can preview and remove. */
function ReferenceList() {
  const [references, setReferences] = useState(initialReferences);
  return (
    <div data-lab-demo="references">
      <p>
        Linked items:{' '}
        {references.map((record) => (
          <span key={record.identifier}>
            <RecordChip
              identifier={record.identifier}
              name={record.name}
              icon="link"
              href={`#${record.identifier.toLowerCase()}`}
              preview={<RecordPreview record={record} />}
              onRemove={() => setReferences((list) => list.filter((item) => item !== record))}
            />{' '}
          </span>
        ))}
        {references.length === 0 ? 'none' : null}
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Parts and layouts"
      description="The label alone, with a version, kind and state, and with a remove button, inline and stacked."
    >
      <StateMatrix
        axes={{
          parts: ['label', 'details', 'removable'],
          layout: ['inline', 'stacked'],
        }}
        render={({ parts, layout }) => (
          <RecordChip
            identifier="REQ-12"
            name="Brake pressure limits"
            icon="edit"
            href="#req-12"
            layout={layout}
            version={parts === 'label' ? undefined : 'v3'}
            type={parts === 'label' ? undefined : 'Requirement'}
            state={parts === 'label' ? undefined : <Badge tone="success">Approved</Badge>}
            onRemove={parts === 'removable' ? () => {} : undefined}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Sizes and states"
      description="Every size with a status badge or a status light as the state node."
    >
      <StateMatrix
        axes={{ state: ['badge', 'status light'], size: sizes }}
        render={({ state, size }) => (
          <RecordChip
            identifier="TEST-48"
            name="Cold start at minus twenty"
            icon="check"
            size={size}
            type="Test"
            state={
              state === 'badge' ? (
                <Badge tone="warning">In review</Badge>
              ) : (
                <StatusLight tone="danger">Failed</StatusLight>
              )
            }
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Previews"
      description="Hover or focus a linked label to preview the record; the second link opens in a new tab."
    >
      <StateMatrix
        axes={{ link: ['same tab', 'new tab'] }}
        render={({ link }) => (
          <RecordChip
            identifier="RISK-7"
            name="Sensor drift over long trips"
            icon="warning"
            href="#risk-7"
            isExternal={link === 'new tab'}
            preview={<RecordPreview record={initialReferences[2] as SampleRecord} />}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Unavailable"
      description="A restricted or missing record shows only that, keeping its remove button."
    >
      <StateMatrix
        axes={{ unavailable: ['restricted', 'missing'], layout: ['inline', 'stacked'] }}
        render={({ unavailable, layout }) => (
          <RecordChip
            identifier="REQ-99"
            name="Hidden name"
            href="#req-99"
            type="Requirement"
            layout={layout}
            unavailable={unavailable}
            onRemove={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection title="In a field" description="Preview a reference, or remove it.">
      <ReferenceList />
    </LabSection>
  </>,
);
