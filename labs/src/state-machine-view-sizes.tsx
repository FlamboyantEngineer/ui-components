import { useState } from 'react';
import {
  type StateMachineState,
  type StateMachineTransition,
  StateMachineView,
  type StateMachineViewDensity,
} from '../../src/components/state-machine-view/index.js';
import type { Key, Size } from '../../src/core/props.js';
import { StateMatrix } from './chrome/index.js';

const sizes: readonly Size[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const densities: readonly StateMachineViewDensity[] = ['default', 'compact'];
const states: StateMachineState[] = [
  { id: 'draft', label: 'Draft', count: 2 },
  { id: 'review', label: 'Review', notificationCount: 3 },
  { id: 'complete', label: 'Complete', isFinal: true },
];
const transitions: StateMachineTransition[] = [
  { id: 'submit', from: 'draft', to: 'review', label: 'Submit' },
  { id: 'finish', from: 'review', to: 'complete', label: 'Finish' },
  { id: 'return', from: 'complete', to: 'draft', label: 'Return' },
];

function SequenceSize({ size, density }: { size: Size; density: StateMachineViewDensity }) {
  const [selectedKey, setSelectedKey] = useState<Key | null>('draft');
  const [selectedTransitionKey, setSelectedTransitionKey] = useState<Key | null>(null);
  return (
    <div style={{ width: 544, maxWidth: '100%', minWidth: 0 }}>
      <StateMachineView
        presentation="sequence"
        size={size}
        density={density}
        aria-label={`Sequence ${size} ${density}`}
        states={states}
        transitions={transitions}
        currentKey="review"
        selectedKey={selectedKey}
        onSelectionChange={setSelectedKey}
        selectedTransitionKey={selectedTransitionKey}
        onTransitionSelectionChange={setSelectedTransitionKey}
      />
    </div>
  );
}

/** Every size at both densities, with the same content and independently selectable controls. */
export function SequenceSizeExamples() {
  return (
    <div data-lab-demo="sequence-sizes">
      <StateMatrix
        axes={{ size: sizes, density: densities }}
        caption="Sequence sizes and densities"
        render={({ size, density }) => <SequenceSize size={size} density={density} />}
      />
    </div>
  );
}
