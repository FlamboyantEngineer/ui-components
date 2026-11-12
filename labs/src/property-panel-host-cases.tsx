// Property Panel cases: a section and a card each opened by the host, a hidden section that keeps
// its draft, and rows that inherit a value until they set their own.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  PropertyCard,
  PropertyPanel,
  PropertyRow,
  PropertySection,
} from '../../src/components/property-panel/property-panel.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { TextSetting } from './property-text-setting.js';

function OwnedDisclosures() {
  const [isColoursOpen, setColoursOpen] = useState(true);
  const [isShadowOpen, setShadowOpen] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  const report = (part: string) => (isOpen: boolean) => {
    setRequests((previous) => [...previous, `${part}: ${isOpen ? 'open' : 'close'}`]);
  };
  return (
    <div data-lab-demo="owned-disclosures" style={{ width: 440 }}>
      <p>
        <Button size="sm" variant="secondary" onPress={() => setColoursOpen((open) => !open)}>
          {isColoursOpen ? 'Close colours from the page' : 'Open colours from the page'}
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setShadowOpen((open) => !open)}>
          {isShadowOpen ? 'Close shadow from the page' : 'Open shadow from the page'}
        </Button>
      </p>
      <LabOutput name="colours">{isColoursOpen ? 'open' : 'closed'}</LabOutput>
      <LabOutput name="shadow">{isShadowOpen ? 'open' : 'closed'}</LabOutput>
      <LabOutput name="requests">{requests.join(', ') || 'none'}</LabOutput>
      <PropertyPanel aria-label="Owned disclosures">
        <PropertySection
          title="Colours"
          isExpanded={isColoursOpen}
          onExpandedChange={(isOpen) => {
            report('colours')(isOpen);
            setColoursOpen(isOpen);
          }}
        >
          <TextSetting label="Fill" value="#2a6f97" />
          <PropertyCard
            name="Shadow"
            summary="Soft"
            isExpanded={isShadowOpen}
            onExpandedChange={(isOpen) => {
              report('shadow')(isOpen);
              setShadowOpen(isOpen);
            }}
          >
            <TextSetting label="Blur" value="8" unit="px" />
          </PropertyCard>
        </PropertySection>
      </PropertyPanel>
    </div>
  );
}

function HiddenSection() {
  const [isShown, setShown] = useState(true);
  return (
    <div data-lab-demo="hidden-section" style={{ width: 440 }}>
      <Button size="sm" variant="secondary" onPress={() => setShown((shown) => !shown)}>
        {isShown ? 'Hide advanced' : 'Show advanced'}
      </Button>
      <PropertyPanel aria-label="Hideable settings">
        <PropertySection title="General">
          <TextSetting label="Title" value="Poster" />
        </PropertySection>
        <PropertySection title="Advanced" hidden={!isShown}>
          <TextSetting label="Cache size" value="64" unit="MB" />
        </PropertySection>
      </PropertyPanel>
    </div>
  );
}

const inheritedSize = { value: '16 px', source: 'from Body text' };

/** A size row whose own value is `undefined` while it inherits; an empty value still overrides. */
function InheritedSize() {
  const [own, setOwn] = useState<string | undefined>(undefined);
  return (
    <PropertyRow
      label="Size"
      htmlFor="inherited-size"
      unit="px"
      inherited={inheritedSize}
      isOverridden={own !== undefined}
      onReset={() => setOwn(undefined)}
    >
      <input
        id="inherited-size"
        value={own ?? ''}
        placeholder="16"
        onChange={(event) => setOwn(event.target.value)}
      />
    </PropertyRow>
  );
}

function InheritedValues() {
  return (
    <div data-lab-demo="inherited-values" style={{ width: 440 }}>
      <PropertyPanel aria-label="Inherited settings">
        <PropertySection title="Text">
          <InheritedSize />
          <TextSetting
            label="Colour"
            value="#204060"
            isOverridden
            inherited={{ value: '#000000', source: 'from Theme' }}
          />
        </PropertySection>
      </PropertyPanel>
    </div>
  );
}

export function PropertyPanelHostCases() {
  return (
    <div data-lab-family="property-panel-host-cases">
      <LabSection
        title="Disclosures the page owns"
        description="The Colours section and the Shadow card each take isExpanded from the page and report every trigger press through onExpandedChange (listed in requests); the page's buttons open and close them too."
      >
        <OwnedDisclosures />
      </LabSection>
      <LabSection
        title="A hidden section keeps its draft"
        description="Type a cache size, then hide Advanced: the section leaves layout and Tab order but stays mounted, so showing it again brings back the draft."
      >
        <HiddenSection />
      </LabSection>
      <LabSection
        title="Inherited values"
        description="Size inherits 16 px until you type, even an empty value after clearing it; the reset button drops the row's own value. Colour overrides its inherited value but offers no reset."
      >
        <InheritedValues />
      </LabSection>
    </div>
  );
}
