import { useState } from 'react';
import { Card, type CardDensity, type CardVariant } from '../../src/components/card/card.js';
import { Button } from '../../src/components/button/button.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants: CardVariant[] = ['default', 'panel'];
const densities: CardDensity[] = ['default', 'comfortable', 'compact', 'tight'];
const states = ['resting', 'selected', 'interactive', 'flush'] as const;

function SelectableCards() {
  const [selected, setSelected] = useState('Lisbon');
  return (
    <div role="group" aria-label="Destination" data-lab-demo="select">
      {['Lisbon', 'Oslo', 'Nairobi'].map((city) => (
        <div key={city} style={{ width: 220 }}>
          <Card title={city} isSelected={city === selected} interactive>
            <Button size="sm" isSelected={city === selected} onPress={() => setSelected(city)}>
              Choose {city}
            </Button>
          </Card>
        </div>
      ))}
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants, densities and states"
      description="Every surface and density, resting, selected, interactive (hover it) and flush."
    >
      <StateMatrix
        axes={{ variant: variants, density: densities, state: states }}
        render={({ variant, density, state }) => (
          <div style={{ width: 200 }}>
            <Card
              variant={variant}
              density={density}
              isSelected={state === 'selected'}
              interactive={state === 'interactive'}
              flush={state === 'flush'}
              title={`${variant}, ${density}, ${state}`}
              footer="Updated today"
            >
              Three cities, two rivers.
            </Card>
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Header composition"
      description="A title, a description and actions compose the header; custom header content replaces them."
    >
      <StateMatrix
        axes={{ header: ['title', 'description', 'actions', 'custom', 'none'] }}
        render={({ header }) => (
          <div style={{ width: 240 }}>
            {header === 'custom' ? (
              <Card header={<strong>Custom header</strong>} aria-label="Custom header card">
                Body text.
              </Card>
            ) : header === 'none' ? (
              <Card aria-label="Card without header">Body text with no header.</Card>
            ) : (
              <Card
                title={`Notifications (${header})`}
                description={header === 'title' ? undefined : 'Choose what reaches your inbox.'}
                actions={
                  header === 'actions' ? (
                    <Button size="sm" variant="tertiary">
                      Reset
                    </Button>
                  ) : undefined
                }
              >
                Body text.
              </Card>
            )}
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Fill"
      description="A filled card in a 160px tall frame: the body grows to the card's height and owns its interior."
    >
      <div data-lab-fill-frame="true" style={{ width: 280, height: 160 }}>
        <Card title="Preview" fill variant="panel">
          <div data-lab-canvas="true">Canvas</div>
        </Card>
      </div>
    </LabSection>
    <LabSection
      title="Selection"
      description="The control inside each card exposes the choice; the card draws the selected edge."
    >
      <SelectableCards />
    </LabSection>
  </>,
);
