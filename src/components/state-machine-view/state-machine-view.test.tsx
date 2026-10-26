import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  StateMachineView,
  type StateMachineState,
  type StateMachineTransition,
} from './state-machine-view.js';

const states: StateMachineState[] = [
  { id: 'placed', label: 'Placed' },
  { id: 'paid', label: 'Paid' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered', isFinal: true },
  { id: 'cancelled', label: 'Cancelled', isFinal: true },
];

const transitions: StateMachineTransition[] = [
  { id: 'pay', from: 'placed', to: 'paid', label: 'pay' },
  { id: 'ship', from: 'paid', to: 'shipped', label: 'ship' },
  { id: 'deliver', from: 'shipped', to: 'delivered', label: 'deliver' },
  { id: 'cancel', from: 'placed', to: 'cancelled', label: 'cancel' },
  { id: 'retry', from: 'shipped', to: 'paid', label: 'return' },
];

function state(name: string) {
  return screen.getByRole('group', { name });
}

function EditableMachine({
  onStatesChange,
  onTransitionAdd,
}: {
  onStatesChange?: (next: StateMachineState[]) => void;
  onTransitionAdd?: (request: { from: string | number; to: string | number }) => void;
}) {
  const [items, setItems] = useState(states);
  const [links, setLinks] = useState(transitions);
  return (
    <StateMachineView
      aria-label="Orders"
      states={items}
      transitions={links}
      isEditing
      onStatesChange={(next) => {
        onStatesChange?.(next);
        setItems(next);
      }}
      onTransitionsChange={setLinks}
      onTransitionAdd={onTransitionAdd}
    />
  );
}

describe('StateMachineView', () => {
  it('UIC-STATE-MACHINE-VIEW-1.1 UIC-STATE-MACHINE-VIEW-1.3 draws states and labelled transitions on a diagram canvas', () => {
    const { container } = render(
      <StateMachineView
        states={states}
        transitions={transitions}
        className="host"
        id="orders"
        data-testid="orders"
      />,
    );
    const root = screen.getByRole('group', { name: 'State machine' });
    expect(root).toHaveClass('ui-diagram-canvas', 'ui-state-machine-view', 'host');
    expect(root).toHaveAttribute('id', 'orders');
    expect(root).toHaveAttribute('data-testid', 'orders');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    expect(root).toHaveAttribute('data-routing', 'bezier');
    expect(container.querySelectorAll('.ui-diagram-canvas__node')).toHaveLength(5);
    expect(container.querySelectorAll('.ui-diagram-canvas__edge')).toHaveLength(5);
    expect(container.querySelector('.ui-diagram-canvas__minimap')).toBeNull();
    expect(within(state('Paid')).getByText('Paid')).toHaveClass(
      'ui-state-machine-view__state-label',
    );
    expect(screen.getByText('return')).toHaveClass('ui-diagram-canvas__edge-label');
    expect(state('Paid').style).toMatchObject({ width: '144px', height: '44px' });
    expectHooksMatchSpec(container, 'STATE-MACHINE-VIEW', {
      slots: ['state', 'state-label', 'initial-marker'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-STATE-MACHINE-VIEW-1.1 takes its name from the caller or the provider and opens on the outline', () => {
    const { rerender } = render(
      <StateMachineView
        aria-label="Orders"
        states={states}
        transitions={transitions}
        defaultView="outline"
      />,
    );
    expect(screen.getByRole('group', { name: 'Orders' })).toHaveAttribute('data-view', 'outline');
    expect(screen.getByRole('list', { name: 'Outline' })).toHaveTextContent('Paid (pay)');
    rerender(
      <UiProvider strings={{ stateMachine: 'Automate' }}>
        <StateMachineView states={states} transitions={transitions} />
      </UiProvider>,
    );
    expect(screen.getByRole('group', { name: 'Automate' })).toBeInTheDocument();
  });

  it('UIC-STATE-MACHINE-VIEW-1.2 marks the initial, final and current states', () => {
    const { container, rerender } = render(
      <StateMachineView states={states} transitions={transitions} currentState="shipped" />,
    );
    const marker = (name: string) =>
      requireDefined(state(name).querySelector('.ui-state-machine-view__state'));
    expect(marker('Placed')).toHaveAttribute('data-initial', 'true');
    expect(
      marker('Placed').querySelector('.ui-state-machine-view__initial-marker'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(marker('Delivered')).toHaveAttribute('data-final', 'true');
    expect(marker('Shipped')).toHaveAttribute('data-current', 'true');
    expect(marker('Paid')).not.toHaveAttribute('data-current');
    expect(state('Shipped')).toHaveAccessibleDescription(
      'Current state. Leads to Delivered (deliver), Paid (return). Comes from Paid (ship).',
    );
    expect(state('Placed')).toHaveAccessibleDescription(
      'Initial state. Leads to Paid (pay), Cancelled (cancel).',
    );
    expect(state('Cancelled')).toHaveAccessibleDescription(
      'Final state. Comes from Placed (cancel).',
    );
    rerender(<StateMachineView states={states} transitions={transitions} initialState="paid" />);
    expect(marker('Paid')).toHaveAttribute('data-initial', 'true');
    expect(container.querySelectorAll('.ui-state-machine-view__initial-marker')).toHaveLength(1);
  });

  it('UIC-STATE-MACHINE-VIEW-2.2 lays the states out in layers from the initial state', () => {
    const { rerender } = render(<StateMachineView states={states} transitions={transitions} />);
    const at = (name: string) => [
      parseFloat(state(name).style.left),
      parseFloat(state(name).style.top),
    ];
    expect(at('Placed')[0]).toBe(0);
    expect(at('Paid')[0]).toBe(256);
    expect(at('Cancelled')[0]).toBe(256);
    expect(at('Shipped')[0]).toBe(512);
    expect(at('Delivered')[0]).toBe(768);
    rerender(<StateMachineView states={states} transitions={transitions} orientation="vertical" />);
    expect(screen.getByRole('group', { name: 'State machine' })).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    expect(at('Paid')[1]).toBe(156);
    expect(at('Delivered')[1]).toBe(468);
    rerender(
      <StateMachineView
        states={[{ ...requireDefined(states[0]), x: 500, y: 600 }, ...states.slice(1)]}
        transitions={transitions}
      />,
    );
    expect(at('Placed')).toEqual([500, 600]);
  });

  it('UIC-STATE-MACHINE-VIEW-3.1 is read only by default', async () => {
    const user = userEvent.setup();
    const onStatesChange = vi.fn();
    const { container } = render(
      <StateMachineView
        states={states}
        transitions={transitions}
        onStatesChange={onStatesChange}
      />,
    );
    expect(container.querySelector('.ui-diagram-canvas__port')).toBeNull();
    await user.pointer([
      { keys: '[MouseLeft>]', target: state('Paid'), coords: { clientX: 0, clientY: 0 } },
      { coords: { clientX: 50, clientY: 50 } },
      { keys: '[/MouseLeft]' },
    ]);
    expect(onStatesChange).not.toHaveBeenCalled();
    expect(state('Paid')).toHaveAttribute('data-selected', 'true');
  });

  it('UIC-STATE-MACHINE-VIEW-3.2 moves and removes states and adds transitions in edit mode', async () => {
    const onStatesChange = vi.fn();
    const onTransitionAdd = vi.fn();
    render(<EditableMachine onStatesChange={onStatesChange} onTransitionAdd={onTransitionAdd} />);
    act(() => state('Paid').focus());
    await userEvent.keyboard('{ArrowDown}');
    const moved = requireDefined(onStatesChange.mock.lastCall)[0] as StateMachineState[];
    expect(moved.find((item) => item.id === 'paid')).toMatchObject({
      label: 'Paid',
      x: 260,
      y: 10,
    });
    expect(moved.every((item) => typeof item.x === 'number' && typeof item.y === 'number')).toBe(
      true,
    );
    const port = screen.getByRole('button', { name: 'Cancelled, new transition' });
    expect(port).toHaveAttribute('data-side', 'right');
    act(() => port.focus());
    await userEvent.keyboard('{Enter}');
    act(() => state('Placed').focus());
    await userEvent.keyboard('{Enter}');
    expect(onTransitionAdd).toHaveBeenCalledWith({ from: 'cancelled', to: 'placed' });
    act(() => state('Shipped').focus());
    await userEvent.keyboard('{Delete}');
    expect(
      requireDefined(onStatesChange.mock.lastCall)[0].map((item: StateMachineState) => item.id),
    ).toEqual(['placed', 'paid', 'delivered', 'cancelled']);
    expect(screen.queryByText('ship')).not.toBeInTheDocument();
    expect(screen.getByText('pay')).toBeInTheDocument();
  });
});
