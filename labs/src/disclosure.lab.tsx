import { EditGlyph } from '../../src/core/glyphs.js';
import { useState, type CSSProperties } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  Disclosure,
  DisclosureGroup,
  DisclosureHeader,
  DisclosurePanel,
  DisclosureTitle,
} from '../../src/components/disclosure/disclosure.js';
import { Outline } from '../../src/components/outline/outline.js';
import { HeadingLevelContext } from '../../src/components/section-header/section-header.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column = (width: number): CSSProperties => ({ width });

const questions = [
  { id: 'season', title: 'When is the market open?', answer: 'Saturdays from April to October.' },
  { id: 'parking', title: 'Is there parking?', answer: 'Free parking behind the old mill.' },
  { id: 'dogs', title: 'Can I bring a dog?', answer: 'Dogs on a lead are welcome.' },
] as const;

function Accordion() {
  return (
    <div style={column(360)} data-lab-demo="accordion">
      <DisclosureGroup defaultExpandedKeys={['season']}>
        {questions.map((question) => (
          <Disclosure key={question.id} id={question.id} title={question.title}>
            <p>{question.answer}</p>
          </Disclosure>
        ))}
        <Disclosure id="stalls" title="Can I rent a stall?" isDisabled>
          <p>Stalls are booked for this season.</p>
        </Disclosure>
      </DisclosureGroup>
    </div>
  );
}

function ControlledGroup() {
  const [keys, setKeys] = useState<Set<Key>>(new Set(['apples']));
  const fruits = ['apples', 'pears', 'plums'];
  return (
    <div style={column(360)} data-lab-demo="multiple">
      <p>
        <Button size="sm" onPress={() => setKeys(new Set(fruits))}>
          Expand all
        </Button>{' '}
        <Button size="sm" onPress={() => setKeys(new Set())}>
          Collapse all
        </Button>
      </p>
      <DisclosureGroup allowsMultipleExpanded expandedKeys={keys} onExpandedChange={setKeys}>
        {fruits.map((fruit) => (
          <Disclosure key={fruit} id={fruit} title={`${fruit[0]?.toUpperCase()}${fruit.slice(1)}`}>
            <p>Twelve {fruit} trees in the orchard.</p>
          </Disclosure>
        ))}
      </DisclosureGroup>
      <p>
        Open: <output data-lab-output="keys">{[...keys].join(', ') || 'none'}</output>
      </p>
    </div>
  );
}

function CustomHeader() {
  const [edits, setEdits] = useState(0);
  return (
    <div style={column(360)} data-lab-demo="header">
      <Disclosure indicatorPosition="end" defaultExpanded>
        <DisclosureHeader>
          <DisclosureTitle>Delivery address</DisclosureTitle>
          <Button
            icon={EditGlyph}
            label="Edit address"
            size="sm"
            onPress={() => setEdits(edits + 1)}
          />
        </DisclosureHeader>
        <DisclosurePanel role="region">
          <p>12 Harbour Road, Porto</p>
        </DisclosurePanel>
      </Disclosure>
      <p>
        Edits: <output data-lab-output="edits">{edits}</output>
      </p>
    </div>
  );
}

function ControlledDisclosure() {
  const [isExpanded, setExpanded] = useState(false);
  return (
    <div style={column(360)} data-lab-demo="controlled">
      <p>
        <Button size="sm" onPress={() => setExpanded(!isExpanded)}>
          {isExpanded ? 'Hide recipe' : 'Show recipe'}
        </Button>
      </p>
      <Disclosure title="Lemon cake" isExpanded={isExpanded} onExpandedChange={setExpanded}>
        <ol>
          <li>Whisk eggs and sugar.</li>
          <li>Fold in flour and lemon zest.</li>
          <li>Bake for forty minutes.</li>
        </ol>
      </Disclosure>
    </div>
  );
}

function NestedLevels() {
  return (
    <div style={column(360)} data-lab-demo="nested">
      <HeadingLevelContext value={2}>
        <Disclosure title="Garden" defaultExpanded>
          <Disclosure title="Orchard" defaultExpanded>
            <DisclosureGroup defaultExpandedKeys={['apples']}>
              <Disclosure id="apples" title="Apples">
                <p>Twelve trees.</p>
              </Disclosure>
              <Disclosure id="pears" title="Pears">
                <p>Six trees.</p>
              </Disclosure>
            </DisclosureGroup>
          </Disclosure>
          <Disclosure title="Pond">
            <p>Water lilies and frogs.</p>
          </Disclosure>
        </Disclosure>
      </HeadingLevelContext>
      <Disclosure title="Greenhouse" headingLevel={2} defaultExpanded>
        <Disclosure title="Seedlings">
          <p>Tomatoes and peppers.</p>
        </Disclosure>
      </Disclosure>
    </div>
  );
}

function DisabledGroup() {
  return (
    <div style={column(360)} data-lab-demo="disabled-group">
      <DisclosureGroup isDisabled defaultExpandedKeys={['winter']}>
        <Disclosure id="winter" title="Winter opening">
          <p>Closed until March.</p>
        </Disclosure>
        <Disclosure id="summer" title="Summer opening">
          <p>Open every day.</p>
        </Disclosure>
      </DisclosureGroup>
    </div>
  );
}

/** An accordion section holding its own disclosure, and a disclosure holding an outline. */
function NestedContent() {
  return (
    <div style={column(360)} data-lab-demo="nested-content">
      <DisclosureGroup defaultExpandedKeys={['delivery']}>
        <Disclosure id="delivery" title="Delivery">
          <p>Ships in two days.</p>
          <Disclosure title="Advanced delivery">
            <p>Leave with a neighbour.</p>
          </Disclosure>
        </Disclosure>
        <Disclosure id="returns" title="Returns">
          <p>Free within a month.</p>
        </Disclosure>
      </DisclosureGroup>
      <Disclosure title="Contents" defaultExpanded>
        <Outline
          aria-label="Guide contents"
          headings={[
            { id: 'start', label: 'Getting started', level: 1 },
            { id: 'install', label: 'Install', level: 2 },
          ]}
        />
      </Disclosure>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Indicators and states"
      description="A collapsed, an expanded and a disabled disclosure with the indicator at the start and at the end."
    >
      <StateMatrix
        axes={{ indicator: ['start', 'end'], state: ['collapsed', 'expanded', 'disabled'] }}
        render={({ indicator, state }) => (
          <div style={column(240)}>
            <Disclosure
              title="Opening hours"
              indicatorPosition={indicator}
              defaultExpanded={state === 'expanded'}
              isDisabled={state === 'disabled'}
            >
              <p>Daily from nine to five.</p>
            </Disclosure>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Accordion"
      description="A group that opens one answer at a time; the last disclosure is disabled. Arrow keys, Home and End move between the triggers."
    >
      <Accordion />
    </LabSection>
    <LabSection
      title="Several open"
      description="A group that keeps several disclosures open, with its expanded keys controlled by buttons."
    >
      <ControlledGroup />
    </LabSection>
    <LabSection
      title="Custom header"
      description="A header holding the title and an action that does not toggle the disclosure; the panel is a named region and the indicator sits at the end."
    >
      <CustomHeader />
    </LabSection>
    <LabSection
      title="Controlled"
      description="A disclosure whose state an outside button also controls."
    >
      <ControlledDisclosure />
    </LabSection>
    <LabSection
      title="Nested levels"
      description="Disclosures nested in panels take the next heading level each, from a host level of 2, and from an explicit level 2 for the greenhouse."
    >
      <NestedLevels />
    </LabSection>
    <LabSection
      title="Disabled group"
      description="A disabled group disables every trigger and keeps the open disclosure open."
    >
      <DisabledGroup />
    </LabSection>
    <LabSection
      title="Nested content"
      description="A disclosure inside an accordion section keeps its own state: opening Advanced delivery leaves Delivery open. The outline inside Contents owns its toggles: closing Getting started leaves Contents open."
    >
      <NestedContent />
    </LabSection>
    <LabSection
      title="Find in page"
      description="The collapsed panel keeps its text findable: searching the page for “marmalade” opens it."
    >
      <div style={column(360)} data-lab-demo="find">
        <Disclosure title="Pantry">
          <p>Three jars of orange marmalade.</p>
        </Disclosure>
      </div>
    </LabSection>
  </>,
);
