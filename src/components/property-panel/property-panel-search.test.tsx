import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PropertyPanel, PropertyRow, PropertySection } from './property-panel.js';

function Fruit(props: Partial<Parameters<typeof PropertyPanel>[0]>) {
  return (
    <PropertyPanel
      searchable
      aria-label="Fruit Settings"
      searchPlaceholder="Filter fruit"
      {...props}
    >
      <PropertySection title="Orchard">
        <PropertyRow label="Apple">red</PropertyRow>
        <PropertyRow label="Pear">green</PropertyRow>
      </PropertySection>
    </PropertyPanel>
  );
}

function rowOf(text: string) {
  return screen.getByText(text).closest('.ui-property-row') as HTMLElement;
}

/** The row whose label reads `label`, whatever marks split its text. */
function rowByLabel(label: string) {
  return [...document.querySelectorAll('.ui-property-row')].find(
    (row) => row.querySelector('.ui-property-row__label')?.textContent === label,
  );
}

describe('PropertyPanel', () => {
  it('UIC-PROPERTY-PANEL-5.1 is a named panel whose header search box filters its rows', async () => {
    const user = userEvent.setup();
    const { container } = render(<Fruit />);
    const panel = screen.getByRole('region', { name: 'Fruit Settings' });
    expect(panel).toHaveClass('ui-property-panel');
    const header = panel.querySelector('.ui-property-panel__header') as HTMLElement;
    const search = header.querySelector('.ui-property-panel__search') as HTMLElement;
    expect(search).toHaveClass('ui-search-field');
    expect(search).toHaveAttribute('data-empty', 'true');
    const input = within(header).getByRole('searchbox', { name: 'Filter fruit settings' });
    expect(input).toHaveAttribute('placeholder', 'Filter fruit');
    expect(panel.querySelector('.ui-property-panel__body > .ui-property-scope')).not.toBeNull();
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', {
      slots: ['ui-property-panel__header', 'ui-property-panel__body', 'ui-property-panel__search'],
    });

    await user.type(input, 'pea');
    expect(search).not.toHaveAttribute('data-empty');
    expect(rowOf('Apple')).toHaveAttribute('hidden');
    expect(screen.getByText('Pea').closest('.ui-property-row')).not.toHaveAttribute('hidden');
  });

  it('UIC-PROPERTY-PANEL-5.1 names the search box through the provider', () => {
    render(
      <UiProvider messages={{ filterLabel: 'Filtrer {label}' }}>
        <Fruit />
      </UiProvider>,
    );
    expect(screen.getByRole('searchbox', { name: 'Filtrer fruit settings' })).toBeInTheDocument();
  });

  it('UIC-PROPERTY-PANEL-5.2 clears the query from its clear button and from Escape, keeping focus in the input', async () => {
    const user = userEvent.setup();
    render(<Fruit />);
    const input = screen.getByRole('searchbox');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await user.type(input, 'apple');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(rowOf('Pear')).not.toHaveAttribute('hidden');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    await user.type(input, 'pear{Escape}');
    expect(input).toHaveValue('');
    expect(rowOf('Apple')).not.toHaveAttribute('hidden');
  });

  it('UIC-PROPERTY-PANEL-5.2 moves focus to the input when the no-match message clears the query', async () => {
    const user = userEvent.setup();
    render(<Fruit />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'plum');
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('No properties match “plum”.');
    await user.click(within(status).getByRole('button', { name: 'Clear filter' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(status).toBeEmptyDOMElement();
  });

  it('UIC-PROPERTY-PANEL-5.3 appends the caller class and forwards id, data attributes and the label layout', () => {
    const { container } = render(
      <Fruit className="caller" id="fruit" data-probe="filter" labelLayout="inline" />,
    );
    const panel = container.firstElementChild as HTMLElement;
    expect(panel).toHaveClass('ui-property-panel', 'caller');
    expect(panel).toHaveAttribute('id', 'fruit');
    expect(panel).toHaveAttribute('data-probe', 'filter');
    expect(panel).toHaveAttribute('data-label-layout', 'inline');
    expectHooksMatchSpec(container, 'PROPERTY-PANEL', { callerAttributes: ['data-probe'] });
  });

  it('UIC-PROPERTY-PANEL-5.4 follows a controlled query and reports every change', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    function Controlled() {
      const [query, setQuery] = useState('pear');
      return (
        <Fruit
          query={query}
          onQueryChange={(next) => {
            onQueryChange(next);
            setQuery(next);
          }}
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByRole('searchbox', { name: 'Filter fruit settings' });
    expect(input).toHaveValue('pear');
    expect(rowOf('Apple')).toHaveAttribute('hidden');
    await user.clear(input);
    expect(onQueryChange).toHaveBeenLastCalledWith('');
    expect(rowOf('Apple')).not.toHaveAttribute('hidden');
    await user.type(input, 'a');
    expect(onQueryChange).toHaveBeenLastCalledWith('a');
  });

  it('UIC-PROPERTY-PANEL-5.4 starts from a default query and matches through the filter', () => {
    render(<Fruit defaultQuery="APP" filter={(text, query) => text.startsWith(query)} />);
    expect(screen.getByRole('searchbox')).toHaveValue('APP');
    expect(rowByLabel('Apple')).toHaveAttribute('hidden');
    expect(rowByLabel('Pear')).toHaveAttribute('hidden');
  });
});

it('UIC-PROPERTY-PANEL-5.1 keeps supplied header content beside its optional built-in search', () => {
  const { rerender } = render(<Fruit header={<h2>Fruit tools</h2>} />);
  expect(screen.getByRole('heading', { name: 'Fruit tools' })).toBeVisible();
  expect(screen.getByRole('searchbox', { name: 'Filter fruit settings' })).toBeVisible();
  rerender(<Fruit searchable={false} header={<h2>Fruit tools</h2>} />);
  expect(screen.getByRole('heading', { name: 'Fruit tools' })).toBeVisible();
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
});

it('UIC-PROPERTY-PANEL-5.1 gives search a provider label when the panel uses aria-labelledby', () => {
  render(
    <>
      <h2 id="fruit-tools">Fruit tools</h2>
      <PropertyPanel searchable aria-labelledby="fruit-tools" />
    </>,
  );
  expect(screen.getByRole('region', { name: 'Fruit tools' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
});

it('UIC-PROPERTY-PANEL-5.4 supports a host-owned query without drawing a built-in search', () => {
  render(<Fruit searchable={false} query="pear" />);
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(rowOf('Apple')).toHaveAttribute('hidden');
});
