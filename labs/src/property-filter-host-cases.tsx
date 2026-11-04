// Property Filter cases passing the panel's field state and expansion through the filtering wrapper.

import { useState } from 'react';
import { PropertyFilter } from '../../src/components/property-filter/property-filter.js';
import {
  PropertyGroup,
  PropertySection,
} from '../../src/components/property-panel/property-panel.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { TextSetting } from './property-text-setting.js';

function Sections() {
  return (
    <>
      <PropertySection id="page" title="Page setup">
        <PropertyGroup heading="Paper">
          <TextSetting label="Paper size" value="A4" />
          <TextSetting label="Orientation" value="Portrait" />
        </PropertyGroup>
        <TextSetting label="Margins" value="12" unit="mm" />
      </PropertySection>
      <PropertySection id="text" title="Text styles">
        <TextSetting label="Font" value="Serif" />
        <TextSetting label="Font size" value="11" unit="pt" />
      </PropertySection>
      <PropertySection id="export" title="Export">
        <TextSetting label="File name" value="poster" />
      </PropertySection>
    </>
  );
}

const fieldModes = ['editable', 'disabled', 'read-only'] as const;
type FieldMode = (typeof fieldModes)[number];

function FieldState() {
  const [mode, setMode] = useState<FieldMode>('editable');
  return (
    <div data-lab-demo="field-state" style={{ width: 440 }}>
      <SegmentedChoice
        aria-label="Fields"
        size="sm"
        sizing="content"
        options={fieldModes.map((value) => ({ value, label: value }))}
        value={mode}
        onChange={(value) => setMode(fieldModes.find((option) => option === value) ?? 'editable')}
      />
      <PropertyFilter
        aria-label="Locked settings"
        isDisabled={mode === 'disabled'}
        isReadOnly={mode === 'read-only'}
      >
        <Sections />
      </PropertyFilter>
    </div>
  );
}

const describeKeys = (keys: Iterable<Key>) => [...keys].map(String).join(', ') || 'none';

function ControlledAccordion() {
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(['page']));
  return (
    <div data-lab-demo="accordion" style={{ width: 440 }}>
      <LabOutput name="expanded">{describeKeys(expanded)}</LabOutput>
      <PropertyFilter
        aria-label="Accordion settings"
        allowsMultipleExpanded={false}
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
      >
        <Sections />
      </PropertyFilter>
    </div>
  );
}

function SeededSearch() {
  const [expanded, setExpanded] = useState<string>('text');
  return (
    <div data-lab-demo="seeded" style={{ width: 440 }}>
      <LabOutput name="expanded">{expanded}</LabOutput>
      <PropertyFilter
        aria-label="Seeded settings"
        defaultQuery="margin"
        defaultExpandedKeys={['text']}
        onExpandedChange={(keys) => setExpanded(describeKeys(keys))}
      >
        <Sections />
      </PropertyFilter>
    </div>
  );
}

export function PropertyFilterHostCases() {
  return (
    <div data-lab-family="property-filter-host-cases">
      <LabSection
        title="Disabled and read-only"
        description="Fields switches the filter between editable, isDisabled and isReadOnly: every field inside follows, and the search box keeps filtering."
      >
        <FieldState />
      </LabSection>
      <LabSection
        title="Expansion through the filter"
        description="Left, a single-open accordion whose expanded keys the host holds: opening one section closes the other. A query opens the sections that match without changing the host's keys, and clearing it brings the host's expansion back, with any edit made meanwhile. Right, a filter seeded with the query “margin” and with Text styles expanded: the query shows Page setup; cleared, only Text styles is open."
      >
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'start' }}>
          <ControlledAccordion />
          <SeededSearch />
        </div>
      </LabSection>
    </div>
  );
}
