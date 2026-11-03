import { useState, type ReactNode } from 'react';
import type { Key } from '../../src/core/props.js';
import { Button } from '../../src/components/button/button.js';
import { ContextMenu, useMenuController } from '../../src/components/context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../../src/components/menu/menu.js';
import {
  StateMachineView,
  type StateMachineContextMenuEvent,
  type StateMachineState,
  type StateMachineTooltipPlacement,
  type StateMachineTransition,
} from '../../src/components/state-machine-view/index.js';

const statusStates: StateMachineState[] = [
  { id: 'intake', label: 'Intake', status: 'complete', tone: 'success', description: 'Complete.' },
  { id: 'check', label: 'Check', status: 'complete', tone: 'success', count: 0 },
  {
    id: 'build',
    label: 'Build',
    status: 'blocked',
    tone: 'warning',
    description: 'Blocked: waiting on input.',
    notificationCount: 3,
  },
  {
    id: 'verify',
    label: 'Verify',
    status: 'error',
    tone: 'danger',
    description: 'Failed.',
    notificationCount: 12,
  },
  {
    id: 'release',
    label: 'Release',
    status: 'pending',
    tone: 'neutral',
    count: 12,
    countLabel: '12 outgoing transitions',
  },
];

const statusTransitions: StateMachineTransition[] = [
  {
    id: 'accept',
    from: 'intake',
    to: 'check',
    label: 'Accept',
    description: 'Key accept, from Intake to Check. Rule: the form is complete.',
  },
  { id: 'start', from: 'check', to: 'build', label: 'Start' },
  { id: 'retry', from: 'verify', to: 'build', label: 'Retry' },
];

const otherStates: StateMachineState[] = [
  { id: 'open', label: 'Open', status: 'complete', tone: 'success' },
  { id: 'closed', label: 'Closed', status: 'pending', count: 1 },
];

const datasets = {
  statuses: { states: statusStates, transitions: statusTransitions },
  other: {
    states: otherStates,
    transitions: [{ id: 'close', from: 'open', to: 'closed', label: 'Close' }],
  },
  empty: { states: [], transitions: [] },
} satisfies Record<string, { states: StateMachineState[]; transitions: StateMachineTransition[] }>;

type Dataset = keyof typeof datasets;

const statusGlyphs: Record<string, string> = {
  complete: '✓',
  blocked: '!',
  error: '×',
  pending: '○',
};

const describe = (key: Key | null) => (key === null ? 'none' : `${typeof key}:${String(key)}`);

/** A host that logs every event, may decline selection, replaces data and composes its own menus. */
export function SequenceHostExamples() {
  const [dataset, setDataset] = useState<Dataset>('statuses');
  const [acceptsSelection, setAcceptsSelection] = useState(true);
  const [isBuildDisabled, setBuildDisabled] = useState(false);
  const [placement, setPlacement] = useState<StateMachineTooltipPlacement>('top');
  const [selectedKey, setSelectedKey] = useState<Key | null>('build');
  const [selectedTransitionKey, setSelectedTransitionKey] = useState<Key | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const menu = useMenuController();
  const [menuItems, setMenuItems] = useState<readonly MenuEntry[]>([]);
  const record = (entry: string) => setLog((entries) => [entry, ...entries].slice(0, 6));
  const openMenu = (target: string, event: StateMachineContextMenuEvent) => {
    event.preventDefault();
    record(`menu ${target} (${event.pointerType})`);
    setMenuItems([
      { id: `before ${target}`, label: 'Insert before' },
      { id: `after ${target}`, label: 'Insert after' },
    ]);
    menu.open(event.anchor);
  };
  const data = datasets[dataset];
  const states = data.states.map((state) =>
    state.id === 'build' ? { ...state, isDisabled: isBuildDisabled } : state,
  );
  const next: Record<Dataset, Dataset> = { statuses: 'other', other: 'empty', empty: 'statuses' };
  return (
    <div data-lab-demo="sequence-host" style={{ maxWidth: '100%', minWidth: 0 }}>
      <p>
        <Button onPress={() => setDataset(next[dataset])}>Replace data</Button>{' '}
        <Button onPress={() => setAcceptsSelection(!acceptsSelection)}>
          {acceptsSelection ? 'Decline selection' : 'Accept selection'}
        </Button>{' '}
        <Button onPress={() => setBuildDisabled(!isBuildDisabled)}>Toggle Build disabled</Button>{' '}
        <Button onPress={() => setPlacement(placement === 'top' ? 'bottom' : 'top')}>
          Tooltips {placement === 'top' ? 'below' : 'above'}
        </Button>
      </p>
      <StateMachineView
        presentation="sequence"
        density="compact"
        aria-label="Host sequence"
        states={states}
        transitions={data.transitions}
        currentKey="build"
        selectedKey={selectedKey}
        onSelectionChange={(key) => {
          record(`select ${describe(key)}${acceptsSelection ? '' : ' declined'}`);
          if (acceptsSelection || key === null) setSelectedKey(key);
        }}
        selectedTransitionKey={selectedTransitionKey}
        onTransitionSelectionChange={(key) => {
          record(`select transition ${describe(key)}`);
          setSelectedTransitionKey(key);
        }}
        onStateAction={(key, _state, event) =>
          record(`activate ${describe(key)} (${event.pointerType})`)
        }
        onTransitionAction={(key) => record(`activate transition ${describe(key)}`)}
        onStateContextMenu={(key, _state, event) => openMenu(describe(key), event)}
        onTransitionContextMenu={(key, _transition, event) =>
          openMenu(`transition ${describe(key)}`, event)
        }
        onBackgroundContextMenu={(event) => openMenu('background', event)}
        renderStateAdornment={(state): ReactNode => statusGlyphs[state.status ?? ''] ?? null}
        getStateTooltip={(state) => `${state.label}: ${state.status ?? 'no status'}`}
        stateTooltipPlacement={placement}
        getTransitionTooltip={(transition) =>
          `${transition.label ?? ''}: ${String(transition.from)} to ${String(transition.to)}`
        }
        emptyLabel="Workflow states"
        renderEmptyState={() => 'Right-click to add states to the workflow.'}
      />
      <ContextMenu controller={menu}>
        <Menu items={menuItems} onAction={(key) => record(`menu action ${String(key)}`)} />
      </ContextMenu>
      <p>Event log:</p>
      <output data-lab-output="sequence-host-log">{log.length ? log.join(' | ') : 'None'}</output>
      <p>Narrow toolbar chrome, with hints below the row:</p>
      <div style={{ width: 280, maxWidth: '100%' }}>
        <StateMachineView
          presentation="sequence"
          density="compact"
          aria-label="Toolbar sequence"
          states={statusStates}
          transitions={[]}
          currentKey="verify"
          getStateTooltip={(state) => `${state.label}: ${state.status ?? 'no status'}`}
          stateTooltipPlacement="bottom"
        />
      </div>
      <p>Read-only empty sequence:</p>
      <StateMachineView
        presentation="sequence"
        aria-label="Read-only empty sequence"
        states={[]}
        transitions={[]}
        renderEmptyState={() => 'No states yet.'}
      />
    </div>
  );
}
