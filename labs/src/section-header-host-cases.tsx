import { type CSSProperties, type ReactNode, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  type HeadingLevel,
  HeadingLevelContext,
  Section,
  SectionHeader,
  useHeadingLevel,
} from '../../src/components/section-header/section-header.js';
import { LabSection, StateMatrix } from './chrome/index.js';

/** A collapsible section whose expansion the page owns, with a toggle of its own and a log. */
function ControlledSection() {
  const [isExpanded, setExpanded] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const request = (next: boolean, from: string) => {
    setLog((entries) => [...entries, `${from}: ${next ? 'expand' : 'collapse'}`]);
    setExpanded(next);
  };
  return (
    <div data-lab-demo="controlled-section" style={{ width: 420 }}>
      <Button size="sm" onPress={() => request(!isExpanded, 'page')}>
        {isExpanded ? 'Collapse from the page' : 'Expand from the page'}
      </Button>
      <Section
        title="Greenhouse"
        description="Tomatoes and peppers under glass"
        collapsible
        isExpanded={isExpanded}
        onExpandedChange={(next) => request(next, 'title')}
        space="md"
      >
        <p style={{ margin: 0 }}>Water twice a day in summer.</p>
      </Section>
      <p>
        Expanded: <output data-lab-output="expanded">{String(isExpanded)}</output>
      </p>
      <ol aria-label="Expansion requests" data-lab-output="requests">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

/** A section that asks for each change and accepts only collapsing: it never re-expands itself. */
function RefusingSection() {
  const [requests, setRequests] = useState(0);
  const [isExpanded, setExpanded] = useState(true);
  return (
    <div data-lab-demo="refusing-section" style={{ width: 420 }}>
      <Section
        title="Archive"
        collapsible
        isExpanded={isExpanded}
        onExpandedChange={(next) => {
          setRequests((count) => count + 1);
          if (!next) setExpanded(false);
        }}
        space="md"
      >
        <p style={{ margin: 0 }}>Last year&apos;s harvest records.</p>
      </Section>
      <p>
        Requests: <output data-lab-output="requests">{requests}</output>
      </p>
    </div>
  );
}

/** A caller's own heading element, levelled by the sections around it. */
function HostHeading({ level, children }: { level?: HeadingLevel; children: ReactNode }) {
  const resolved = useHeadingLevel(level);
  const Heading = `h${resolved}` as const;
  return (
    <Heading data-lab-host-heading={level === undefined ? 'inferred' : 'explicit'}>
      {children} <small>(h{resolved})</small>
    </Heading>
  );
}

const sectionSpaces = ['none', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;

const host: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: 260,
  height: 120,
  outline: '1px dotted currentColor',
};

export function SectionHeaderHostCases() {
  return (
    <div data-lab-family="section-header-host-cases">
      <LabSection
        title="Every spacing"
        description="The gap between the header and the content at each step of the layout scale, from none to 3xl."
      >
        <StateMatrix
          axes={{ space: sectionSpaces, column: ['260px'] }}
          render={({ space }) => (
            <div style={{ width: 260, outline: '1px dotted currentColor' }}>
              <Section title={`Pond, ${space} gap`} space={space} data-lab-space={space}>
                <p style={{ margin: 0 }}>Lilies and reeds.</p>
              </Section>
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Grow, fill and clip"
        description="A section in a positioned 260 by 120 pixel flex host above a fixed 30 pixel footer: grow takes the free height, fill asks for the host's full height (the flex host keeps the footer's share), clip cuts content that does not fit. Without any, the long content runs past the host."
      >
        <StateMatrix
          axes={{ containment: ['none', 'grow', 'fill', 'clip'] as const }}
          render={({ containment }) => (
            <div style={host}>
              <Section
                title={`Hedge, ${containment}`}
                space="xs"
                grow={containment === 'grow'}
                fill={containment === 'fill'}
                clip={containment === 'clip'}
                data-lab-containment={containment}
              >
                <p style={{ margin: 0, height: 140 }}>Hawthorn, holly and hazel.</p>
              </Section>
              <div style={{ height: 30, flex: 'none' }}>Footer</div>
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Controlled expansion"
        description="The page owns isExpanded: the title and the page's own button both request a change through onExpandedChange, and the log lists each request with where it came from."
      >
        <ControlledSection />
      </LabSection>
      <LabSection
        title="Refused expansion"
        description="This page accepts only collapsing: press the title twice. The second press asks to expand, onExpandedChange counts it, and the section stays collapsed."
      >
        <RefusingSection />
      </LabSection>
      <LabSection
        title="Host headings"
        description="A caller's own heading reads its level with useHeadingLevel: inferred one below the section around it, or explicit. Each shows the level it resolved."
      >
        <div data-lab-demo="host-headings" style={{ width: 420 }}>
          <HeadingLevelContext value={1}>
            <Section title="Allotment" space="md">
              <HostHeading>Inferred inside a level 2 section</HostHeading>
              <Section title="Beds" space="md">
                <HostHeading>Inferred inside a level 3 section</HostHeading>
                <HostHeading level={5}>Explicitly level 5</HostHeading>
                <SectionHeader title="Carrots" />
              </Section>
            </Section>
          </HeadingLevelContext>
        </div>
      </LabSection>
    </div>
  );
}
