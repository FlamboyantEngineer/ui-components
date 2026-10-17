import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
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
});
