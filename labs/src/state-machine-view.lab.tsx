import { useState } from 'react';
import type { Key, Orientation } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import {
  StateMachineView,
  type StateMachineState,
  type StateMachineTransition,
} from '../../src/components/state-machine-view/state-machine-view.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const doorStates: StateMachineState[] = [
  { id: 'closed', label: 'Closed' },
  { id: 'open', label: 'Open' },
  { id: 'locked', label: 'Locked' },
];

const doorTransitions: StateMachineTransition[] = [
  { id: 'open', from: 'closed', to: 'open', label: 'open' },
  { id: 'close', from: 'open', to: 'closed', label: 'close' },
  { id: 'lock', from: 'closed', to: 'locked', label: 'lock' },
  { id: 'unlock', from: 'locked', to: 'closed', label: 'unlock' },
];

const orderStates: StateMachineState[] = [
  { id: 'placed', label: 'Placed' },
  { id: 'paid', label: 'Paid' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered', isFinal: true },
  { id: 'cancelled', label: 'Cancelled', isFinal: true },
  { id: 'refunded', label: 'Refunded', isFinal: true },
];

const orderTransitions: StateMachineTransition[] = [
  { id: 'pay', from: 'placed', to: 'paid', label: 'pay' },
  { id: 'cancel', from: 'placed', to: 'cancelled', label: 'cancel' },
  { id: 'pack', from: 'paid', to: 'packed', label: 'pack' },
  { id: 'refund', from: 'paid', to: 'refunded', label: 'refund' },
  { id: 'ship', from: 'packed', to: 'shipped', label: 'ship' },
  { id: 'deliver', from: 'shipped', to: 'delivered', label: 'deliver' },
  { id: 'return', from: 'shipped', to: 'packed', label: 'return' },
  { id: 'remind', from: 'placed', to: 'placed', label: 'remind' },
];

const states = ['resting', 'current', 'editing'] as const;
const orientations: readonly Orientation[] = ['horizontal', 'vertical'];

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

function StateSample({
  state,
  orientation,
}: {
  state: (typeof states)[number];
  orientation: Orientation;
}) {
  return (
    <div style={{ width: 360 }}>
      <StateMachineView
        aria-label={`Door, ${state}, ${orientation}`}
        states={doorStates}
        transitions={doorTransitions}
        orientation={orientation}
        currentState={state === 'current' ? 'open' : undefined}
        isEditing={state === 'editing'}
      />
    </div>
  );
}

function Orders() {
  const [current, setCurrent] = useState<Key>('placed');
  const next = orderTransitions.filter((transition) => transition.from === current);
  return (
    <>
      <StateMachineView
        aria-label="Order lifecycle"
        data-lab-field="orders"
        states={orderStates}
        transitions={orderTransitions}
        currentState={current}
      />
      <p>
        {next.map((transition) => (
          <Button
            key={transition.id}
            size="sm"
            variant="secondary"
            onPress={() => setCurrent(transition.to)}
          >
            {transition.label}
          </Button>
        ))}{' '}
        <Button size="sm" variant="ghost" onPress={() => setCurrent('placed')}>
          Start over
        </Button>
      </p>
      <Output name="current" value={String(current)} />
    </>
  );
}

function EditableDoor() {
  const [items, setItems] = useState(doorStates);
  const [links, setLinks] = useState(doorTransitions);
  return (
    <>
      <StateMachineView
        aria-label="Door editor"
        data-lab-field="door"
        states={items}
        transitions={links}
        isEditing
        onStatesChange={setItems}
        onTransitionsChange={setLinks}
        onTransitionAdd={({ from, to }) =>
          setLinks([
            ...links,
            { id: `t${links.length + 1}`, from, to, label: `step ${links.length + 1}` },
          ])
        }
      />
      <Output name="states" value={items.map((item) => item.label).join(', ')} />
      <Output
        name="transitions"
        value={links.map((link) => `${String(link.from)}→${String(link.to)}`).join(', ')}
      />
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="A read-only machine, one with a current state, and edit mode with a transition port on each state, laid out left to right and top to bottom."
    >
      <StateMatrix
        axes={{ state: states, orientation: orientations }}
        render={({ state, orientation }) => <StateSample state={state} orientation={orientation} />}
      />
    </LabSection>
    <LabSection
      title="Current state"
      description="Follow a transition with the buttons; the current state moves and its outgoing transitions change. Tab to a state and move between connected states with the arrow keys."
    >
      <Orders />
    </LabSection>
    <LabSection
      title="Edit mode"
      description="Drag or arrow-key states into place, connect a state's port to another state to add a transition, and press Delete to remove a state with its transitions."
    >
      <EditableDoor />
    </LabSection>
  </>,
);
