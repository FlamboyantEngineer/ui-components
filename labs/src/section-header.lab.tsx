import { useState, type CSSProperties } from 'react';
import { Card } from '../../src/components/card/card.js';
import { Section, SectionHeader } from '../../src/components/section-header/section-header.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column = (width: number): CSSProperties => ({ width, outline: '1px dotted currentColor' });

function Actions({ disabled = false }: { disabled?: boolean }) {
  return (
    <>
      <button type="button" disabled={disabled}>
        Refresh
      </button>
      <button type="button">Add city</button>
    </>
  );
}

function Interactive() {
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  return (
    <div style={column(420)}>
      <Section
        title={`Cities (${count})`}
        description={busy ? null : 'Places to visit this year'}
        headingLevel={3}
        data-lab-section-header="interactive"
        actions={
          <>
            <button type="button" onClick={() => setCount((value) => value + 1)}>
              Add city
            </button>
            <button type="button" aria-pressed={busy} onClick={() => setBusy((value) => !value)}>
              Hide description
            </button>
          </>
        }
      >
        <label>
          Notes <input defaultValue="Lisbon in spring" />
        </label>
      </Section>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Parts"
      description="Title only, with a description, with actions and with both, at 420px and in a narrow 220px column."
    >
      <StateMatrix
        axes={{
          parts: ['title', 'description', 'actions', 'description and actions'],
          width: ['420', '220'],
        }}
        render={({ parts, width }) => (
          <div style={column(Number(width))}>
            <SectionHeader
              title="Orchard"
              description={
                parts.includes('description') ? 'Apples, pears and plums in rows' : undefined
              }
              actions={parts.includes('actions') ? <Actions /> : undefined}
              data-lab-section-header={`${parts} ${width}`}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Heading levels"
      description="The same header at each heading level; the presentation does not change."
    >
      <StateMatrix
        axes={{ headingLevel: ['3', '4', '5', '6'], column: ['320px'] }}
        render={({ headingLevel }) => (
          <div style={column(320)}>
            <SectionHeader
              title={`Level ${headingLevel}`}
              description="Supporting text"
              headingLevel={Number(headingLevel) as 3 | 4 | 5 | 6}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Sections"
      description="Sections named by their title, with each spacing before the content."
    >
      <StateMatrix
        axes={{ space: ['xs', 'md', '2xl', '3xl'], column: ['260px'] }}
        render={({ space }) => (
          <div style={column(260)}>
            <Section
              title={`Meadow, ${space} gap`}
              description="Grasses and wild flowers"
              actions={<Actions disabled />}
              space={space}
            >
              <p style={{ margin: 0 }}>Clover, poppies and cornflowers.</p>
            </Section>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Framed sections"
      description="A framed section is a Card given the same title, description, actions and heading level: the same header parts, named by the title, at 420px and 220px."
    >
      <StateMatrix
        axes={{ frame: ['section', 'card'], width: ['420', '220'] }}
        render={({ frame, width }) => {
          const props = {
            title: `Harbour, ${frame} ${width}`,
            description: 'Boats moored along the quay',
            actions: <Actions />,
            headingLevel: 3 as const,
            'data-lab-frame': `${frame} ${width}`,
          };
          return (
            <div style={column(Number(width))}>
              {frame === 'card' ? (
                <Card {...props}>
                  <p style={{ margin: 0 }}>Ferries leave every hour.</p>
                </Card>
              ) : (
                <Section {...props}>
                  <p style={{ margin: 0 }}>Ferries leave every hour.</p>
                </Section>
              )}
            </div>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Mounted lifecycle"
      description="Changing the title, description and actions keeps the section's content and name reference."
    >
      <Interactive />
    </LabSection>
  </>,
);
