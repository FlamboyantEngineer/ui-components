import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PropertyScope } from '../property-scope/property-scope.js';
import { FourSidePropertyStrip } from './four-side-property-strip.js';

describe('FourSidePropertyStrip', () => {
  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.1 draws top, bottom, left and right cells in that order with decorative letters', () => {
    const { container } = render(
      <FourSidePropertyStrip
        label="Margins"
        renderSide={(side) => <input aria-label={`Margin ${side}`} />}
      />,
    );
    const inputs = screen.getAllByRole('textbox').map((input) => input.getAttribute('aria-label'));
    expect(inputs).toEqual(['Margin top', 'Margin bottom', 'Margin left', 'Margin right']);
    const cells = Array.from(container.querySelectorAll('.ui-four-side-property-strip__side'));
    expect(cells.map((cell) => cell.getAttribute('data-side'))).toEqual([
      'top',
      'bottom',
      'left',
      'right',
    ]);
    for (const cell of cells) expect(cell).toHaveClass('ui-property-strip-cell');
    const letters = cells.map((cell) => cell.querySelector('.ui-property-strip-cell__letter'));
    expect(letters.map((letter) => letter?.textContent)).toEqual(['T', 'B', 'L', 'R']);
    expect(letters.map((letter) => letter?.getAttribute('title'))).toEqual([
      'Top',
      'Bottom',
      'Left',
      'Right',
    ]);
    expect(screen.getByRole('group', { name: 'Margins' })).toContainElement(
      container.querySelector('.ui-property-strip'),
    );
    expectHooksMatchSpec(container, 'FOUR-SIDE-PROPERTY-STRIP', { slots: 'all' });
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.1 takes the side names from the provider', () => {
    const names = { top: 'Haut', bottom: 'Bas', left: 'Gauche', right: 'Droite' } as const;
    const { container } = render(
      <UiProvider strings={{ boxSide: (side) => names[side] }}>
        <FourSidePropertyStrip label="Marges" renderSide={(side) => <span>{side}</span>} />
      </UiProvider>,
    );
    const letters = container.querySelectorAll('.ui-property-strip-cell__letter');
    expect(Array.from(letters, (letter) => letter.textContent)).toEqual(['H', 'B', 'G', 'D']);
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.2 passes the row options and matches a query for a side name', () => {
    const { container, rerender } = render(
      <PropertyScope query="right">
        <FourSidePropertyStrip
          label="Padding"
          unit="px"
          hint="Inside the frame"
          isOverridden
          wide
          renderSide={(side) => <span>{side}</span>}
        />
      </PropertyScope>,
    );
    const row = container.querySelector('.ui-property-row') as HTMLElement;
    expect(row).not.toHaveAttribute('hidden');
    expect(row).toHaveAttribute('data-overridden', 'true');
    expect(row).toHaveAttribute('data-wide', 'true');
    expect(row.querySelector('.ui-property-row__unit')).toHaveTextContent('px');
    expect(row.querySelector('.ui-property-row__hint')).toHaveTextContent('Inside the frame');

    rerender(
      <PropertyScope query="colour">
        <FourSidePropertyStrip label="Padding" renderSide={(side) => <span>{side}</span>} />
      </PropertyScope>,
    );
    expect(row).toHaveAttribute('hidden');
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.3 appends the caller class and forwards id and data attributes to the row', () => {
    const { container } = render(
      <FourSidePropertyStrip
        label="Margins"
        className="caller"
        id="margins"
        data-probe="strip"
        renderSide={(side) => <span>{side}</span>}
      />,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row).toHaveClass('ui-property-row', 'ui-four-side-property-strip', 'caller');
    expect(row).toHaveAttribute('id', 'margins');
    expect(row).toHaveAttribute('data-probe', 'strip');
    expect(document.getElementById('margins-label')).toHaveTextContent('Margins');
    expectHooksMatchSpec(container, 'FOUR-SIDE-PROPERTY-STRIP', {
      callerAttributes: ['data-probe'],
    });
  });
});
