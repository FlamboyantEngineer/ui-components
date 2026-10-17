import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  LoadingCard,
  LoadingOverlay,
  LoadingRegion,
  type LoadingCardProps,
} from '../../src/components/loading-overlay/loading-overlay.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const progressStates = ['indeterminate', 'determinate'] as const;
const longHint = 'Measuring the layout of every page in the quarterly report';

function cardProps(progress: (typeof progressStates)[number], extras: string): LoadingCardProps {
  return {
    label: 'Loading report',
    ...(progress === 'determinate'
      ? { progress: { value: 42, valueLabel: 'Estimated progress: 42%' } }
      : {}),
    ...(extras !== 'label only' ? { description: 'Preparing pages and figures.' } : {}),
    ...(extras === 'hint and step' ? { hint: longHint, step: { current: 6, total: 9 } } : {}),
  };
}

function RegionDemo() {
  const [isLoading, setLoading] = useState(false);
  return (
    <div data-lab-demo="region">
      <p>
        <Button onPress={() => setLoading((value) => !value)}>
          {isLoading ? 'Stop loading' : 'Start loading'}
        </Button>
      </p>
      <LoadingRegion
        isLoading={isLoading}
        label="Saving city"
        hint="Writing to the server"
        step={{ current: 1, total: 2 }}
        data-lab-region="form"
      >
        <div style={{ width: 320, minHeight: 200 }}>
          <p>
            <label>
              City <input name="city" defaultValue="Lisbon" />
            </label>
          </p>
          <p>
            <Button variant="primary">Apply</Button>
          </p>
        </div>
      </LoadingRegion>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Card"
      description="The status card drawn in place: indeterminate and measured progress, with optional description, hint and step."
    >
      <StateMatrix
        axes={{ extras: ['label only', 'description', 'hint and step'], progress: progressStates }}
        render={({ extras, progress }) => (
          <div style={{ width: 320 }}>
            <LoadingCard {...cardProps(progress, extras)} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Overlay"
      description="The cover over a bounded 320 × 220 surface: the card on a scrim, or the scrim alone."
    >
      <StateMatrix
        axes={{ presentation: ['card', 'scrim'], progress: progressStates }}
        render={({ presentation, progress }) => (
          <div data-lab-surface="true" style={{ position: 'relative', width: 320, height: 220 }}>
            <p>Surface content under the overlay.</p>
            <LoadingOverlay presentation={presentation} {...cardProps(progress, 'hint and step')} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Region"
      description="Idle and loading regions. While loading, the content is inert and the region is busy."
    >
      <StateMatrix
        axes={{ state: ['idle', 'loading'] }}
        render={({ state }) => (
          <LoadingRegion isLoading={state === 'loading'} label="Loading fruit">
            <div style={{ width: 320, height: 200 }}>
              <p>Apple, pear, plum.</p>
              <Button>Edit fruit</Button>
            </div>
          </LoadingRegion>
        )}
      />
    </LabSection>
    <LabSection
      title="Blocking a form"
      description="Start loading to block the form, then stop it."
    >
      <RegionDemo />
    </LabSection>
  </>,
);
