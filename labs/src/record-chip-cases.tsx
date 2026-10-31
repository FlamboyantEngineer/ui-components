import { CheckGlyph, EditGlyph, LinkGlyph, WarningGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { RecordLabel } from '../../src/components/record-label/record-label.js';
import { StatusLight } from '../../src/components/status-light/status-light.js';
import { LabSection, StateMatrix } from './chrome/index.js';

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
            <RecordLabel
              mode="chip"
              identifier={record.identifier}
              name={record.name}
              icon={LinkGlyph}
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

export function RecordChipCases() {
  return (
    <div data-lab-family="record-chip-cases">
      <>
        <LabSection
          title="Chip: Parts and layouts"
          description="The label alone, with a version, kind and state, and with a remove button, inline and stacked."
        >
          <StateMatrix
            axes={{
              parts: ['label', 'details', 'removable'],
              layout: ['inline', 'stacked'],
            }}
            render={({ parts, layout }) => (
              <RecordLabel
                mode="chip"
                identifier="REQ-12"
                name="Brake pressure limits"
                icon={EditGlyph}
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
          title="Chip: Sizes and states"
          description="Every size with a status badge or a status light as the state node."
        >
          <StateMatrix
            axes={{ state: ['badge', 'status light'], size: sizes }}
            render={({ state, size }) => (
              <RecordLabel
                mode="chip"
                identifier="TEST-48"
                name="Cold start at minus twenty"
                icon={CheckGlyph}
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
          title="Chip: Previews"
          description="Hover or focus a linked label to preview the record; the second link opens in a new tab."
        >
          <StateMatrix
            axes={{ link: ['same tab', 'new tab'] }}
            render={({ link }) => (
              <RecordLabel
                mode="chip"
                identifier="RISK-7"
                name="Sensor drift over long trips"
                icon={WarningGlyph}
                href="#risk-7"
                isExternal={link === 'new tab'}
                preview={<RecordPreview record={initialReferences[2] as SampleRecord} />}
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Chip: Caller labelling"
          description="The caller's name and description reach the link, or the hidden text of a chip without one."
        >
          <p id="record-chip-hint">Opens the record in the side panel.</p>
          <StateMatrix
            axes={{ link: ['linked', 'plain'], layout: ['inline', 'stacked'] }}
            render={({ link, layout }) => (
              <RecordLabel
                mode="chip"
                identifier="TEST-48"
                name="Cold start at minus twenty"
                type="Test"
                layout={layout}
                href={link === 'linked' ? '#test-48' : undefined}
                preview={<RecordPreview record={initialReferences[1] as SampleRecord} />}
                aria-label="TEST-48 Cold start at minus twenty, a test"
                aria-describedby="record-chip-hint"
              />
            )}
          />
        </LabSection>
        <LabSection
          title="Chip: Unavailable"
          description="A restricted or missing record shows only that, keeping its remove button."
        >
          <StateMatrix
            axes={{ unavailable: ['restricted', 'missing'], layout: ['inline', 'stacked'] }}
            render={({ unavailable, layout }) => (
              <RecordLabel
                mode="chip"
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
        <LabSection title="Chip: In a field" description="Preview a reference, or remove it.">
          <ReferenceList />
        </LabSection>
      </>
    </div>
  );
}
