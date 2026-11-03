import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  StateMachineView,
  type StateMachineState,
  type StateMachineTransition,
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

// Spread the requested option so this reproduction runs before its public type is implemented.
const sequencePresentation = { presentation: 'sequence' } as const;

function readStatePosition(name: string) {
  const element = screen.getByRole('group', { name });
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
