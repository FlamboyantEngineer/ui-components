import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

/** A region rendered into an open shadow root, as a web component would hold it. */
function ShadowRegionDemo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [isSaving, setSaving] = useState(false);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (host) setRoot(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
  }, []);
  useEffect(() => {
    if (!isSaving) return undefined;
    // Lab-only stand-in for the save finishing.
    const timer = setTimeout(() => setSaving(false), 1500);
    return () => clearTimeout(timer);
  }, [isSaving]);
  const region = (
    <LoadingRegion isLoading={isSaving} label="Saving note">
      <p>
        <label>
          Note <input name="note" defaultValue="Bring the charts" />
        </label>
      </p>
    </LoadingRegion>
  );
  return (
    <>
      <p>
        <Button onPress={() => setSaving(true)}>Save note</Button>
      </p>
      <div data-lab-demo="shadow-region" ref={hostRef}>
        {root ? createPortal(region, root) : null}
      </div>
    </>
  );
}

function RegionDemo() {
  const [isLoading, setLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  useEffect(() => {
    if (!isSaving) return undefined;
    // Lab-only stand-in for the save finishing.
    const timer = setTimeout(() => setSaving(false), 1500);
    return () => clearTimeout(timer);
  }, [isSaving]);
  return (
    <div data-lab-demo="region">
      <p>
        <Button onPress={() => setLoading((value) => !value)}>
          {isLoading ? 'Stop loading' : 'Start loading'}
        </Button>
      </p>
      <LoadingRegion
        isLoading={isLoading || isSaving}
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
            <Button variant="primary" onPress={() => setSaving(true)}>
              Apply
            </Button>
          </p>
        </div>
      </LoadingRegion>
    </div>
  );
}

function DelayDemo() {
  const [isLoading, setLoading] = useState(false);
  return (
    <div data-lab-demo="delay">
      <p>
        <Button onPress={() => setLoading((value) => !value)}>
          {isLoading ? 'Stop searching' : 'Start searching'}
        </Button>
      </p>
      <LoadingRegion isLoading={isLoading} delay={500} label="Searching recipes">
        <div style={{ width: 320, height: 160 }}>
          <p>Soups, salads and stews.</p>
          <Button>Open recipe</Button>
        </div>
      </LoadingRegion>
    </div>
  );
}

function FullscreenDemo() {
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (!isLoading) return undefined;
    // Lab-only stand-in for the work finishing: Escape ends it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLoading(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLoading]);
  return (
    <div data-lab-demo="fullscreen">
      <Button onPress={() => setLoading(true)}>Open the cookbook</Button>
      {isLoading ? (
        <LoadingOverlay fullscreen label="Opening the cookbook" data-lab-overlay="fullscreen" />
      ) : null}
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
      description="Start loading to block the form, then stop it, or press Apply to save for a moment: focus waits on the region and returns to Apply. The cover fades in and out with useEnterExit."
    >
      <RegionDemo />
    </LabSection>
    <LabSection
      title="Blocking inside a shadow root"
      description="The region lives in an open shadow root, unstyled there. Focus the note, then save it from outside (with a pointer, focus moves to the button): focus in the note waits on the region and returns to the note."
    >
      <ShadowRegionDemo />
    </LabSection>
    <LabSection
      title="Show delay"
      description="With delay={500}, the region blocks only once a search has run for half a second; stop it sooner and nothing flashes."
    >
      <DelayDemo />
    </LabSection>
    <LabSection
      title="Full screen"
      description="A full-screen overlay covers the viewport from the overlay layer until you press Escape."
    >
      <FullscreenDemo />
    </LabSection>
  </>,
);
