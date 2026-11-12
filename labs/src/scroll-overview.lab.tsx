import { useMemo, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ScrollOverview,
  type ScrollOverviewSource,
} from '../../src/components/scroll-overview/scroll-overview.js';
import { LabSection, mountLab } from './chrome/index.js';

const lines = Array.from(
  { length: 40 },
  (_, index) => `Step ${index + 1}: knead, fold and turn the dough a quarter turn.`,
);

/** The steps that start marked: a search match on each. */
const matched = [4, 17, 31];

/**
 * A plain scrolling list with an overview beside it: each matched step is an element marker, and
 * Mark step 25 adds one; pressing a marker scrolls to its step.
 */
function MarkedSteps() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState<Map<number, HTMLElement>>(new Map());
  const [marked, setMarked] = useState(matched);
  const [jumped, setJumped] = useState('none');
  const markers = useMemo(
    () =>
      marked.flatMap((index): ScrollOverviewSource[] => {
        const element = steps.get(index);
        return element ? [{ element, color: 'var(--ref-accent-ink)', priority: 0 }] : [];
      }),
    [marked, steps],
  );
  const register = (index: number) => (element: HTMLElement | null) => {
    if (!element || steps.get(index) === element) return;
    setSteps((current) => new Map(current).set(index, element));
  };
  return (
    <div data-lab-demo="elements">
      <p>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={marked.includes(24)}
          onPress={() => setMarked((current) => [...current, 24])}
        >
          Mark step 25
        </Button>{' '}
        Jumped to: <output data-lab-jumped>{jumped}</output>
      </p>
      <div style={{ display: 'flex', gap: 4, width: 420 }}>
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Steps"
          style={{ height: 240, overflow: 'auto', flex: 1 }}
        >
          {lines.map((line, index) => (
            <p key={line} ref={register(index)} data-marked={marked.includes(index) || undefined}>
              {line}
            </p>
          ))}
        </div>
        <ScrollOverview
          scrollRef={scrollRef}
          markers={markers}
          onMarkerActivate={(marker) => {
            const found = [...steps].find(
              ([, step]) => 'element' in marker && step === marker.element,
            );
            setJumped(found ? `step ${found[0] + 1}` : 'none');
          }}
        />
      </div>
    </div>
  );
}

/** Range markers in two layers, the overlap mixed, painted decoratively. */
function LayeredRanges() {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div data-lab-demo="layers" style={{ display: 'flex', gap: 4, width: 420 }}>
      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label="Layered steps"
        style={{ height: 160, overflow: 'auto', flex: 1 }}
      >
        <div style={{ height: 1600 }}>A tall page of steps.</div>
      </div>
      <ScrollOverview
        scrollRef={scrollRef}
        layers={[
          { name: 'changes', markers: [{ top: 200, height: 400, color: 'green', priority: 0 }] },
          { name: 'comments', markers: [{ top: 500, height: 300, color: 'orange', priority: 0 }] },
        ]}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Element markers"
      description="Each matched step is marked by its element; the marks follow the steps when one is added. Press a mark to scroll to its step."
    >
      <MarkedSteps />
    </LabSection>
    <LabSection
      title="Layers"
      description="Two named layers of content ranges; where they meet, their colours mix. Without onMarkerActivate the strip lets presses through."
    >
      <LayeredRanges />
    </LabSection>
  </>,
);
