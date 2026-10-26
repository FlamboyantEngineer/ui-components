import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { PropertyRow } from './property-row.js';

function slots(...names: string[]) {
  return names.map((name) => `ui-property-row__${name}`);
}

describe('PropertyRow', () => {
  it('UIC-PROPERTY-PANEL-3.1 lays out the label, the control with unit and hint, the description and actions', () => {
    const { container } = render(
      <PropertyRow
        label="Width"
        unit="px"
        hint="Up to 2000"
        description="The width of the frame."
        actions={<button type="button">Reset</button>}
      >
        <input aria-label="Width value" />
      </PropertyRow>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-property-row');
    expect(Array.from(root.children, (child) => child.className)).toEqual([
      'ui-property-row__label',
      'ui-property-row__control',
      'ui-property-row__description',
      'ui-property-row__actions',
    ]);
    const control = container.querySelector('.ui-property-row__control') as HTMLElement;
    expect(Array.from(control.children, (child) => child.className || child.tagName)).toEqual([
      'INPUT',
      'ui-property-row__unit',
      'ui-property-row__hint',
    ]);
    expect(control).toHaveTextContent('pxUp to 2000');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: slots('label', 'control', 'unit', 'hint', 'description', 'actions'),
    });
  });

  it('UIC-PROPERTY-PANEL-3.1 draws only the slots it is given and keeps a node label as given', () => {
    const { container } = render(
      <PropertyRow label={<strong>Bold label</strong>}>
        <span>Value</span>
      </PropertyRow>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.children).toHaveLength(2);
    expect(screen.getByText('Bold label').tagName).toBe('STRONG');
    expect(container.querySelector('.ui-property-row__unit, .ui-property-row__hint')).toBeNull();
  });

  it('UIC-PROPERTY-PANEL-3.2 binds a label to its control with htmlFor', async () => {
    render(
      <PropertyRow label="Title" htmlFor="title-input" id="title-row">
        <input id="title-input" />
      </PropertyRow>,
    );
    const label = document.getElementById('title-row-label') as HTMLElement;
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'title-input');
    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(document.querySelector('.ui-property-row__control')).not.toHaveAttribute('role');
    await userEvent.click(label);
    expect(input).toHaveFocus();
  });

  it('UIC-PROPERTY-PANEL-3.2 names the control slot as a group without htmlFor', () => {
    const { container } = render(
      <PropertyRow label="Corners">
        <input aria-label="Radius" />
      </PropertyRow>,
    );
    const label = container.querySelector('.ui-property-row__label') as HTMLElement;
    expect(label.tagName).toBe('DIV');
    expect(label.id).toMatch(/-label$/);
    expect(screen.getByRole('group', { name: 'Corners' })).toHaveClass('ui-property-row__control');
  });

  it('UIC-PROPERTY-PANEL-3.3 marks required, wide and overridden rows', () => {
    const { container, rerender } = render(
      <PropertyRow label="Name" isRequired wide isOverridden>
        <textarea aria-label="Name value" />
      </PropertyRow>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-required', 'true');
    expect(root).toHaveAttribute('data-wide', 'true');
    expect(root).toHaveAttribute('data-overridden', 'true');
    const asterisk = container.querySelector('.ui-property-row__required');
    expect(asterisk).toHaveTextContent('*');
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
    expect(asterisk?.parentElement).toHaveClass('ui-property-row__label');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { slots: slots('required') });

    rerender(
      <PropertyRow label="Name">
        <textarea aria-label="Name value" />
      </PropertyRow>,
    );
    for (const attribute of ['data-required', 'data-wide', 'data-overridden']) {
      expect(root).not.toHaveAttribute(attribute);
    }
    expect(container.querySelector('.ui-property-row__required')).toBeNull();
  });
});
