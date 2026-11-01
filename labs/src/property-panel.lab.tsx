import {
  CheckGlyph,
  CloseGlyph,
  MinusGlyph,
  PlusGlyph,
  RestoreGlyph,
  UndoGlyph,
} from '../../src/core/glyphs.js';
import { useState, type ReactNode } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { Switch } from '../../src/components/switch/switch.js';
import {
  PropertyCard,
  PropertyGroup,
  PropertyIconGroup,
  PropertyPanel,
  PropertyRow,
  PropertySection,
  PropertyStrip,
  PropertyStripCell,
  type PropertyPanelLabelLayout,
} from '../../src/components/property-panel/property-panel.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { TextSetting } from './property-text-setting.js';

const layouts = ['responsive', 'inline'] as const;
const widths = { narrow: 300, wide: 440 } as const;
const rowStates = [
  'plain',
  'unit and hint',
  'required',
  'overridden',
  'wide',
  'description and actions',
  'group',
] as const;
const sectionStates = [
  'open',
  'closed',
  'counted',
  'explicit zero',
  'overridden',
  'actions',
  'description and meta',
  'disabled',
] as const;
const cardStates = ['closed', 'open', 'summary', 'overridden', 'actions'] as const;

function Panel({
  name,
  layout,
  width,
  children,
}: {
  name: string;
  layout: PropertyPanelLabelLayout;
  width: number;
  children: ReactNode;
}) {
  return (
    <div data-lab-column={width} style={{ width }}>
      <PropertyPanel aria-label={name} labelLayout={layout}>
        {children}
      </PropertyPanel>
    </div>
  );
}

function RowSample({ state }: { state: (typeof rowStates)[number] }) {
  if (state === 'group') {
    return (
      <PropertyGroup heading="Paper">
        <TextSetting label="Size" value="A4" />
        <TextSetting label="Orientation" value="Portrait" />
      </PropertyGroup>
    );
  }
  if (state === 'wide') {
    return <TextSetting label="Caption text" value="A long caption over the frame" wide />;
  }
  return (
    <TextSetting
      label="Width"
      value="640"
      unit={state === 'unit and hint' ? 'px' : undefined}
      hint={state === 'unit and hint' ? 'Up to 2000' : undefined}
      isRequired={state === 'required'}
      isOverridden={state === 'overridden'}
      description={state === 'description and actions' ? 'The width of the frame.' : undefined}
      actions={
        state === 'description and actions' ? (
          <Button icon={RestoreGlyph} label="Reset width" size="sm" />
        ) : undefined
      }
    />
  );
}

function SectionSample({ state, name }: { state: (typeof sectionStates)[number]; name: string }) {
  return (
    <PropertySection
      title="Colours"
      defaultExpanded={state !== 'closed'}
      count={state === 'explicit zero' ? 0 : undefined}
      isDisabled={state === 'disabled'}
      description={state === 'description and meta' ? 'Colours of the frame.' : undefined}
      meta={state === 'description and meta' ? 'shared' : undefined}
      actions={
        state === 'actions' ? (
          <Button icon={PlusGlyph} label={`Add colour to ${name}`} size="sm" />
        ) : undefined
      }
    >
      {state === 'explicit zero' ? (
        <p>No swatches yet.</p>
      ) : (
        <>
          <TextSetting label="Fill" value="Teal" isOverridden={state === 'overridden'} />
          {state === 'counted' ? <TextSetting label="Stroke" value="Navy" /> : null}
        </>
      )}
    </PropertySection>
  );
}

function CardSample({ state, name }: { state: (typeof cardStates)[number]; name: string }) {
  return (
    <PropertyCard
      name="Heading"
      summary={state === 'summary' ? 'Serif 22' : undefined}
      defaultExpanded={state === 'open'}
      isOverridden={state === 'overridden'}
      actions={
        state === 'actions' ? (
          <Button icon={UndoGlyph} label={`Reset heading in ${name}`} size="sm" />
        ) : undefined
      }
    >
      <TextSetting label="Font" value="Serif" />
    </PropertyCard>
  );
}

function StripSample({ variant, name }: { variant: 'separate' | 'segmented'; name: string }) {
  return (
    <>
      <PropertyRow label="Style">
        <PropertyIconGroup aria-label={`Style in ${name}`} variant={variant}>
          <Button icon={CheckGlyph} label="Checked" size="sm" isSelected />
          <Button icon={MinusGlyph} label="Mixed" size="sm" />
          <Button icon={CloseGlyph} label="Cleared" size="sm" />
        </PropertyIconGroup>
      </PropertyRow>
      <PropertyRow label="Spacing" unit="pt" keywords={['Before', 'After']}>
        <PropertyStrip>
          <PropertyStripCell letter="B" label="Before">
            <input aria-label="Spacing before" defaultValue="4" size={3} />
          </PropertyStripCell>
          <PropertyStripCell letter="A" label="After">
            <input aria-label="Spacing after" defaultValue="8" size={3} />
          </PropertyStripCell>
        </PropertyStrip>
      </PropertyRow>
    </>
  );
}

const panelLocks = ['editable', 'disabled', 'read-only'] as const;

/** Three sections opened by the panel: one at a time, or all at once from the buttons. */
function GroupedSections({ isAccordion }: { isAccordion: boolean }) {
  const [keys, setKeys] = useState<Set<Key>>(new Set(['page']));
  const name = isAccordion ? 'Accordion' : 'Expand all';
  return (
    <div data-lab-grouped={isAccordion ? 'accordion' : 'all'} style={{ width: widths.wide }}>
      {isAccordion ? null : (
        <div data-lab-toolbar>
          <Button size="sm" onPress={() => setKeys(new Set(['page', 'text', 'print']))}>
            Expand all
          </Button>{' '}
          <Button size="sm" onPress={() => setKeys(new Set())}>
            Collapse all
          </Button>
        </div>
      )}
      <PropertyPanel
        aria-label={name}
        allowsMultipleExpanded={!isAccordion}
        expandedKeys={keys}
        onExpandedChange={setKeys}
      >
        <PropertySection id="page" title="Page">
          <TextSetting label="Paper size" value="A4" />
        </PropertySection>
        <PropertySection id="text" title="Text">
          <TextSetting label="Font" value="Serif" />
        </PropertySection>
        <PropertySection id="print" title="Print">
          <TextSetting label="Copies" value="2" />
        </PropertySection>
      </PropertyPanel>
      <p data-lab-output>Open: {[...keys].join(', ') || 'none'}</p>
    </div>
  );
}

/** A panel that starts or stops opening its sections as an accordion; drafts inside survive. */
function SwitchingPanel() {
  const [isAccordion, setAccordion] = useState(false);
  return (
    <div data-lab-switching style={{ width: widths.wide }}>
      <Switch isSelected={isAccordion} onChange={setAccordion}>
        Accordion
      </Switch>
      <PropertyPanel
        aria-label="Switching panel"
        allowsMultipleExpanded={isAccordion ? false : undefined}
        defaultExpandedKeys={isAccordion ? ['page'] : undefined}
      >
        <PropertySection id="page" title="Page">
          <TextSetting label="Title" value="Report" />
        </PropertySection>
        <PropertySection id="text" title="Text">
          <TextSetting label="Font" value="Serif" />
        </PropertySection>
      </PropertyPanel>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Rows"
      description="Each row state in a 300 and 440 pixel panel. The responsive layout stacks labels below 360 pixels; inline keeps them beside."
    >
      <StateMatrix
        axes={{ row: rowStates, layout: layouts, width: ['narrow', 'wide'] }}
        render={({ row, layout, width }) => {
          const name = `Rows ${row} ${layout} ${width}`;
          return (
            <Panel name={name} layout={layout} width={widths[width]}>
              <RowSample state={row} />
            </Panel>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Sections"
      description="Open, closed, counted, an explicit zero count, an overridden row, actions, a description with meta, and disabled."
    >
      <StateMatrix
        axes={{ section: sectionStates, layout: layouts }}
        render={({ section, layout }) => {
          const name = `Sections ${section} ${layout}`;
          return (
            <Panel name={name} layout={layout} width={widths.wide}>
              <SectionSample state={section} name={name} />
            </Panel>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Cards"
      description="Closed, open, with a summary, overridden and with an action."
    >
      <StateMatrix
        axes={{ card: cardStates, layout: layouts }}
        render={({ card, layout }) => {
          const name = `Cards ${card} ${layout}`;
          return (
            <Panel name={name} layout={layout} width={widths.wide}>
              <CardSample state={card} name={name} />
            </Panel>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Strips and icon groups"
      description="An icon group in each framing variant and a strip of two cells."
    >
      <StateMatrix
        axes={{ variant: ['separate', 'segmented'], layout: layouts }}
        render={({ variant, layout }) => {
          const name = `Strips ${variant} ${layout}`;
          return (
            <Panel name={name} layout={layout} width={widths.wide}>
              <StripSample variant={variant} name={name} />
            </Panel>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Remembered section"
      description="The section keeps its open state in the lab's storage across reloads; its heading is level 2."
    >
      <div data-lab-remembered style={{ width: widths.wide }}>
        <PropertyPanel aria-label="Remembered" header={<strong>Frame</strong>}>
          <PropertySection title="Print" headingLevel={2} persistKey="property-panel.print">
            <TextSetting label="Copies" value="2" />
            <PropertyCard name="Bleed" summary="3 mm">
              <TextSetting label="Bleed size" value="3" unit="mm" />
            </PropertyCard>
          </PropertySection>
        </PropertyPanel>
      </div>
    </LabSection>
    <LabSection
      title="Sections opened together"
      description="Left, an accordion: opening a section closes the other. Right, the panel's open sections are controlled, so buttons open or close them all."
    >
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <GroupedSections isAccordion />
        <GroupedSections isAccordion={false} />
      </div>
    </LabSection>
    <LabSection
      title="Switching to an accordion"
      description="The switch makes the panel open its sections one at a time, or hands them back their own state; a draft typed in Title survives both ways."
    >
      <SwitchingPanel />
    </LabSection>
    <LabSection
      title="Locked panels"
      description="A panel whose fields are all disabled or all read-only; its sections still open and close."
    >
      <StateMatrix
        axes={{ lock: panelLocks }}
        render={({ lock }) => (
          <div data-lab-column={widths.wide} style={{ width: widths.wide }}>
            <PropertyPanel
              aria-label={`Lock ${lock}`}
              isDisabled={lock === 'disabled'}
              isReadOnly={lock === 'read-only'}
            >
              <PropertySection title="Frame">
                <TextSetting label="Width" value="320" unit="px" />
                <TextSetting label="Height" value="200" unit="px" />
              </PropertySection>
            </PropertyPanel>
          </div>
        )}
      />
    </LabSection>
  </>,
);
