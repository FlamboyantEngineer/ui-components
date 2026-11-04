import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import {
  type StateMachineState,
  type StateMachineTransition,
  StateMachineView,
} from './state-machine-view.js';

const states: StateMachineState[] = [
  { id: 'alpha', label: 'Alpha' },
  { id: 'blue', label: 'Blue' },
  { id: 'gamma', label: 'Gamma' },
];

const transitions: StateMachineTransition[] = [
  { id: 'advance', from: 'alpha', to: 'blue', label: 'Advance' },
  { id: 'finish', from: 'blue', to: 'gamma', label: 'Finish' },
  { id: 'return', from: 'gamma', to: 'alpha', label: 'Return' },
];

const sequencePresentation = { presentation: 'sequence' } as const;

function getStatePosition(name: string, scope: HTMLElement = document.body) {
  return requireDefined(
    within(scope)
      .getByRole('button', { name })
      .closest<HTMLElement>('.ui-state-machine-view__state-position'),
  );
}

function readStatePosition(name: string) {
  const element = getStatePosition(name);
  return {
    x: parseFloat(element.style.left),
    y: parseFloat(element.style.top),
    height: parseFloat(element.style.height),
  };
}

describe('StateMachineView sequence presentation', () => {
  it('UIC-STATE-MACHINE-VIEW-4.1 keeps disconnected states in caller order on one row', () => {
    render(
      <StateMachineView
        {...sequencePresentation}
        states={states}
        transitions={[]}
        currentKey="blue"
      />,
    );
    const alpha = readStatePosition('Alpha');
    const blue = readStatePosition('Blue');
    const gamma = readStatePosition('Gamma');

    expect([alpha.y, blue.y, gamma.y]).toEqual([alpha.y, alpha.y, alpha.y]);
    expect(blue.x).toBeGreaterThan(alpha.x);
    expect(gamma.x).toBeGreaterThan(blue.x);
  });

  it.each([
    { label: 'Advance', direction: 'forward' },
    { label: 'Return', direction: 'reverse' },
  ])(
    'UIC-STATE-MACHINE-VIEW-4.2 places the $direction transition label outside the state row',
    ({ label, direction }) => {
      render(
        <StateMachineView {...sequencePresentation} states={states} transitions={transitions} />,
      );
      const row = readStatePosition('Alpha');
      const labelY = parseFloat(screen.getByText(label).style.top);

      if (direction === 'forward') expect(labelY).toBeLessThan(row.y);
      else expect(labelY).toBeGreaterThan(row.y + row.height);
    },
  );

  it('UIC-STATE-MACHINE-VIEW-4.3 keeps connector paths inert', () => {
    const { container } = render(
      <StateMachineView {...sequencePresentation} states={states} transitions={transitions} />,
    );
    expect(container.querySelectorAll('.ui-diagram-canvas__edge-hit')).toHaveLength(0);
  });

  it('UIC-STATE-MACHINE-VIEW-4.3 exposes each named transition label as a focusable control', () => {
    render(
      <StateMachineView {...sequencePresentation} states={states} transitions={transitions} />,
    );

    for (const name of ['Advance', 'Finish', 'Return']) {
      const label = screen.getByRole('button', { name });
      expect(label.tabIndex).toBeGreaterThanOrEqual(0);
      expect(label).not.toHaveAttribute('aria-hidden', 'true');
    }
  });
});

describe('StateMachineView sequence interactions', () => {
  it('UIC-STATE-MACHINE-VIEW-4.1 preserves accessible root naming, description and details relationships', () => {
    render(
      <>
        <h2 id="sequence-name">Ordered states</h2>
        <p id="sequence-description">States follow the supplied order.</p>
        <p id="sequence-details">Choose a state to highlight its outgoing transitions.</p>
        <StateMachineView
          presentation="sequence"
          states={states}
          transitions={transitions}
          aria-labelledby="sequence-name"
          aria-describedby="sequence-description"
          aria-details="sequence-details"
        />
      </>,
    );
    const root = screen.getByRole('group', { name: 'Ordered states' });
    expect(root).toHaveAccessibleDescription('States follow the supplied order.');
    expect(root).toHaveAttribute(
      'aria-details',
      screen.getByText('Choose a state to highlight its outgoing transitions.').id,
    );
  });

  it('UIC-STATE-MACHINE-VIEW-4.1 UIC-STATE-MACHINE-VIEW-4.4 exposes hooks, status, density and root attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <StateMachineView
        presentation="sequence"
        density="compact"
        states={states}
        transitions={transitions}
        currentKey="blue"
        selectedKey="alpha"
        selectedTransitionKey="advance"
        className="host"
        id="sequence"
        ref={ref}
        data-example="forwarded"
      />,
    );
    expect(screen.getByRole('group', { name: 'State machine' })).toBe(ref.current);
    expect(ref.current).toHaveAttribute('id', 'sequence');
    expect(ref.current).toHaveClass('host');
    expect(ref.current).toHaveAttribute('data-density', 'compact');
    expect(ref.current).toHaveAttribute('data-size', 'md');
    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAccessibleDescription(
      'Current state.',
    );
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('data-first', 'true');
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('data-last', 'true');
    expectHooksMatchSpec(container, 'STATE-MACHINE-VIEW', {
      slots: ['state', 'state-content', 'state-label', 'initial-marker', 'state-position', 'route'],
      callerAttributes: ['data-example'],
    });
  });

  it('UIC-STATE-MACHINE-VIEW-4.3 UIC-STATE-MACHINE-VIEW-4.4 sends typed state/transition actions and context requests', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onTransitionAction = vi.fn();
    const onTransitionContextMenu = vi.fn();
    render(
      <StateMachineView
        presentation="sequence"
        states={[
          { id: 1, label: 'Number' },
          { id: '1', label: 'Text' },
        ]}
        transitions={[
          { id: 1, from: 1, to: '1', label: 'Numeric action' },
          { id: '1', from: '1', to: 1, label: 'Text action' },
        ]}
        currentKey={1}
        selectedKey={1}
        onSelectionChange={onSelectionChange}
        onTransitionAction={onTransitionAction}
        onTransitionContextMenu={onTransitionContextMenu}
        renderTransitionLabel={(transition) => <span>Visible {transition.label}</span>}
        getTransitionTooltip={(transition) => `Hint for ${transition.label}`}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Text' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith('1');
    expect(screen.getByRole('button', { name: 'Number' })).toHaveAttribute('aria-current', 'step');
    await user.click(screen.getByRole('button', { name: 'Numeric action' }));
    expect(onTransitionAction).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ type: 'press' }),
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Text action' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onTransitionAction).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({ id: '1' }),
      expect.objectContaining({ pointerType: 'keyboard' }),
    );
    await user.keyboard(' ');
    expect(onTransitionAction).toHaveBeenCalledTimes(3);
    await user.pointer({
      keys: '[MouseRight]',
      target: screen.getByRole('button', { name: 'Text action' }),
    });
    expect(onTransitionContextMenu).toHaveBeenLastCalledWith(
      '1',
      expect.objectContaining({ id: '1' }),
      expect.objectContaining({ pointerType: 'mouse' }),
    );
  });

  it('UIC-STATE-MACHINE-VIEW-4.3 retains unnamed connectors without creating unnamed buttons', () => {
    const { container } = render(
      <StateMachineView
        presentation="sequence"
        states={states}
        transitions={[
          { id: 'blank', from: 'alpha', to: 'blue' },
          { id: 'space', from: 'blue', to: 'gamma', label: ' ' },
        ]}
      />,
    );
    expect(container.querySelectorAll('.ui-state-machine-view__route')).toHaveLength(2);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    const svg = requireDefined(container.querySelector('.ui-state-machine-view__routes'));
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveStyle({ pointerEvents: 'none' });
  });

  it('UIC-STATE-MACHINE-VIEW-4.4 stacks highlighted lines above ordinary lines, with every label above lines', () => {
    const { container, rerender } = render(
      <StateMachineView
        presentation="sequence"
        states={states}
        transitions={transitions}
        selectedKey="alpha"
        selectedTransitionKey="return"
      />,
    );
    const routes = () => [...container.querySelectorAll('.ui-state-machine-view__route')];
    expect(routes().at(-1)).toHaveAttribute('data-selected', 'true');
    expect(routes().at(-2)).toHaveAttribute('data-outgoing', 'true');
    const paths = routes()
      .map((route) => route.querySelector('path')?.getAttribute('d'))
      .sort();
    rerender(
      <StateMachineView
        presentation="sequence"
        states={states}
        transitions={transitions}
        selectedKey="blue"
        selectedTransitionKey="advance"
      />,
    );
    expect(
      routes()
        .map((route) => route.querySelector('path')?.getAttribute('d'))
        .sort(),
    ).toEqual(paths);
    for (const label of ['Advance', 'Finish', 'Return'])
      expect(screen.getByRole('button', { name: label }).style.zIndex).toBe('2');
  });

  it('UIC-STATE-MACHINE-VIEW-4.1 UIC-STATE-MACHINE-VIEW-4.5 hydrates deterministic geometry and isolates instances', async () => {
    const machine = (
      <StateMachineView
        presentation="sequence"
        states={states}
        transitions={transitions}
        aria-label="Server sequence"
      />
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(machine);
    document.body.append(host);
    const before = getStatePosition('Blue', host).getAttribute('style');
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(() => {
      root = hydrateRoot(host, machine);
    });
    expect(getStatePosition('Blue', host)).toHaveAttribute('style', before);
    render(
      <StateMachineView
        presentation="sequence"
        states={states.slice(0, 1)}
        transitions={[]}
        aria-label="Other sequence"
      />,
    );
    expect(screen.getByRole('group', { name: 'Other sequence' })).not.toBe(
      screen.getByRole('group', { name: 'Server sequence' }),
    );
    await act(() => root?.unmount());
    host.remove();
  });
});

it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
  'UIC-STATE-MACHINE-VIEW-4.6 publishes %s and changes size without resetting selection or focus',
  (size) => {
    const props = { ...sequencePresentation, states, transitions, selectedKey: 'blue' };
    const { rerender } = render(<StateMachineView {...props} size="xs" />);
    const selected = screen.getByRole('button', { name: 'Blue' });
    act(() => selected.focus());
    rerender(<StateMachineView {...props} size={size} />);
    const root = screen.getByRole('group', { name: 'State machine' });
    expect(root).toHaveAttribute('data-size', size);
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    expect(selected).toHaveFocus();
    expectHooksMatchSpec(root, 'STATE-MACHINE-VIEW');
    rerender(<StateMachineView {...props} size={size} states={[]} transitions={[]} />);
    expect(root).toHaveAttribute('data-size', size);
    expect(screen.getByRole('note')).toHaveAttribute('tabindex', '0');
  },
);

it('UIC-STATE-MACHINE-VIEW-4.6 keeps sequence size out of the graph presentation', () => {
  render(<StateMachineView states={states} transitions={transitions} size="xl" />);
  const root = screen.getByRole('group', { name: 'State machine' });
  expect(root).toHaveAttribute('data-presentation', 'graph');
  expect(root).not.toHaveAttribute('data-size');
  expect(root).not.toHaveAttribute('size');
});

it('UIC-STATE-MACHINE-VIEW-4.5 observes viewport/content changes and releases observations on unmount', () => {
  const observers: { callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn> }[] =
    [];
  class Observer {
    disconnect = vi.fn();
    observe = vi.fn();
    unobserve = vi.fn();
    constructor(callback: ResizeObserverCallback) {
      observers.push({ callback, disconnect: this.disconnect });
    }
  }
  vi.stubGlobal('ResizeObserver', Observer);
  try {
    const { container, unmount } = render(
      <StateMachineView presentation="sequence" states={states} transitions={transitions} />,
    );
    const viewport = requireDefined(
      container.querySelector<HTMLElement>('.ui-state-machine-view__viewport'),
    );
    Object.defineProperty(viewport, 'clientWidth', { value: 1216, configurable: true });
    const label = screen.getByRole('button', { name: 'Advance' });
    vi.spyOn(label, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      right: 500,
      top: 0,
      bottom: 70,
      width: 500,
      height: 70,
      toJSON: () => ({}),
    });
    act(() => observers.forEach(({ callback }) => callback([], {} as ResizeObserver)));
    expect(readStatePosition('Blue').x - readStatePosition('Alpha').x).toBe(400);
    const content = requireDefined(
      container.querySelector<HTMLElement>('.ui-state-machine-view__content'),
    );
    expect(content.style.getPropertyValue('--ui-sequence-lane-pitch')).toBe('74px');
    unmount();
    expect(observers.length).toBeGreaterThan(0);
    expect(observers.every(({ disconnect }) => disconnect.mock.calls.length === 1)).toBe(true);
    act(() => observers.forEach(({ callback }) => callback([], {} as ResizeObserver)));
  } finally {
    vi.unstubAllGlobals();
  }
});
