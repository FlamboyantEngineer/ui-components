import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { Input } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Field, useFieldState } from '../field/field.js';
import {
  PropertyCard,
  PropertyGroup,
  PropertyRow,
  PropertySection,
} from '../property-panel/property-panel.js';
import { PropertyScope } from './property-scope.js';

function Draft({ label }: { label: string }) {
  const [value, setValue] = useState('');
  return (
    <input aria-label={label} value={value} onChange={(event) => setValue(event.target.value)} />
  );
}

function NameField() {
  const state = useFieldState<string>({ defaultValue: 'Plum' });
  return (
    <Field state={state} label="Nickname">
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

function Settings({ query }: { query: string }) {
  return (
    <PropertyScope query={query} data-testid="scope">
      <PropertySection title="Page setup" defaultExpanded={false}>
        <PropertyGroup heading="Paper">
          <PropertyRow label="Paper size">
            <Draft label="Paper size value" />
          </PropertyRow>
          <PropertyRow label="Orientation">portrait</PropertyRow>
        </PropertyGroup>
        <PropertyGroup heading="Edges">
          <PropertyRow label="Margins" keywords={['Top', 'Bottom']}>
            10
          </PropertyRow>
        </PropertyGroup>
      </PropertySection>
      <PropertySection title="Text styles">
        <PropertyCard name="Line-height">
          <PropertyRow label="Value">1.5</PropertyRow>
        </PropertyCard>
        <PropertyCard name="Body">
          <PropertyRow label="Font family">Serif</PropertyRow>
        </PropertyCard>
      </PropertySection>
    </PropertyScope>
  );
}

/** The part whose text slot reads `text`, even while marks split it. */
function part(hook: string, slot: string, text: string) {
  const parts = Array.from(document.querySelectorAll<HTMLElement>(`.${hook}`));
  return parts.find(
    (element) => element.querySelector(`.${hook}__${slot}`)?.textContent === text,
  ) as HTMLElement;
}

function row(label: string) {
  return part('ui-property-row', 'label', label);
}

function section(title: string) {
  return part('ui-property-section', 'title', title);
}

describe('PropertyScope', () => {
  it('UIC-PROPERTY-SCOPE-1.1 hides rows whose path, label and keywords miss a term, keeping them mounted', async () => {
    const { rerender } = render(<Settings query="" />);
    await userEvent.click(screen.getByRole('button', { name: 'Page setup 3' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Paper size value' }), 'A4');
    for (const label of ['Paper size', 'Orientation', 'Margins', 'Value', 'Font family']) {
      expect(row(label)).not.toHaveAttribute('hidden');
    }

    rerender(<Settings query="ORIENT" />);
    expect(row('Orientation')).not.toHaveAttribute('hidden');
    expect(row('Paper size')).toHaveAttribute('hidden');
    expect(screen.getByRole('textbox', { name: 'Paper size value', hidden: true })).toHaveValue(
      'A4',
    );

    rerender(<Settings query="page bottom" />);
    expect(row('Margins')).not.toHaveAttribute('hidden');
    expect(row('Orientation')).toHaveAttribute('hidden');

    rerender(<Settings query="paper   " />);
    expect(row('Paper size')).not.toHaveAttribute('hidden');
    expect(row('Orientation')).not.toHaveAttribute('hidden');

    rerender(<Settings query="line height" />);
    expect(row('Value')).not.toHaveAttribute('hidden');

    rerender(<Settings query="   " />);
    expect(row('Font family')).not.toHaveAttribute('hidden');
    expect(screen.getByRole('textbox', { name: 'Paper size value' })).toHaveValue('A4');
  });

  it('UIC-PROPERTY-SCOPE-1.2 hides empty containers, opens matching ones and restores them when the query clears', async () => {
    const { rerender } = render(<Settings query="" />);
    const pageTrigger = within(section('Page setup')).getAllByRole('button')[0] as HTMLElement;
    expect(pageTrigger).toHaveAttribute('aria-expanded', 'false');

    rerender(<Settings query="margins" />);
    expect(section('Page setup')).not.toHaveAttribute('hidden');
    expect(pageTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(part('ui-property-group', 'heading', 'Paper')).toHaveAttribute('hidden');
    expect(part('ui-property-group', 'heading', 'Edges')).not.toHaveAttribute('hidden');
    expect(section('Text styles')).toHaveAttribute('hidden');
    expect(section('Page setup').querySelector('.ui-property-section__count')).toHaveTextContent(
      '3',
    );
    await userEvent.click(pageTrigger);
    expect(pageTrigger).toHaveAttribute('aria-expanded', 'true');

    rerender(<Settings query="body" />);
    const body = part('ui-property-card', 'name', 'Body');
    const lineHeight = part('ui-property-card', 'name', 'Line-height');
    expect(body).not.toHaveAttribute('hidden');
    expect(body).toHaveAttribute('data-expanded', 'true');
    expect(lineHeight).toHaveAttribute('hidden');
    expect(row('Font family')).not.toHaveAttribute('hidden');

    rerender(<Settings query="" />);
    expect(pageTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(body).not.toHaveAttribute('data-expanded');
    expect(section('Text styles')).not.toHaveAttribute('hidden');
  });

  it('UIC-PROPERTY-SCOPE-1.2 returns a controlled section to its caller state', () => {
    const onExpandedChange = vi.fn();
    const panel = (query: string) => (
      <PropertyScope query={query}>
        <PropertySection title="Grid" isExpanded={false} onExpandedChange={onExpandedChange}>
          <PropertyRow label="Spacing">8</PropertyRow>
        </PropertySection>
      </PropertyScope>
    );
    const { rerender } = render(panel('spacing'));
    expect(screen.getByRole('button', { name: /^Grid/ })).toHaveAttribute('aria-expanded', 'true');
    rerender(panel(''));
    expect(screen.getByRole('button', { name: /^Grid/ })).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('UIC-PROPERTY-SCOPE-1.3 marks terms in titles, headings, names and labels without renaming them', () => {
    render(
      <PropertyScope query="pa">
        <PropertySection title="Page setup">
          <PropertyGroup heading="Paper">
            <PropertyRow label="Padding" htmlFor="padding">
              <input id="padding" />
            </PropertyRow>
          </PropertyGroup>
          <PropertyCard name="Palette">
            <PropertyRow label="Accent">x</PropertyRow>
          </PropertyCard>
          <PropertyRow label="Pet name">
            <NameField />
          </PropertyRow>
        </PropertySection>
      </PropertyScope>,
    );
    const marks = Array.from(document.querySelectorAll('mark.ui-text-match'), (mark) => [
      mark.textContent,
      mark.parentElement?.className,
    ]);
    expect(marks).toEqual([
      ['Pa', 'ui-property-section__title'],
      ['Pa', 'ui-property-group__heading'],
      ['Pa', 'ui-property-row__label'],
      ['Pa', 'ui-property-card__name'],
    ]);
    expect(screen.getByRole('textbox', { name: 'Padding' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Paper' })).toBeInTheDocument();

    const field = render(
      <PropertyScope query="nick">
        <PropertyRow label="Settings field" keywords={['Nickname']}>
          <NameField />
        </PropertyRow>
      </PropertyScope>,
    );
    const fieldLabel = field.container.querySelector('.ui-field__label') as HTMLElement;
    expect(fieldLabel.querySelector('mark')).toHaveTextContent('Nick');
    expect(within(field.container).getByRole('textbox', { name: 'Nickname' })).toBeInTheDocument();
  });

  it('UIC-PROPERTY-SCOPE-1.4 reports a query nothing matches and offers to clear it', async () => {
    const onClear = vi.fn();
    const panel = (query: string, clear?: () => void) => (
      <PropertyScope query={query} onClear={clear}>
        <PropertyRow label="Colour">red</PropertyRow>
      </PropertyScope>
    );
    const { container, rerender } = render(panel('', onClear));
    const status = screen.getByRole('status');
    expect(status).toHaveClass('ui-property-scope__status');
    expect(status).toBeEmptyDOMElement();

    rerender(panel(' colr ', onClear));
    expect(status).toHaveTextContent('No properties match “colr”.');
    expect(status.querySelector('.ui-empty-state')).toHaveAttribute('data-size', 'sm');
    await userEvent.click(within(status).getByRole('button', { name: 'Clear filter' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'PROPERTY-SCOPE', { slots: 'all' });

    rerender(panel('colr'));
    expect(within(status).queryByRole('button')).toBeNull();

    rerender(panel('col'));
    expect(status).toBeEmptyDOMElement();
  });

  it('UIC-PROPERTY-SCOPE-1.5 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <PropertyScope query="" className="caller" id="scope-1" data-probe="scope">
        <PropertyRow label="Colour">red</PropertyRow>
      </PropertyScope>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('ui-property-scope', 'caller');
    expect(root).toHaveAttribute('id', 'scope-1');
    expect(root).toHaveAttribute('data-probe', 'scope');
    expectHooksMatchSpec(container, 'PROPERTY-SCOPE', { callerAttributes: ['data-probe'] });
  });
});
