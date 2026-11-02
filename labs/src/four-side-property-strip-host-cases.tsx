import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  FourSidePropertyStrip,
  type BoxAxis,
  type BoxSide,
  type FourSidePropertyStripLink,
  type FourSideValues,
} from '../../src/components/four-side-property-strip/four-side-property-strip.js';
import { PropertyPanel } from '../../src/components/property-panel/property-panel.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const sides: readonly BoxSide[] = ['top', 'bottom', 'left', 'right'];
const initial: FourSideValues<BoxSide, string> = {
  top: '4',
  bottom: '4',
  left: '8',
  right: '8',
};

/** A strip whose four values and linked pairs the page owns, with a reset from outside. */
function OwnedSides({ link }: { link: FourSidePropertyStripLink }) {
  const [value, setValue] = useState(initial);
  const [linked, setLinked] = useState<readonly BoxAxis[]>(
    link === 'all' ? ['vertical', 'horizontal'] : ['vertical'],
  );
  return (
    <div data-lab-owned-strip={link}>
      <FourSidePropertyStrip
        label={`Border, ${link}`}
        unit="px"
        link={link}
        value={value}
        onChange={setValue}
        linked={linked}
        onLinkedChange={setLinked}
        renderSide={(side, field) => (
          <input
            aria-label={`Border ${link} ${side}`}
            value={field.value ?? ''}
            size={3}
            onChange={(event) => field.onChange(event.target.value)}
          />
        )}
      />
      <Button size="sm" variant="secondary" onPress={() => setValue(initial)}>
        {`Reset the ${link} border`}
      </Button>
      <LabOutput name={`sides ${link}`}>
        {sides.map((side) => `${side} ${value[side] ?? '–'}`).join(', ')}
      </LabOutput>
      <LabOutput name={`linked ${link}`}>{linked.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** A narrow row with the row's own description and a Reset action. */
function DescribedRow() {
  const [value, setValue] = useState<FourSideValues<BoxSide, string>>({
    top: '12',
    bottom: '12',
    left: '20',
    right: '20',
  });
  const isDefault = sides.every((side) => value[side] === '0');
  return (
    <div style={{ width: 280 }} data-lab-described-strip="">
      <PropertyPanel aria-label="Frame">
        <FourSidePropertyStrip
          label="Inset"
          unit="px"
          description="Space between the frame and its content."
          actions={
            <Button
              size="xs"
              variant="ghost"
              isDisabled={isDefault}
              onPress={() => setValue({ top: '0', bottom: '0', left: '0', right: '0' })}
            >
              Reset inset
            </Button>
          }
          value={value}
          onChange={setValue}
          renderSide={(side, field) => (
            <input
              aria-label={`Inset ${side}`}
              value={field.value ?? ''}
              size={2}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </PropertyPanel>
    </div>
  );
}

export function FourSidePropertyStripHostCases() {
  return (
    <div data-lab-family="four-side-host-cases">
      <LabSection
        title="Values the page owns"
        description="value and onChange keep the four sides in the page, shown beside each strip, with the linked pairs controlled too. A linked edit reports every side it sets: the top and bottom pair together, or all four. Reset puts the page's starting values back."
      >
        <OwnedSides link="pairs" />
        <OwnedSides link="all" />
      </LabSection>
      <LabSection
        title="Description and actions"
        description="The row's description and actions, inherited from Property Row, in a 280 pixel panel: Reset inset sets every side to 0 and turns itself off."
      >
        <DescribedRow />
      </LabSection>
    </div>
  );
}
