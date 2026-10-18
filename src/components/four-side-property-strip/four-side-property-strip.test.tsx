import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PropertyScope } from '../property-scope/property-scope.js';
import {
  FourSidePropertyStrip,
  type BoxSide,
  type FourSideValues,
} from './four-side-property-strip.js';

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
    expectHooksMatchSpec(container, 'FOUR-SIDE-PROPERTY-STRIP', { slots: ['side'] });
    expect(container.querySelector('.ui-four-side-property-strip__link')).toBeNull();
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

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.4 names flow-relative sides and hands them to the controls', () => {
    const { container } = render(
      <I18nProvider locale="ar-EG">
        <div dir="rtl">
          <FourSidePropertyStrip
            label="Padding"
            sides="logical"
            renderSide={(side) => <input aria-label={`Padding ${side}`} />}
          />
        </div>
      </I18nProvider>,
    );
    const cells = Array.from(container.querySelectorAll('.ui-four-side-property-strip__side'));
    expect(cells.map((cell) => cell.getAttribute('data-side'))).toEqual([
      'block-start',
      'block-end',
      'inline-start',
      'inline-end',
    ]);
    const letters = cells.map((cell) => cell.querySelector('.ui-property-strip-cell__letter'));
    expect(letters.map((letter) => letter?.textContent)).toEqual(['T', 'B', 'S', 'E']);
    expect(screen.getAllByRole('textbox').map((input) => input.getAttribute('aria-label'))).toEqual(
      ['Padding block-start', 'Padding block-end', 'Padding inline-start', 'Padding inline-end'],
    );
    expectHooksMatchSpec(container, 'FOUR-SIDE-PROPERTY-STRIP', { slots: ['side'] });
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 holds the values and sets linked sides together', async () => {
    const onChange = vi.fn<(values: FourSideValues<BoxSide, string>) => void>();
    const onLinkedChange = vi.fn();
    const { container } = render(
      <FourSidePropertyStrip
        label="Margins"
        defaultValue={{ top: '1', bottom: '2', left: '3', right: '4' }}
        onChange={onChange}
        link="pairs"
        onLinkedChange={onLinkedChange}
        renderSide={(side, field) => (
          <input
            aria-label={`Margin ${side}`}
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
          />
        )}
      />,
    );
    const input = (side: string) => screen.getByRole('textbox', { name: `Margin ${side}` });
    await userEvent.type(input('top'), '0');
    expect(input('top')).toHaveValue('10');
    expect(input('bottom')).toHaveValue('2');
    const toggle = screen.getByRole('button', { name: 'Link opposite sides' });
    expect(toggle).toHaveClass('ui-four-side-property-strip__link', 'ui-icon-button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(onLinkedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const row = container.querySelector('.ui-four-side-property-strip');
    expect(row).toHaveAttribute('data-linked', 'true');
    expect(input('bottom')).toHaveValue('2');
    await userEvent.type(input('left'), '5');
    expect(input('left')).toHaveValue('35');
    expect(input('right')).toHaveValue('35');
    expect(input('top')).toHaveValue('10');
    expect(onChange).toHaveBeenLastCalledWith({ top: '10', bottom: '2', left: '35', right: '35' });
    expectHooksMatchSpec(container, 'FOUR-SIDE-PROPERTY-STRIP', { slots: 'all' });
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 links all four sides under a controlled value', async () => {
    function Controlled() {
      const [values, setValues] = useState<FourSideValues<BoxSide, number>>({ top: 4 });
      return (
        <FourSidePropertyStrip<number>
          label="Padding"
          value={values}
          onChange={setValues}
          link="all"
          defaultLinked
          renderSide={(side, field) => (
            <button type="button" onClick={() => field.onChange((field.value ?? 0) + 1)}>
              {`Grow ${side} ${field.value ?? 0}`}
            </button>
          )}
        />
      );
    }
    const { container } = render(<Controlled />);
    expect(container.querySelector('.ui-four-side-property-strip')).toHaveAttribute(
      'data-linked',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Grow top 4' }));
    for (const side of ['top', 'bottom', 'left', 'right']) {
      expect(screen.getByRole('button', { name: `Grow ${side} 5` })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: 'Link all sides' }));
    expect(container.querySelector('.ui-four-side-property-strip')).not.toHaveAttribute(
      'data-linked',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Grow left 5' }));
    expect(screen.getByRole('button', { name: 'Grow left 6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grow right 5' })).toBeInTheDocument();
  });
});
