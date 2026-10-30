import { CheckGlyph, EditGlyph, FolderGlyph } from '../../src/core/glyphs.js';
import { RecordChipCases } from './record-chip-cases.js';
import { RecordLabel } from '../../src/components/record-label/record-label.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const sizes = ['sm', 'md', 'lg'] as const;

const records = [
  { identifier: 'REQ-12', name: 'Brake pressure limits', icon: EditGlyph },
  { identifier: 'TEST-48', name: 'Cold start at minus twenty', icon: CheckGlyph },
  { identifier: 'DOC-3', name: 'Field guide', icon: FolderGlyph },
] as const;

mountLab(
  <>
    <div data-lab-family="record-label-main">
      <LabSection
        title="Parts and sizes"
        description="An icon and identifier that never break apart, with and without a name, plain and as a link."
      >
        <StateMatrix
          axes={{
            content: ['identifier', 'identifier and name', 'no icon'],
            kind: ['plain', 'link'],
            size: sizes,
          }}
          render={({ content, kind, size }) => (
            <RecordLabel
              identifier="REQ-12"
              name={content === 'identifier' ? undefined : 'Brake pressure limits'}
              icon={content === 'no icon' ? undefined : EditGlyph}
              href={kind === 'link' ? '#req-12' : undefined}
              size={size}
            />
          )}
        />
      </LabSection>
      <LabSection
        title="Truncation"
        description="In a 200px column the name is cut with its full text in a tooltip, or wraps; the identifier stays whole."
      >
        <StateMatrix
          axes={{ name: ['truncate', 'wrap'], kind: ['plain', 'link'] }}
          render={({ name, kind }) => (
            <div style={{ width: 200 }}>
              <RecordLabel
                identifier="REQ-1024"
                name="Brake pressure limits for wet and icy road surfaces"
                icon={EditGlyph}
                truncate={name === 'truncate'}
                href={kind === 'link' ? '#req-1024' : undefined}
              />
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Unavailable"
        description="A record the reader may not see, or that no longer exists: a generic glyph and text, no name, no link."
      >
        <StateMatrix
          axes={{ unavailable: ['restricted', 'missing'], size: sizes }}
          render={({ unavailable, size }) => (
            <RecordLabel
              identifier="REQ-12"
              name="Brake pressure limits"
              href="#req-12"
              unavailable={unavailable}
              size={size}
            />
          )}
        />
      </LabSection>
      <LabSection
        title="In a list"
        description="Linked labels in a list, one opening in a new tab."
      >
        <ul>
          {records.map((record, index) => (
            <li key={record.identifier}>
              <RecordLabel
                {...record}
                href={`#${record.identifier.toLowerCase()}`}
                isExternal={index === 2}
              />
            </li>
          ))}
        </ul>
      </LabSection>
    </div>
    <RecordChipCases />
  </>,
);
