import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PropertyRow, PropertySection } from '../property-panel/property-panel.js';
import { PropertyFilter } from './property-filter.js';

function Fruit(props: Partial<Parameters<typeof PropertyFilter>[0]>) {
  return (
    <PropertyFilter aria-label="Fruit Settings" placeholder="Filter fruit" {...props}>
      <PropertySection title="Orchard">
        <PropertyRow label="Apple">red</PropertyRow>
        <PropertyRow label="Pear">green</PropertyRow>
      </PropertySection>
    </PropertyFilter>
  );
}

function rowOf(text: string) {
  return screen.getByText(text).closest('.ui-property-row') as HTMLElement;
}

describe('PropertyFilter', () => {
  it('UIC-PROPERTY-FILTER-1.1 is a named panel whose header search box filters its rows', async () => {
    const { container } = render(<Fruit />);
    const panel = screen.getByRole('region', { name: 'Fruit Settings' });
    expect(panel).toHaveClass('ui-property-panel', 'ui-property-filter');
    const header = panel.querySelector('.ui-property-panel__header') as HTMLElement;
    const search = header.querySelector('.ui-property-filter__search') as HTMLElement;
    expect(search).toHaveClass('ui-search-field');
    expect(search).toHaveAttribute('data-empty', 'true');
    const input = within(header).getByRole('searchbox', { name: 'Filter fruit settings' });
    expect(input).toHaveAttribute('placeholder', 'Filter fruit');
    expect(panel.querySelector('.ui-property-panel__body > .ui-property-scope')).not.toBeNull();
    expectHooksMatchSpec(container, 'PROPERTY-FILTER', { slots: 'all' });

    await userEvent.type(input, 'pea');
    expect(search).not.toHaveAttribute('data-empty');
    expect(rowOf('Apple')).toHaveAttribute('hidden');
    expect(screen.getByText('Pea').closest('.ui-property-row')).not.toHaveAttribute('hidden');
  });

  it('UIC-PROPERTY-FILTER-1.1 names the search box through the provider', () => {
    render(
      <UiProvider strings={{ filterLabel: (label) => `Filtrer ${label}` }}>
        <Fruit />
      </UiProvider>,
    );
    expect(screen.getByRole('searchbox', { name: 'Filtrer Fruit Settings' })).toBeInTheDocument();
  });

  it('UIC-PROPERTY-FILTER-1.2 clears the query from its clear button and from Escape, keeping focus in the input', async () => {
    render(<Fruit />);
    const input = screen.getByRole('searchbox');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    await userEvent.type(input, 'apple');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(rowOf('Pear')).not.toHaveAttribute('hidden');
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();

    await userEvent.type(input, 'pear{Escape}');
    expect(input).toHaveValue('');
    expect(rowOf('Apple')).not.toHaveAttribute('hidden');
  });

  it('UIC-PROPERTY-FILTER-1.2 moves focus to the input when the no-match message clears the query', async () => {
    render(<Fruit />);
    const input = screen.getByRole('searchbox');
    await userEvent.type(input, 'plum');
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('No properties match “plum”.');
    await userEvent.click(within(status).getByRole('button', { name: 'Clear filter' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(status).toBeEmptyDOMElement();
  });

  it('UIC-PROPERTY-FILTER-1.3 appends the caller class and forwards id, data attributes and the label layout', () => {
    const { container } = render(
      <Fruit className="caller" id="fruit" data-probe="filter" labelLayout="inline" />,
    );
    const panel = container.firstElementChild as HTMLElement;
    expect(panel).toHaveClass('ui-property-panel', 'ui-property-filter', 'caller');
    expect(panel).toHaveAttribute('id', 'fruit');
    expect(panel).toHaveAttribute('data-probe', 'filter');
    expect(panel).toHaveAttribute('data-label-layout', 'inline');
    expectHooksMatchSpec(container, 'PROPERTY-FILTER', { callerAttributes: ['data-probe'] });
  });
});
