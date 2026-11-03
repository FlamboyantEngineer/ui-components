import { useId, useState } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  StateMachineView,
  type StateMachineState,
  type StateMachineTransition,
  type StateMachineViewDensity,
} from '../../src/components/state-machine-view/index.js';

const states: StateMachineState[] = [
  { id: 1, label: 'Number one' },
  { id: '1', label: 'Text one' },
  { id: 'review', label: 'Review' },
  { id: 'ready', label: 'Ready' },
  { id: 'complete', label: 'Complete', isFinal: true },
];
const transitions: StateMachineTransition[] = [
  { id: 1, from: 1, to: '1', label: 'Advance' },
  { id: '1', from: 1, to: '1', label: 'Alternate' },
  { id: 'review', from: '1', to: 'review', label: 'Submit for review' },
  { id: 'ready', from: 'review', to: 'ready', label: 'Prepare' },
  { id: 'complete', from: 'ready', to: 'complete', label: 'Finish' },
  { id: 'long', from: 1, to: 'complete', label: 'Advance directly to the final state' },
  { id: 'return', from: 'complete', to: 1, label: 'Return to the beginning' },
  { id: 'back', from: 'ready', to: '1', label: 'Return for another review' },
  { id: 'loop', from: 'review', to: 'review', label: 'Repeat review' },
];

/** Shared controls exercise resize, content changes and ordering without graph layout changes. */
export function SequenceExamples() {
  const descriptionId = useId();
  const detailsId = useId();
  const [isNarrow, setNarrow] = useState(false);
  const [isReordered, setReordered] = useState(false);
  const [hasTransitions, setTransitions] = useState(true);
  const [hasLongLabel, setLongLabel] = useState(false);
  const [selectedKey, setSelectedKey] = useState<Key>('review');
  const [activeTransitionKey, setActiveTransitionKey] = useState<Key>(1);
  const [lastAction, setLastAction] = useState('None');
  const items = isReordered ? [...states].reverse() : states;
  const links = hasTransitions
    ? transitions.map((transition) =>
        transition.id === 1 && hasLongLabel
          ? { ...transition, label: 'Advance with an extended description of the next action' }
          : transition,
      )
    : [];
  const selectTransition = (key: Key) => {
    setActiveTransitionKey(key);
    setLastAction(`${typeof key}:${String(key)}`);
  };
  return (
    <div
      data-lab-demo="sequence"
      style={{ width: isNarrow ? 320 : '100%', maxWidth: '100%', minWidth: 0 }}
    >
      <p>
        <Button onPress={() => setNarrow(!isNarrow)}>Toggle sequence width</Button>{' '}
        <Button onPress={() => setReordered(!isReordered)}>Reverse sequence</Button>{' '}
        <Button onPress={() => setTransitions(!hasTransitions)}>Toggle sequence transitions</Button>{' '}
        <Button onPress={() => setLongLabel(!hasLongLabel)}>Change transition label</Button>
      </p>
      <p id={descriptionId}>States follow the supplied order.</p>
      <p id={detailsId}>Choose a state to highlight its outgoing transitions.</p>
      {(['default', 'compact'] as const).map((density: StateMachineViewDensity) => (
        <StateMachineView
          key={density}
          presentation="sequence"
          density={density}
          aria-label={`Sequence ${density}`}
          aria-describedby={descriptionId}
          aria-details={detailsId}
          states={items}
          transitions={links}
          currentKey="1"
          selectedKey={selectedKey}
          onSelectionChange={setSelectedKey}
          activeTransitionKey={activeTransitionKey}
          onTransitionAction={selectTransition}
          onTransitionContextMenu={(key, event) => {
            event.preventDefault();
            setLastAction(`Context ${typeof key}:${String(key)}`);
          }}
          getTransitionTooltip={(transition) => `Details for ${transition.label ?? ''}`}
          renderTransitionLabel={(transition) => <span>{transition.label}</span>}
          sequenceGeometry={{ lanePitch: 26, stateGap: 0, rowSpacer: 15, cornerRadius: 10 }}
        />
      ))}
      <p>
        Last sequence action: <output data-lab-output="sequence-action">{lastAction}</output>
      </p>
      <StateMachineView
        presentation="sequence"
        density="compact"
        aria-label="States only"
        states={items}
        transitions={[]}
        currentKey="review"
      />
      <StateMachineView
        presentation="sequence"
        aria-label="Single state"
        states={[{ id: 'only', label: 'Only state' }]}
        transitions={[]}
      />
      <StateMachineView
        presentation="sequence"
        aria-label="Empty sequence"
        states={[]}
        transitions={[]}
      />
    </div>
  );
}
