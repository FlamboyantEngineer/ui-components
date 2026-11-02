import { act, render, screen } from '@testing-library/react';
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
  type FourSideField,
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
    const boxSide = '{side, select, top {Haut} bottom {Bas} left {Gauche} other {Droite}}';
    const { container } = render(
      <UiProvider messages={{ boxSide }}>
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
    const vertical = screen.getByRole('button', { name: 'Link top and bottom' });
    const horizontal = screen.getByRole('button', { name: 'Link left and right' });
    expect(horizontal).toHaveClass('ui-four-side-property-strip__link', 'ui-button');
    expect(horizontal).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(horizontal);
    expect(onLinkedChange).toHaveBeenLastCalledWith(['horizontal']);
    expect(horizontal).toHaveAttribute('aria-pressed', 'true');
    expect(vertical).toHaveAttribute('aria-pressed', 'false');
    const linkedSides = () =>
      [...container.querySelectorAll('.ui-four-side-property-strip__side[data-linked]')].map(
        (cell) => cell.getAttribute('data-side'),
      );
    expect(linkedSides()).toEqual(['left', 'right']);
    expect(input('bottom')).toHaveValue('2');
    // Only the linked pair moves together; the other pair keeps its values and its state.
    await userEvent.type(input('left'), '5');
    expect(input('left')).toHaveValue('35');
    expect(input('right')).toHaveValue('35');
    await userEvent.type(input('top'), '1');
    expect(input('top')).toHaveValue('101');
    expect(input('bottom')).toHaveValue('2');
    expect(onChange).toHaveBeenLastCalledWith({ top: '101', bottom: '2', left: '35', right: '35' });
    await userEvent.click(vertical);
    expect(onLinkedChange).toHaveBeenLastCalledWith(['vertical', 'horizontal']);
    await userEvent.type(input('bottom'), '7');
    expect(input('top')).toHaveValue('27');
    await userEvent.click(horizontal);
    expect(onLinkedChange).toHaveBeenLastCalledWith(['vertical']);
    expect(linkedSides()).toEqual(['top', 'bottom']);
    await userEvent.type(input('right'), '0');
    expect(input('right')).toHaveValue('350');
    expect(input('left')).toHaveValue('35');
    expectHooksMatchSpec(container, 'FOUR-SIDE-PROPERTY-STRIP', { slots: 'all' });
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 keeps controlled linked pairs coherent across modes', async () => {
    const onLinkedChange = vi.fn();
    const strip = (link: 'all' | 'pairs', linked: readonly ('block' | 'inline')[]) => (
      <FourSidePropertyStrip
        label="Inset"
        sides="logical"
        link={link}
        linked={linked}
        onLinkedChange={onLinkedChange}
        renderSide={(side) => <input aria-label={`Inset ${side}`} />}
      />
    );
    const { rerender } = render(strip('pairs', ['inline']));
    const pressed = () =>
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-pressed'));
    expect(pressed()).toEqual(['false', 'true']);
    await userEvent.click(screen.getByRole('button', { name: 'Link top and bottom' }));
    expect(onLinkedChange).toHaveBeenLastCalledWith(['block', 'inline']);
    // Not accepted by the owner: the toggles keep showing what the owner holds.
    expect(pressed()).toEqual(['false', 'true']);
    // All sides are linked only while both pairs are.
    rerender(strip('all', ['inline']));
    expect(pressed()).toEqual(['false']);
    await userEvent.click(screen.getByRole('button', { name: 'Link all sides' }));
    expect(onLinkedChange).toHaveBeenLastCalledWith(['block', 'inline']);
    rerender(strip('all', ['block', 'inline']));
    expect(pressed()).toEqual(['true']);
    await userEvent.click(screen.getByRole('button', { name: 'Link all sides' }));
    expect(onLinkedChange).toHaveBeenLastCalledWith([]);
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
          defaultLinked={['vertical', 'horizontal']}
          renderSide={(side, field) => (
            <button type="button" onClick={() => field.onChange((field.value ?? 0) + 1)}>
              {`Grow ${side} ${field.value ?? 0}`}
            </button>
          )}
        />
      );
    }
    const { container } = render(<Controlled />);
    const bracket = () => container.querySelector('.ui-four-side-property-strip__bracket');
    expect(bracket()).toHaveAttribute('data-linked', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Grow top 4' }));
    for (const side of ['top', 'bottom', 'left', 'right']) {
      expect(screen.getByRole('button', { name: `Grow ${side} 5` })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: 'Link all sides' }));
    expect(bracket()).not.toHaveAttribute('data-linked');
    await userEvent.click(screen.getByRole('button', { name: 'Grow left 5' }));
    expect(screen.getByRole('button', { name: 'Grow left 6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grow right 5' })).toBeInTheDocument();
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 builds edits made in one batch on each other', () => {
    const fields = new Map<string, FourSideField<number>>();
    const onChange = vi.fn<(value: FourSideValues<string, number>) => void>();
    function Strip(props: { link?: 'all' | 'pairs'; value?: FourSideValues<BoxSide, number> }) {
      return (
        <FourSidePropertyStrip<number>
          label="Margin"
          defaultValue={props.value ? undefined : { top: 1, bottom: 2, left: 3, right: 4 }}
          value={props.value}
          onChange={onChange}
          link={props.link}
          defaultLinked={['vertical', 'horizontal']}
          renderSide={(side, field) => {
            fields.set(side, field);
            return <output aria-label={`Margin ${side}`}>{field.value ?? ''}</output>;
          }}
        />
      );
    }
    const field = (side: string) => {
      const found = fields.get(side);
      if (!found) throw new Error(`no ${side} field`);
      return found;
    };
    const shown = (side: string) => screen.getByRole('status', { name: `Margin ${side}` });

    const { unmount } = render(<Strip />);
    act(() => {
      field('top').onChange(10);
      field('left').onChange(30);
      field('left').onChange(31);
    });
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([
      { top: 10, bottom: 2, left: 3, right: 4 },
      { top: 10, bottom: 2, left: 30, right: 4 },
      { top: 10, bottom: 2, left: 31, right: 4 },
    ]);
    expect(shown('top')).toHaveTextContent('10');
    expect(shown('left')).toHaveTextContent('31');
    unmount();

    onChange.mockClear();
    const { unmount: unmountPairs } = render(<Strip link="pairs" />);
    act(() => {
      field('top').onChange(10);
      field('left').onChange(30);
    });
    expect(onChange).toHaveBeenLastCalledWith({ top: 10, bottom: 10, left: 30, right: 30 });
    expect(shown('bottom')).toHaveTextContent('10');
    unmountPairs();

    // A controlling owner that accepts nothing: once the strip renders again, edits start over.
    onChange.mockClear();
    const { rerender } = render(<Strip value={{ top: 1 }} />);
    act(() => {
      field('top').onChange(5);
      field('right').onChange(6);
    });
    expect(onChange).toHaveBeenLastCalledWith({ top: 5, right: 6 });
    rerender(<Strip value={{ top: 1 }} />);
    act(() => field('bottom').onChange(7));
    expect(onChange).toHaveBeenLastCalledWith({ top: 1, bottom: 7 });
    expect(onChange.mock.calls[0]?.[0]).toEqual({ top: 5 });
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 builds batched edits on each other for logical sides', () => {
    const fields = new Map<string, FourSideField<string>>();
    const onChange = vi.fn();
    render(
      <FourSidePropertyStrip
        label="Inset"
        sides="logical"
        link="all"
        onChange={onChange}
        renderSide={(side, field) => {
          fields.set(side, field);
          return null;
        }}
      />,
    );
    act(() => {
      fields.get('block-start')?.onChange('1px');
      fields.get('inline-end')?.onChange('2px');
    });
    expect(onChange).toHaveBeenLastCalledWith({ 'block-start': '1px', 'inline-end': '2px' });
  });

  it('UIC-FOUR-SIDE-PROPERTY-STRIP-1.6 brackets each linked group below the cells with one toggle', () => {
    const renderSide = (side: string) => <input aria-label={`Inset ${side}`} />;
    const { container, rerender } = render(
      <FourSidePropertyStrip label="Inset" sides="logical" link="pairs" renderSide={renderSide} />,
    );
    const row = container.querySelector('.ui-four-side-property-strip');
    expect(row).toHaveAttribute('data-link', 'pairs');
    const brackets = () =>
      [...container.querySelectorAll('.ui-four-side-property-strip__bracket')].map((bracket) =>
        bracket.getAttribute('data-sides'),
      );
    expect(brackets()).toEqual(['block-start block-end', 'inline-start inline-end']);
    const [first, second] = container.querySelectorAll('.ui-four-side-property-strip__bracket');
    // Each pair has its own toggle, named after its sides.
    expect(first).toContainElement(screen.getByRole('button', { name: 'Link top and bottom' }));
    expect(second).toContainElement(screen.getByRole('button', { name: 'Link start and end' }));
    expect(screen.getAllByRole('button')).toHaveLength(2);
    // The brackets follow the cells, so the cells keep their order for reading and Tab.
    const lastCell = container.querySelector('[data-side="inline-end"]');
    expect(lastCell?.compareDocumentPosition(first as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    rerender(<FourSidePropertyStrip label="Inset" link="all" renderSide={renderSide} />);
    expect(row).toHaveAttribute('data-link', 'all');
    expect(brackets()).toEqual(['top bottom left right']);
    expect(screen.getByRole('button', { name: 'Link all sides' })).toBeInTheDocument();
    rerender(<FourSidePropertyStrip label="Inset" renderSide={renderSide} />);
    expect(row).not.toHaveAttribute('data-link');
    expect(brackets()).toEqual([]);
  });
});
