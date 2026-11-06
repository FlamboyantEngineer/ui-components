// A tour whose steps get their targets ready first: one opens a collapsed section after a short
// load, one can be made to fail and retried, and one waits for a target that arrives later.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Disclosure } from '../../src/components/disclosure/index.js';
import { Switch } from '../../src/components/switch/switch.js';
import { Tour, type TourPrepareContext, type TourStep } from '../../src/components/tour/tour.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** Settles after `delay`, unless the signal aborts first; then it never settles the step. */
function load(delay: number, { signal }: TourPrepareContext, fails: boolean) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => (fails ? reject(new Error('Not loaded')) : resolve()), delay);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

function PreparedTour() {
  const [isOpen, setOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [fails, setFails] = useState(false);
  const [hasNotes, setNotes] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const note = (entry: string) => setLog((entries) => [...entries.slice(-3), entry]);
  const steps: TourStep[] = [
    { target: '[data-lab-prepared="start"]', title: 'Orders', content: 'Every order of the week.' },
    {
      id: 'shipping',
      target: '[data-lab-prepared="shipping"]',
      title: 'Shipping options',
      content: 'The options open before this step points at them.',
      prepare: async (context) => {
        context.signal.addEventListener('abort', () => note('shipping aborted'));
        await load(800, context, fails);
        setExpanded(true);
        note('shipping ready');
      },
    },
    {
      id: 'notes',
      target: '[data-lab-prepared="notes"]',
      title: 'Notes',
      content: 'The notes arrive a moment after this step shows.',
      targetTimeout: 3000,
      prepare: () => {
        setTimeout(() => setNotes(true), 600);
      },
    },
  ];
  return (
    <div data-lab-demo="prepared" style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          data-lab-prepared="start"
          onPress={() => {
            setExpanded(false);
            setNotes(false);
            setOpen(true);
          }}
        >
          Start the tour
        </Button>
        <Switch isSelected={fails} onChange={setFails}>
          Fail loading the options
        </Switch>
      </p>
      <Disclosure title="Shipping" isExpanded={isExpanded} onExpandedChange={setExpanded}>
        <p data-lab-prepared="shipping">Standard, express or pickup.</p>
      </Disclosure>
      {hasNotes ? <p data-lab-prepared="notes">Leave parcels at the side door.</p> : null}
      <LabOutput name="prepared">{log.join(', ') || 'none'}</LabOutput>
      <Tour isOpen={isOpen} onOpenChange={setOpen} isNonModal steps={steps} />
    </div>
  );
}

export function TourPreparationSections() {
  return (
    <LabSection
      title="Getting a step ready"
      description="Shipping options opens its collapsed section after a short load: the step shows as pending, then points at the options. Turn on Fail loading the options to see the failed step and Retry it. Notes waits up to three seconds for its target, which arrives after a moment. Back or Skip during a load aborts it."
    >
      <PreparedTour />
    </LabSection>
  );
}
