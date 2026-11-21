import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataSlotNames, prefixDataSlots, useDataSlotHooks } from './data-slot-names.js';
import { createHooks } from './hooks.js';

const hooks = createHooks('sample-family', ['title', 'list', 'note'], {
  root: 'family',
  title: 'family-title',
  list: 'family-content',
});

function Part() {
  const named = useDataSlotHooks(hooks);
  return (
    <div {...named.root()} aria-label="Root">
      <h2 {...named.slot('title')}>Title</h2>
      <ul {...named.slot('list')} aria-label="List" />
      <p {...named.slot('note')}>Note</p>
    </div>
  );
}

const panelNames = prefixDataSlots([hooks], { from: 'family', to: 'panel' });

describe('DataSlotNames', () => {
  it('UIC-HOOKS-1.6 swaps the family prefix of every declared name', () => {
    expect(panelNames).toEqual({
      'ui-sample-family': 'panel',
      'ui-sample-family__title': 'panel-title',
      'ui-sample-family__list': 'panel-content',
    });
    expect(
      prefixDataSlots([hooks], {
        from: 'family',
        to: 'menu',
        parts: { content: 'list', title: null },
      }),
    ).toEqual({
      'ui-sample-family': 'menu',
      'ui-sample-family__title': null,
      'ui-sample-family__list': 'menu-list',
    });
  });

  it('UIC-HOOKS-1.6 names the parts inside a scope and leaves them declared outside one', () => {
    render(
      <>
        <Part />
        <DataSlotNames names={panelNames}>
          <Part />
        </DataSlotNames>
      </>,
    );
    const [outside, inside] = screen.getAllByRole('heading', { name: 'Title' });
    expect(outside).toHaveAttribute('data-slot', 'family-title');
    expect(inside).toHaveAttribute('data-slot', 'panel-title');
    const [, panel] = screen.getAllByLabelText('Root');
    expect(panel).toHaveAttribute('data-slot', 'panel');
    expect(screen.getAllByText('Note')[1]).not.toHaveAttribute('data-slot');
  });

  it('UIC-HOOKS-1.6 lets an inner scope win, and the family names restore the declared ones', () => {
    const familyNames = prefixDataSlots([hooks], { from: 'family', to: 'family' });
    render(
      <DataSlotNames names={panelNames}>
        <DataSlotNames names={familyNames}>
          <Part />
        </DataSlotNames>
        <DataSlotNames names={{ 'ui-sample-family__note': 'panel-note' }}>
          <Part />
        </DataSlotNames>
      </DataSlotNames>,
    );
    const [restored, merged] = screen.getAllByRole('heading', { name: 'Title' });
    expect(restored).toHaveAttribute('data-slot', 'family-title');
    expect(merged).toHaveAttribute('data-slot', 'panel-title');
    expect(screen.getAllByText('Note')[1]).toHaveAttribute('data-slot', 'panel-note');
  });
});
