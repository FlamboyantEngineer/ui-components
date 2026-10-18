import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { Input, type Key } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Field, Fieldset, useFieldState } from '../field/field.js';
import { PropertyScope } from '../property-scope/property-scope.js';
import {
  PropertyCard,
  PropertyGroup,
  PropertyIconGroup,
  PropertyPanel,
  PropertyRow,
  PropertySection,
  PropertyStrip,
  PropertyStripCell,
} from './property-panel.js';

describe('PropertyPanel', () => {
  it('UIC-PROPERTY-PANEL-1.1 is a named section with an optional header and a body', () => {
    const { container, rerender } = render(
      <PropertyPanel aria-label="Shape" header={<h2>Rectangle</h2>}>
        <p>Body</p>
      </PropertyPanel>,
    );
    const panel = screen.getByRole('region', { name: 'Shape' });
    expect(panel.tagName).toBe('SECTION');
    expect(panel).toHaveClass('ui-property-panel');
    expect(panel.children[0]).toHaveClass('ui-property-panel__header');
    expect(panel.children[0]).toContainElement(screen.getByRole('heading', { name: 'Rectangle' }));
    expect(panel.children[1]).toHaveClass('ui-property-panel__body');
    expect(panel.children[1]).toHaveTextContent('Body');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: ['ui-property-panel__header', 'ui-property-panel__body'],
    });

    rerender(
      <PropertyPanel aria-label="Shape" header={null}>
        <p>Body</p>
      </PropertyPanel>,
    );
    expect(container.querySelector('.ui-property-panel__header')).toBeNull();
  });

  it('UIC-PROPERTY-PANEL-1.2 publishes the label layout', () => {
    const { container, rerender } = render(<PropertyPanel aria-label="Shape">x</PropertyPanel>);
    const panel = container.firstElementChild;
    expect(panel).toHaveAttribute('data-label-layout', 'responsive');
    rerender(
      <PropertyPanel aria-label="Shape" labelLayout="inline">
        x
      </PropertyPanel>,
    );
    expect(panel).toHaveAttribute('data-label-layout', 'inline');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL');
  });

  it('UIC-PROPERTY-PANEL-1.3 appends caller classes and forwards ids and data attributes on every member', () => {
    const { container } = render(
      <PropertyPanel
        aria-label="Shape"
        className="c-panel"
        id="panel"
        data-probe="panel"
        data-label-layout="x"
      >
        <PropertySection title="Fill" className="c-section" data-probe="section">
          <PropertyGroup heading="Paint" className="c-group" id="group" data-probe="group">
            <PropertyRow label="Colour" className="c-row" id="row" data-probe="row">
              <PropertyStrip className="c-strip" id="strip" data-probe="strip">
                <PropertyStripCell
                  letter="R"
                  label="Red"
                  className="c-cell"
                  id="cell"
                  data-probe="cell"
                >
                  <input aria-label="Red" />
                </PropertyStripCell>
              </PropertyStrip>
            </PropertyRow>
            <PropertyCard name="Pattern" className="c-card" data-probe="card">
              <PropertyRow label="Scale">1</PropertyRow>
            </PropertyCard>
          </PropertyGroup>
          <PropertyIconGroup aria-label="Tools" className="c-icons" id="icons" data-probe="icons">
            <button type="button">A</button>
          </PropertyIconGroup>
        </PropertySection>
      </PropertyPanel>,
    );
    const members = [
      ['panel', 'ui-property-panel', 'panel'],
      ['section', 'ui-property-section', undefined],
      ['group', 'ui-property-group', 'group'],
      ['row', 'ui-property-row', 'row'],
      ['strip', 'ui-property-strip', 'strip'],
      ['cell', 'ui-property-strip-cell', 'cell'],
      ['card', 'ui-property-card', undefined],
      ['icons', 'ui-property-icon-group', 'icons'],
    ] as const;
    for (const [probe, hook, id] of members) {
      const element = container.querySelector(`[data-probe="${probe}"]`) as HTMLElement;
      expect(element).toHaveClass(hook, `c-${probe}`);
      if (id) expect(element).toHaveAttribute('id', id);
    }
    expect(container.firstElementChild).toHaveAttribute('data-label-layout', 'responsive');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { callerAttributes: ['data-probe'] });
  });

  it('UIC-PROPERTY-PANEL-3.4 names a group by its heading, or renders a plain run of rows', () => {
    const { container, rerender } = render(
      <PropertyGroup heading="Paper">
        <PropertyRow label="Size">A4</PropertyRow>
      </PropertyGroup>,
    );
    const group = screen.getByRole('group', { name: 'Paper' });
    expect(group).toHaveClass('ui-property-group');
    expect(group.firstElementChild).toHaveClass('ui-property-group__heading');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { slots: ['ui-property-group__heading'] });

    rerender(
      <PropertyGroup>
        <PropertyRow label="Size">A4</PropertyRow>
      </PropertyGroup>,
    );
    const plain = container.firstElementChild as HTMLElement;
    expect(plain).not.toHaveAttribute('role');
    expect(plain).not.toHaveAttribute('aria-labelledby');
    expect(container.querySelector('.ui-property-group__heading')).toBeNull();
  });

  it('UIC-PROPERTY-PANEL-3.6 is a named group of icon buttons with a framing variant', () => {
    const { container, rerender } = render(
      <PropertyIconGroup aria-label="Alignment">
        <button type="button">Left</button>
        <button type="button">Right</button>
      </PropertyIconGroup>,
    );
    const group = screen.getByRole('group', { name: 'Alignment' });
    expect(group).toHaveClass('ui-property-icon-group');
    expect(group).toHaveAttribute('data-variant', 'separate');
    rerender(
      <PropertyIconGroup aria-label="Alignment" variant="segmented">
        <button type="button">Left</button>
      </PropertyIconGroup>,
    );
    expect(group).toHaveAttribute('data-variant', 'segmented');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL');
  });

  it('UIC-PROPERTY-PANEL-1.4 opens one section at a time as an accordion', async () => {
    const onExpandedChange = vi.fn<(keys: Set<Key>) => void>();
    render(
      <PropertyPanel
        aria-label="Shape"
        allowsMultipleExpanded={false}
        defaultExpandedKeys={['fill']}
        onExpandedChange={onExpandedChange}
      >
        <PropertySection id="fill" title="Fill" persistKey="ignored.fill">
          <PropertyRow label="Colour">red</PropertyRow>
        </PropertySection>
        <PropertySection id="stroke" title="Stroke">
          <PropertyCard name="Dash">
            <PropertyRow label="Gap">2</PropertyRow>
          </PropertyCard>
        </PropertySection>
      </PropertyPanel>,
    );
    const panel = screen.getByRole('region', { name: 'Shape' });
    expect(panel.querySelector('.ui-property-panel__body')).toHaveClass('ui-property-panel__body');
    const fill = screen.getByRole('button', { name: /Fill/ });
    const stroke = screen.getByRole('button', { name: /Stroke/ });
    expect(fill).toHaveAttribute('aria-expanded', 'true');
    expect(stroke).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(stroke);
    expect(stroke).toHaveAttribute('aria-expanded', 'true');
    expect(fill).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['stroke']));
    // Cards keep their own state inside the panel's group.
    const dash = screen.getByRole('button', { name: /Dash/ });
    await userEvent.click(dash);
    expect(dash).toHaveAttribute('aria-expanded', 'true');
    expect(stroke).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-PROPERTY-PANEL-1.4 expands and collapses every section from controlled keys, a query still opening matches', async () => {
    function Controlled() {
      const [keys, setKeys] = useState<Set<Key>>(new Set());
      const [query, setQuery] = useState('');
      return (
        <>
          <button type="button" onClick={() => setKeys(new Set(['fill', 'stroke']))}>
            Expand all
          </button>
          <button type="button" onClick={() => setKeys(new Set())}>
            Collapse all
          </button>
          <button type="button" onClick={() => setQuery(query ? '' : 'width')}>
            Search
          </button>
          <PropertyPanel aria-label="Shape" expandedKeys={keys} onExpandedChange={setKeys}>
            <PropertyScope query={query}>
              <PropertySection id="fill" title="Fill">
                <PropertyRow label="Colour">red</PropertyRow>
              </PropertySection>
              <PropertySection id="stroke" title="Stroke">
                <PropertyRow label="Width">1</PropertyRow>
              </PropertySection>
            </PropertyScope>
          </PropertyPanel>
        </>
      );
    }
    render(<Controlled />);
    const triggers = () => screen.queryAllByRole('button', { expanded: true });
    expect(triggers()).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(triggers()).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Fill/ }));
    expect(screen.getByRole('button', { name: /Fill/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Stroke/ })).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(triggers()).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('button', { name: /Stroke/ })).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('button', { name: /Stroke/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('UIC-PROPERTY-PANEL-1.5 disables or locks every field inside and keeps sections browsable', async () => {
    function Name() {
      const state = useFieldState<string>({ defaultValue: 'Plum' });
      return (
        <Field state={state} label="Name">
          {(control) => (
            <Input
              {...control}
              value={state.value}
              onChange={(event) => state.setValue(event.target.value)}
            />
          )}
        </Field>
      );
    }
    const content = (
      <PropertySection title="General">
        <PropertyRow label="Name row">
          <Name />
        </PropertyRow>
      </PropertySection>
    );
    const { container, rerender } = render(
      <PropertyPanel aria-label="Shape" isDisabled>
        {content}
      </PropertyPanel>,
    );
    const panel = screen.getByRole('region', { name: 'Shape' });
    expect(panel).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
    expectHooksMatchSpec(container, 'PROPERTY-PANEL');
    const trigger = screen.getByRole('button', { name: /General/ });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);

    rerender(
      <PropertyPanel aria-label="Shape" isReadOnly>
        {content}
      </PropertyPanel>,
    );
    expect(panel).toHaveAttribute('data-readonly', 'true');
    expect(panel).not.toHaveAttribute('data-disabled');
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAttribute('readonly');
    await userEvent.type(input, 'x');
    expect(input).toHaveValue('Plum');

    rerender(
      <Fieldset legend="Locked" isDisabled>
        <PropertyPanel aria-label="Shape">{content}</PropertyPanel>
      </Fieldset>,
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled();
  });
});
