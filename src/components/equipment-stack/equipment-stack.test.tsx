import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { EquipmentStack, type EquipmentStackFace } from './equipment-stack.js';

const faces: EquipmentStackFace[] = [
  { id: 'switch', label: 'Network switch', units: 1, readout: '24 ports', status: 'Online' },
  {
    id: 'gap',
    label: 'Position 2',
    units: 2,
    isMissing: true,
    readout: 'Hidden',
    status: 'Hidden',
  },
  { id: 'supply', label: 'Power supply', units: 1.5, readout: 0, status: '' },
];

function faceElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('.ui-equipment-stack__face')];
}

describe('EquipmentStack', () => {
  it('UIC-EQUIPMENT-STACK-1.1 UIC-EQUIPMENT-STACK-3.1 lists labelled faces in order', () => {
    const { container } = render(
      <EquipmentStack
        aria-label="Cabinet A"
        faces={faces}
        unitRatio={10}
        missingPlaceholder="Empty"
      />,
    );
    const list = screen.getByRole('list', { name: 'Cabinet A' });
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Network switch24 portsOnline',
      'Position 2Empty',
      'Power supply0',
    ]);
    expect(items[0]?.firstElementChild).toHaveClass('ui-equipment-stack__label');
    expect(container.querySelector('[tabindex]')).toBeNull();
    expectHooksMatchSpec(container, 'EQUIPMENT-STACK', { slots: 'all' });
  });

  it('UIC-EQUIPMENT-STACK-1.1 keeps each face element by id when faces reorder', () => {
    const { container, rerender } = render(
      <EquipmentStack aria-label="Cabinet" faces={faces} unitRatio={10} />,
    );
    const [first, , last] = faceElements(container);
    rerender(<EquipmentStack aria-label="Cabinet" faces={[...faces].reverse()} unitRatio={10} />);
    const reordered = faceElements(container);
    expect(reordered[0]).toBe(last);
    expect(reordered[2]).toBe(first);
  });

  it('UIC-EQUIPMENT-STACK-1.2 renders readout and status slots only for real content', () => {
    const { container } = render(
      <EquipmentStack aria-label="Cabinet" faces={faces} unitRatio={10} />,
    );
    const [switchFace, , supplyFace] = faceElements(container);
    expect([...(switchFace?.children ?? [])].map((child) => child.className)).toEqual([
      'ui-equipment-stack__label',
      'ui-equipment-stack__readout',
      'ui-equipment-stack__status',
    ]);
    expect(supplyFace?.querySelector('.ui-equipment-stack__readout')).toHaveTextContent('0');
    expect(supplyFace?.querySelector('.ui-equipment-stack__status')).toBeNull();
  });

  it('UIC-EQUIPMENT-STACK-1.3 shows the placeholder in place of a missing face content', () => {
    const { container, rerender } = render(
      <EquipmentStack
        aria-label="Cabinet"
        faces={faces}
        unitRatio={10}
        missingPlaceholder="Empty"
      />,
    );
    const missing = faceElements(container)[1];
    expect(missing).toHaveAttribute('data-missing', 'true');
    expect(faceElements(container)[0]).not.toHaveAttribute('data-missing');
    expect(missing?.querySelector('.ui-equipment-stack__placeholder')).toHaveTextContent('Empty');
    expect(missing?.querySelector('.ui-equipment-stack__readout')).toBeNull();
    expect(missing?.querySelector('.ui-equipment-stack__status')).toBeNull();
    expect(missing?.style.getPropertyValue('--ui-equipment-stack-units')).toBe('2');

    rerender(<EquipmentStack aria-label="Cabinet" faces={faces} unitRatio={10} />);
    expect(missing?.textContent).toBe('Position 2');
  });

  it('UIC-EQUIPMENT-STACK-2.1 publishes the ratio and each face units', () => {
    const { container, rerender } = render(
      <EquipmentStack aria-label="Cabinet" faces={faces} unitRatio={10.5} />,
    );
    const list = screen.getByRole('list');
    expect(list.style.getPropertyValue('--ui-equipment-stack-ratio')).toBe('10.5');
    expect(
      faceElements(container).map((face) =>
        face.style.getPropertyValue('--ui-equipment-stack-units'),
      ),
    ).toEqual(['1', '2', '1.5']);

    const invalid = [0, -2, Number.NaN, Number.POSITIVE_INFINITY].map((units, index) => ({
      id: index,
      label: `Face ${index}`,
      units,
    }));
    rerender(<EquipmentStack aria-label="Cabinet" faces={invalid} unitRatio={0} />);
    expect(list.style.getPropertyValue('--ui-equipment-stack-ratio')).toBe('1');
    expect(
      faceElements(container).map((face) =>
        face.style.getPropertyValue('--ui-equipment-stack-units'),
      ),
    ).toEqual(['1', '1', '1', '1']);
  });

  it('UIC-EQUIPMENT-STACK-3.1 takes its name and description from the caller', () => {
    render(
      <>
        <h2 id="stack-title">Bench</h2>
        <p id="stack-note">Top to bottom</p>
        <EquipmentStack
          aria-labelledby="stack-title"
          aria-describedby="stack-note"
          faces={[]}
          unitRatio={10}
        />
      </>,
    );
    const list = screen.getByRole('list', { name: 'Bench' });
    expect(list).toHaveAccessibleDescription('Top to bottom');
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('UIC-EQUIPMENT-STACK-3.2 forwards className, id, data attributes and ref', () => {
    const ref = createRef<HTMLOListElement>();
    render(
      <EquipmentStack
        ref={ref}
        aria-label="Cabinet"
        className="host"
        id="cabinet"
        data-testid="stack"
        faces={faces}
        unitRatio={10}
      />,
    );
    const list = screen.getByRole('list');
    expect(ref.current).toBe(list);
    expect(list).toHaveClass('ui-equipment-stack', 'host');
    expect(list).toHaveAttribute('id', 'cabinet');
    expect(list).toHaveAttribute('data-testid', 'stack');
  });
});
