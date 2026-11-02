// Projection cases: no provider, context read at the outlet, and a publisher moved between slots.

import { createContext, use, useState } from 'react';
import {
  ProjectionContent,
  ProjectionOutlet,
  ProjectionProvider,
} from '../../src/components/projection/projection.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';

/** A host's own context, set differently around the declaration and around the outlet. */
const PlaceContext = createContext('nowhere');

function PlaceReader() {
  return <span data-lab-output="place">Read from {use(PlaceContext)}</span>;
}

function Standalone() {
  return (
    <div data-lab-demo="standalone">
      <p data-lab-in-place="">
        Declared here:{' '}
        <ProjectionContent slot="tools">
          <button type="button">Crop</button>
        </ProjectionContent>
      </p>
      <p data-lab-outlet="">
        Outlet: <ProjectionOutlet slot="tools" fallback={<em>No tools here</em>} />
      </p>
    </div>
  );
}

function ContextAtOutlet() {
  return (
    <ProjectionProvider>
      <div data-lab-demo="outlet-context">
        <PlaceContext value="the outlet">
          <p>
            Outlet: <ProjectionOutlet slot="status" />
          </p>
        </PlaceContext>
        <PlaceContext value="the declaration">
          <ProjectionContent slot="status">
            <PlaceReader />
          </ProjectionContent>
        </PlaceContext>
      </div>
    </ProjectionProvider>
  );
}

const slots = ['left', 'right'] as const;
type Side = (typeof slots)[number];

function MovingPublisher() {
  const [slot, setSlot] = useState<Side>('left');
  const [count, setCount] = useState(0);
  return (
    <ProjectionProvider>
      <div data-lab-demo="moving-publisher">
        <SegmentedChoice
          aria-label="Publish to"
          size="sm"
          sizing="content"
          options={[
            { value: 'left', label: 'Left panel' },
            { value: 'right', label: 'Right panel' },
          ]}
          value={slot}
          onChange={(value) => setSlot(value === 'right' ? 'right' : 'left')}
        />
        {slots.map((side) => (
          <p key={side} data-lab-panel={side}>
            {side === 'left' ? 'Left' : 'Right'} panel:{' '}
            <ProjectionOutlet slot={side} fallback={<em>Empty</em>} />
          </p>
        ))}
        <ProjectionContent slot={slot}>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Count ({count})
          </button>
        </ProjectionContent>
      </div>
    </ProjectionProvider>
  );
}

export function ProjectionHostCases() {
  return (
    <div data-lab-family="projection-host-cases">
      <LabSection
        title="Without a provider"
        description="With no ProjectionProvider above, the content renders where it is declared and the outlet shows its fallback, so a component that projects its tools still works alone."
      >
        <Standalone />
      </LabSection>
      <LabSection
        title="Context at the outlet"
        description="A host context reads “the declaration” around the ProjectionContent and “the outlet” around the ProjectionOutlet; the projected child reads the outlet's."
      >
        <ContextAtOutlet />
      </LabSection>
      <LabSection
        title="Moving a publisher"
        description="Publish to changes the content's slot: the button moves to the other panel, which drops its fallback, and the first panel shows its fallback again. The count is the declaring component's state, so it survives the move."
      >
        <MovingPublisher />
      </LabSection>
    </div>
  );
}
