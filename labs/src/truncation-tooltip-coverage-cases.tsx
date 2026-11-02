// Truncation Tooltip cases for expansion the host controls or starts whole, a column the reader
// widens and narrows, and a hover delay of the host's choosing.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Switch } from '../../src/components/switch/switch.js';
import { TruncationTooltip } from '../../src/components/truncation-tooltip/truncation-tooltip.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const recipe =
  'Simmer the tomatoes with garlic and basil for twenty minutes, then season to taste and serve warm.';

/** The host holds the expanded state, lists each request, and can widen the column. */
function Controlled() {
  const [isExpanded, setExpanded] = useState(false);
  const [isWide, setWide] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  return (
    <div data-lab-demo="controlled-expansion">
      <Switch isSelected={isWide} onChange={setWide}>
        Wide column
      </Switch>{' '}
      <Button size="sm" variant="secondary" onPress={() => setExpanded(true)}>
        Expand from the host
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setExpanded(false)}>
        Collapse from the host
      </Button>
      <div style={{ width: isWide ? 800 : 200 }}>
        <TruncationTooltip
          expandable
          isExpanded={isExpanded}
          onExpandedChange={(next) => {
            setRequests((list) => [...list, next ? 'show more' : 'show less']);
            setExpanded(next);
          }}
          data-lab-text="controlled"
        >
          {recipe}
        </TruncationTooltip>
      </div>
      <LabOutput name="Expanded">{String(isExpanded)}</LabOutput>
      <LabOutput name="Expansion requests">{requests.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** Starts whole; Show less cuts it. */
function StartsWhole() {
  return (
    <div style={{ width: 200 }}>
      <TruncationTooltip expandable defaultExpanded data-lab-text="default-expanded">
        {recipe}
      </TruncationTooltip>
    </div>
  );
}

/** A cut label whose tooltip waits for the hover delay set below. */
function HoverDelay() {
  const [delay, setDelay] = useState(1500);
  return (
    <div data-lab-demo="truncation-delay">
      <NumberField
        label="Hover delay (ms)"
        size="sm"
        minValue={0}
        step={250}
        value={delay}
        onChange={(value) => setDelay(value ?? 0)}
      />
      <div style={{ width: 160 }}>
        <TruncationTooltip delay={delay} data-lab-text="delayed">
          Quarterly report for the northern region, final edition.pdf
        </TruncationTooltip>
      </div>
    </div>
  );
}

export function TruncationTooltipCoverageSections() {
  return (
    <>
      <LabSection
        title="Controlled expansion"
        description="isExpanded with onExpandedChange: Show more and Show less only ask, and the host applies each request, listed below; the host's own buttons expand and collapse it. Wide column fits the text in 800px, where no control is drawn, unless it is expanded; narrow cuts it to 200px again."
      >
        <Controlled />
      </LabSection>
      <LabSection
        title="Starts whole"
        description="defaultExpanded starts the cut text whole, with Show less; the component then holds the state."
      >
        <StartsWhole />
      </LabSection>
      <LabSection
        title="Hover delay"
        description="delay sets how long the pointer rests on cut text before the tooltip opens (500 ms by default); keyboard focus still opens it at once."
      >
        <HoverDelay />
      </LabSection>
    </>
  );
}
