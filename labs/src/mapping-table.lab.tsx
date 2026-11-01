import { useState, type CSSProperties } from 'react';
import {
  MappingTable,
  suggestMapping,
  summarizeMapping,
  type MappingTableColumn,
  type MappingTableSuggest,
  type MappingTableTarget,
  type MappingTableValue,
} from '../../src/components/mapping-table/mapping-table.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column: CSSProperties = { width: 720 };

const columns: MappingTableColumn[] = [
  { id: 'full-name', label: 'Full name', samples: ['Ada Lovelace', 'Alan Turing', 'Grace Hopper'] },
  { id: 'e-mail', label: 'E-mail', samples: ['ada@example.com', 'alan@example.com'] },
  { id: 'telephone', label: 'Telephone', samples: ['+44 20 7946 0000', '+1 202 555 0100'] },
  { id: 'town', label: 'Town', samples: ['London', 'Wilmslow', 'Arlington'] },
  { id: 'notes', label: 'Notes', samples: ['Met at the fair', ''] },
];

const targets: MappingTableTarget[] = [
  { id: 'name', label: 'Name', isRequired: true },
  { id: 'email', label: 'Email', isRequired: true },
  { id: 'phone', label: 'Phone' },
  { id: 'city', label: 'City' },
  { id: 'company', label: 'Company' },
  // An id objects inherit a property under: it maps and warns like any other (UIC-MAPPING-TABLE-1.5).
  { id: 'constructor', label: 'Builder' },
];

const synonyms = new Map<string, readonly string[]>([
  ['name', ['name', 'fullname']],
  ['email', ['email', 'mail']],
  ['phone', ['phone', 'telephone', 'mobile']],
  ['city', ['city', 'town']],
]);

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '');

/** Matches a column's name against each target's name and a few synonyms. */
const suggestTarget: MappingTableSuggest = (source, choices) =>
  choices.find((target) => (synonyms.get(target.id) ?? []).includes(normalize(source.label)))?.id ??
  null;

const suggested = suggestMapping(columns, targets, suggestTarget);

const states = {
  suggested,
  empty: {},
  incomplete: { 'full-name': 'name', telephone: 'phone' },
  duplicate: { ...suggested, notes: 'email' },
} as const satisfies Record<string, MappingTableValue>;

function LiveMapping() {
  const [mapping, setMapping] = useState<MappingTableValue>(suggested);
  const summary = summarizeMapping(columns, targets, mapping);
  return (
    <div data-lab-demo="live" style={column}>
      <MappingTable
        aria-label="Contact columns"
        columns={columns}
        targets={targets}
        value={mapping}
        onChange={setMapping}
        getSuggestion={suggestTarget}
      />
      <p>
        <Button size="sm" variant="primary" isDisabled={!summary.isComplete}>
          Import contacts
        </Button>
      </p>
      <pre data-lab-value>{JSON.stringify(mapping, null, 1)}</pre>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="The suggested mapping, nothing mapped, required targets left unmapped, and a target chosen for two columns."
    >
      <StateMatrix
        axes={{ state: Object.keys(states) as Array<keyof typeof states> }}
        render={({ state }) => (
          <div style={column}>
            <MappingTable
              aria-label={`Mapping, ${state}`}
              columns={columns}
              targets={targets}
              defaultValue={states[state]}
              getSuggestion={suggestTarget}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Mapping"
      description="Choose a target or Don’t import for each column. The import button waits until every required target is mapped. Builder's id is constructor, a name every object inherits; choosing it for two columns warns like any other target."
    >
      <LiveMapping />
    </LabSection>
    <LabSection
      title="Read-only"
      description="An uncontrolled table that starts from its suggestions, shown read-only."
    >
      <div style={column} data-lab-demo="read-only">
        <MappingTable
          aria-label="Saved mapping"
          columns={columns}
          targets={targets}
          getSuggestion={suggestTarget}
          isReadOnly
        />
      </div>
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page a column whose target is chosen twice is marked on its right edge, the start side."
    >
      <div dir="rtl" style={column} data-lab-demo="rtl">
        <MappingTable
          aria-label="Mapping, right to left"
          columns={columns}
          targets={targets}
          defaultValue={states.duplicate}
          getSuggestion={suggestTarget}
        />
      </div>
    </LabSection>
  </>,
);
