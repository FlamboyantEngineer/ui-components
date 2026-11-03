import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  StateMachineView,
  type StateMachineState,
  type StateMachineViewProps,
} from './state-machine-view.js';

const states: StateMachineState[] = [
  { id: 'draft', label: 'Draft', status: 'complete', tone: 'success', description: 'Done.' },
  { id: 'review', label: 'Review', status: 'blocked', tone: 'warning', count: 0 },
  { id: 'approved', label: 'Approved', status: 'error', tone: 'danger', notificationCount: 12 },
];

function Sequence(props: Partial<StateMachineViewProps>) {
  return (
    <StateMachineView
      presentation="sequence"
      aria-label="Lifecycle"
      states={states}
      transitions={[]}
      {...props}
    />
  );
}

function getCount(name: string) {
  return screen
    .getByRole('button', { name })
    .querySelector<HTMLElement>('.ui-state-machine-view__count');
}

describe('StateMachineView sequence statuses and counts', () => {
  it('UIC-STATE-MACHINE-VIEW-6.1 publishes host statuses apart from machine state and selection', () => {
    const { container } = render(
      <Sequence
        currentKey="review"
        selectedKey="approved"
        renderStateAdornment={(state) => <span>{state.status}</span>}
      />,
    );
    const draft = screen.getByRole('button', { name: 'Draft' });
    expect(draft).toHaveAttribute('data-status', 'complete');
    expect(draft).toHaveAttribute('data-tone', 'success');
    expect(draft).toHaveAccessibleDescription('Initial state. Done.');
    expect(screen.getByRole('button', { name: 'Review' })).toHaveAccessibleDescription(
      'Current state. 0 items',
    );
    expect(screen.getByRole('button', { name: 'Approved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(draft.querySelector('.ui-state-machine-view__state-adornment')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expectHooksMatchSpec(container, 'STATE-MACHINE-VIEW', {
      slots: ['state-adornment', 'count', 'state-content'],
    });
  });

  it('UIC-STATE-MACHINE-VIEW-6.1 reads the host description in the graph and its outline too', () => {
    const { unmount } = render(
      <StateMachineView aria-label="Graph" states={states} transitions={[]} />,
    );
    const draft = screen.getByRole('group', { name: 'Draft' });
    expect(draft).toHaveAccessibleDescription(expect.stringContaining('Initial state. Done.'));
    expect(within(draft).getByText('Draft').parentElement).toHaveAttribute(
      'data-status',
      'complete',
    );
    unmount();
    render(
      <StateMachineView
        aria-label="Graph"
        states={states}
        transitions={[]}
        defaultView="outline"
      />,
    );
    expect(screen.getByText('Initial state. Done.')).toBeInTheDocument();
  });

  it('UIC-STATE-MACHINE-VIEW-6.2 shows structural counts exactly and caps notification counts', () => {
    const { rerender } = render(
      <Sequence
        states={[
          { id: 'zero', label: 'Zero', count: 0 },
          { id: 'large', label: 'Large', count: 1234, countLabel: '1,234 outgoing transitions' },
          { id: 'none', label: 'None', notificationCount: 0 },
          { id: 'one', label: 'One', notificationCount: 1 },
          { id: 'nine', label: 'Nine', notificationCount: 9 },
          { id: 'ten', label: 'Ten', notificationCount: 10 },
          { id: 'both', label: 'Both', count: 3, notificationCount: 50 },
        ]}
      />,
    );
    expect(getCount('Zero')).toHaveTextContent('0');
    expect(getCount('Zero')).toHaveAttribute('data-kind', 'structural');
    expect(getCount('Large')).toHaveTextContent('1,234');
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAccessibleDescription(
      '1,234 outgoing transitions',
    );
    expect(getCount('None')).toBeNull();
    expect(getCount('One')).toHaveTextContent('1');
    expect(getCount('Nine')).toHaveTextContent('9');
    expect(getCount('Ten')).toHaveTextContent('9+');
    expect(getCount('Ten')).toHaveAttribute('data-kind', 'notification');
    expect(getCount('Ten')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Ten' })).toHaveAccessibleDescription('10 items');
    expect(getCount('Both')).toHaveTextContent('3');
    expect(getCount('Both')).toHaveAttribute('data-kind', 'structural');

    rerender(
      <Sequence
        density="compact"
        states={[{ id: 'off', label: 'Off', count: 2, isDisabled: true }]}
      />,
    );
    expect(getCount('Off')).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAccessibleDescription(
      'Initial state. 2 items',
    );
  });
});

describe('StateMachineView sequence tooltips', () => {
  it('UIC-STATE-MACHINE-VIEW-6.3 reads state and transition hints once, with unique ids per instance', async () => {
    const user = userEvent.setup();
    const props = {
      states: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      transitions: [{ id: 't', from: 'a', to: 'b', label: 'Go', description: 'From A to B.' }],
      getStateTooltip: (state: StateMachineState) => `About ${state.label}`,
      getTransitionTooltip: () => 'Runs the go rule.',
      stateTooltipPlacement: 'bottom' as const,
    };
    render(
      <>
        <Sequence {...props} aria-label="First" />
        <Sequence {...props} aria-label="Second" />
      </>,
    );
    const first = screen.getByRole('group', { name: 'First' });
    const second = screen.getByRole('group', { name: 'Second' });
    const stateA = within(first).getByRole('button', { name: 'A' });
    expect(stateA).toHaveAccessibleDescription('Initial state. About A');
    expect(within(first).getByRole('button', { name: 'Go' })).toHaveAccessibleDescription(
      'From A to B. Runs the go rule.',
    );
    expect(stateA.getAttribute('aria-describedby')).not.toBe(
      within(second).getByRole('button', { name: 'A' }).getAttribute('aria-describedby'),
    );

    await user.tab();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('About A');
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-placement', 'bottom');
    expect(stateA).toHaveAccessibleDescription('Initial state. About A');
  });

  it('UIC-STATE-MACHINE-VIEW-6.3 keeps hint ids stable through hydration', async () => {
    const machine = (
      <Sequence states={states} getStateTooltip={(state) => `About ${state.label}`} />
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(machine);
    document.body.append(host);
    const before = within(host)
      .getByRole('button', { name: 'Draft' })
      .getAttribute('aria-describedby');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(() => {
      root = hydrateRoot(host, machine);
    });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(within(host).getByRole('button', { name: 'Draft' })).toHaveAttribute(
      'aria-describedby',
      before,
    );
    await act(() => root?.unmount());
    host.remove();
  });
});

describe('StateMachineView empty sequence', () => {
  it('UIC-STATE-MACHINE-VIEW-6.4 shows a focusable note that anchors background requests', async () => {
    const user = userEvent.setup();
    const onBackgroundContextMenu = vi.fn();
    const { rerender } = render(
      <Sequence
        states={[]}
        emptyLabel="Workflow"
        renderEmptyState={() => 'Right-click to add states.'}
        onBackgroundContextMenu={onBackgroundContextMenu}
      />,
    );
    const root = screen.getByRole('group', { name: 'Lifecycle' });
    expect(root).toHaveAttribute('data-empty', 'true');
    const note = screen.getByRole('note', { name: 'Workflow' });
    expect(note).toHaveAccessibleDescription('Right-click to add states.');
    fireEvent.contextMenu(note, { clientX: 1, clientY: 2 });
    expect(onBackgroundContextMenu).toHaveBeenLastCalledWith(
      expect.objectContaining({ anchor: { x: 1, y: 2 } }),
    );
    await user.tab();
    expect(note).toHaveFocus();
    await user.keyboard('{ContextMenu}');
    expect(onBackgroundContextMenu).toHaveBeenLastCalledWith(
      expect.objectContaining({ anchor: note, pointerType: 'keyboard' }),
    );

    rerender(<Sequence states={states} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Lifecycle' })).toBe(root);
    expect(root).not.toHaveAttribute('data-empty');
    rerender(<Sequence states={[]} />);
    expect(screen.getByRole('note', { name: 'No states' })).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('group', { name: 'Lifecycle' })).toBe(root);
  });
});
