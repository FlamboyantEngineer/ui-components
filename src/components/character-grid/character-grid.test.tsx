import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { createMemoryStorage, type UiStorage } from '../../core/storage.js';
import { UiProvider } from '../../core/provider.js';
import { CharacterGrid, type CharacterGridCategory } from './character-grid.js';

const categories: CharacterGridCategory[] = [
  {
    id: 'arrows',
    label: 'Arrows',
    characters: [
      { char: '←', name: 'Leftwards arrow' },
      { char: '→', name: 'Rightwards arrow' },
    ],
  },
  {
    id: 'currency',
    label: 'Currency',
    characters: [
      { char: '€', name: 'Euro sign' },
      { char: '£', name: 'Pound sign' },
      { char: '¥', name: 'Yen sign' },
    ],
  },
];

function renderGrid(
  options: { storage?: UiStorage; persistKey?: string; onSelect?: () => void } = {},
) {
  const onSelect = options.onSelect ?? vi.fn();
  const view = render(
    <UiProvider storage={options.storage}>
      <CharacterGrid categories={categories} onSelect={onSelect} persistKey={options.persistKey} />
    </UiProvider>,
  );
  return { ...view, onSelect };
}

function cell(name: string) {
  return screen.getAllByRole('row', { name })[0] as HTMLElement;
}

function headings(container: HTMLElement) {
  return [...container.querySelectorAll('.ui-character-grid__heading')].map(
    (node) => node.textContent,
  );
}

describe('CharacterGrid', () => {
  it('UIC-CHARACTER-GRID-1.1 keeps category identities distinct when their IDs differ only by whitespace', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const first = { char: '€', name: 'First euro' };
    const second = { char: '€', name: 'Second euro' };
    render(
      <CharacterGrid
        categories={[
          { id: 'a b', label: 'First category', characters: [first] },
          { id: 'ab', label: 'Second category', characters: [second] },
        ]}
        onSelect={onSelect}
      />,
    );
    const left = screen.getByRole('row', { name: 'First euro' });
    const right = screen.getByRole('row', { name: 'Second euro' });
    expect(left.id).not.toBe(right.id);
    await user.click(left);
    expect(onSelect).toHaveBeenLastCalledWith(first);
    await user.click(right);
    expect(onSelect).toHaveBeenLastCalledWith(second);
  });

  it('UIC-CHARACTER-GRID-1.1 UIC-CHARACTER-GRID-2.4 renders a search and one grid with a section per category', () => {
    const { container } = render(
      <CharacterGrid
        categories={categories}
        onSelect={() => {}}
        className="host"
        data-testid="symbols"
        id="symbols"
      />,
    );
    const root = screen.getByRole('group', { name: 'Special characters' });
    expect(root).toHaveClass('ui-character-grid', 'host');
    expect(root).toHaveAttribute('data-testid', 'symbols');
    expect(root).toHaveAttribute('id', 'symbols');
    expect(screen.getByRole('searchbox', { name: 'Search characters' })).toBeInTheDocument();
    const grid = screen.getByRole('grid', { name: 'Special characters' });
    expect(grid).toHaveAttribute('data-layout', 'grid');
    expect(within(grid).getAllByRole('rowgroup')).toHaveLength(2);
    expect(headings(container)).toEqual(['Arrows', 'Currency']);
    expect(cell('Euro sign')).toHaveTextContent('€');
    expect(cell('Euro sign')).toHaveClass('ui-character-grid__cell');
    expectHooksMatchSpec(container, 'CHARACTER-GRID', {
      slots: ['search', 'grid', 'section', 'heading', 'cell', 'preview'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CHARACTER-GRID-1.1 takes a name of its own', () => {
    render(<CharacterGrid categories={categories} onSelect={() => {}} aria-label="Symbols" />);
    expect(screen.getByRole('group', { name: 'Symbols' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Symbols' })).toBeInTheDocument();
  });

  it('UIC-CHARACTER-GRID-1.1 names the grid like the root when a heading labels it', () => {
    render(
      <>
        <h2 id="symbols-heading">Insert symbol</h2>
        <CharacterGrid
          categories={categories}
          onSelect={() => {}}
          aria-labelledby="symbols-heading"
        />
      </>,
    );
    expect(screen.getByRole('group', { name: 'Insert symbol' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAccessibleName('Insert symbol');
  });

  it('UIC-CHARACTER-GRID-1.2 chooses a character by click or Enter', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderGrid();
    await user.click(cell('Pound sign'));
    expect(onSelect).toHaveBeenLastCalledWith({ char: '£', name: 'Pound sign' });
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith({ char: '¥', name: 'Yen sign' });
  });

  it('UIC-CHARACTER-GRID-1.3 is one tab stop moved with the arrows, Home and End, keeping its keys', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={(event) => outer(event.key)}>
        <CharacterGrid categories={categories} onSelect={() => {}} />
      </div>,
    );
    await user.tab();
    await user.tab();
    expect(cell('Leftwards arrow')).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(cell('Euro sign')).toHaveFocus();
    await user.keyboard('{End}');
    expect(cell('Yen sign')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(cell('Yen sign')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(cell('Leftwards arrow')).toHaveFocus();
    await user.keyboard('p');
    expect(cell('Pound sign')).toHaveFocus();
    expect(outer.mock.calls.flat().filter((key) => key !== 'Tab')).toEqual([]);
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('UIC-CHARACTER-GRID-1.4 previews the hovered or focused character with its code point', async () => {
    const user = userEvent.setup();
    const { container } = render(<CharacterGrid categories={categories} onSelect={() => {}} />);
    const preview = container.querySelector('.ui-character-grid__preview');
    expect(preview).toBeEmptyDOMElement();
    expect(preview).toHaveAttribute('aria-hidden', 'true');
    await user.hover(cell('Euro sign'));
    expect(preview?.querySelector('.ui-character-grid__preview-char')).toHaveTextContent('€');
    expect(preview?.querySelector('.ui-character-grid__preview-name')).toHaveTextContent(
      'Euro sign',
    );
    expect(preview?.querySelector('.ui-character-grid__preview-code')).toHaveTextContent('U+20AC');
    await user.tab();
    await user.tab();
    expect(preview?.querySelector('.ui-character-grid__preview-name')).toHaveTextContent(
      'Leftwards arrow',
    );
    expectHooksMatchSpec(container, 'CHARACTER-GRID', {
      slots: ['preview-char', 'preview-name', 'preview-code'],
    });
  });

  it('UIC-CHARACTER-GRID-1.4 redraws only the preview, not the cells, on hover', async () => {
    const user = userEvent.setup();
    let nameReads = 0;
    const characters = Array.from({ length: 60 }, (_, index) => {
      const name = `Mark ${index}`;
      return {
        char: String.fromCodePoint(0x2600 + index),
        get name() {
          nameReads += 1;
          return name;
        },
      };
    });
    render(
      <CharacterGrid
        categories={[{ id: 'marks', label: 'Marks', characters }]}
        onSelect={() => {}}
      />,
    );
    const grid = screen.getByRole('grid');
    const first = within(grid).getByRole('row', { name: 'Mark 1' });
    const second = within(grid).getByRole('row', { name: 'Mark 2' });
    nameReads = 0;
    await user.hover(first);
    await user.hover(second);
    expect(screen.getByText('Mark 2')).toHaveClass('ui-character-grid__preview-name');
    expect(nameReads).toBeLessThan(characters.length);
  });

  it('UIC-CHARACTER-GRID-2.1 narrows the sections, chooses the first match and moves down to it', async () => {
    const user = userEvent.setup();
    const { container, onSelect } = renderGrid();
    const search = screen.getByRole('searchbox', { name: 'Search characters' });
    await user.type(search, 'sign');
    expect(container.querySelector('.ui-character-grid')).toHaveAttribute('data-searching', 'true');
    expect(headings(container)).toEqual(['Currency']);
    await user.clear(search);
    await user.type(search, 'u+2192');
    expect(screen.getAllByRole('row', { name: /arrow/ })).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith({ char: '→', name: 'Rightwards arrow' });
    await user.keyboard('{ArrowDown}');
    expect(cell('Rightwards arrow')).toHaveFocus();
  });

  it('UIC-CHARACTER-GRID-2.1 leaves a composing Down to the input method', async () => {
    const user = userEvent.setup();
    renderGrid();
    const search = screen.getByRole('searchbox', { name: 'Search characters' });
    await user.type(search, 'arrow');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(search, { key: 'ArrowDown', isComposing: true, keyCode: 229 });
    expect(search).toHaveFocus();
    expect(search).toHaveValue('arrow');
    await user.keyboard('{ArrowDown}');
    expect(cell('Leftwards arrow')).toHaveFocus();
  });

  it('UIC-CHARACTER-GRID-2.1 leaves a composing Enter to the input method', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderGrid();
    const search = screen.getByRole('searchbox', { name: 'Search characters' });
    for (const query of ['', 'arrow']) {
      await user.clear(search);
      if (query) await user.type(search, query);
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
      fireEvent.keyDown(search, { key: 'Enter', isComposing: true });
      // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set keyCode on a keydown
      fireEvent.keyDown(search, { key: 'Enter', keyCode: 229 });
    }
    expect(onSelect).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith({ char: '←', name: 'Leftwards arrow' });
  });

  it('UIC-CHARACTER-GRID-2.1 lets Escape in the empty search reach the surface around it', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={(event) => (event.key === 'Escape' ? outer() : undefined)}>
        <CharacterGrid categories={categories} onSelect={() => {}} autoFocus />
      </div>,
    );
    await user.keyboard('x{Escape}');
    expect(outer).not.toHaveBeenCalled();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    await user.keyboard('{Escape}');
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it('UIC-CHARACTER-GRID-2.1 shows a status message when nothing matches', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid();
    await user.type(screen.getByRole('searchbox'), 'snowman');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No results');
    expect(screen.getByRole('status')).toHaveClass('ui-character-grid__message');
    expectHooksMatchSpec(container, 'CHARACTER-GRID', { slots: ['message'] });
  });

  it('UIC-CHARACTER-GRID-2.2 leads with the characters chosen last, kept in storage', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const { container, unmount } = renderGrid({ storage, persistKey: 'symbols' });
    await user.click(cell('Euro sign'));
    await user.click(cell('Rightwards arrow'));
    await user.click(cell('Euro sign'));
    expect(headings(container)).toEqual(['Recently used', 'Arrows', 'Currency']);
    const recent = container.querySelector('.ui-character-grid__section') as HTMLElement;
    expect(
      within(recent)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['Recently used', '€', '→']);
    expect(storage.getItem('symbols')).toBe('["€","→"]');
    unmount();
    const { container: againContainer } = renderGrid({ storage, persistKey: 'symbols' });
    expect(headings(againContainer)).toEqual(['Recently used', 'Arrows', 'Currency']);
    await user.type(screen.getByRole('searchbox'), 'euro');
    expect(headings(againContainer)).toEqual(['Currency']);
  });

  it('UIC-CHARACTER-GRID-2.2 keeps at most 16, drops characters no longer offered and survives bad values', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 20 }, (_, index) => String.fromCodePoint(0x2460 + index));
    const storage = createMemoryStorage({
      full: JSON.stringify(many),
      broken: '{oops',
      mixed: '["€",1]',
      gone: '["☃","€"]',
    });
    const wide: CharacterGridCategory[] = [
      ...categories,
      {
        id: 'circled',
        label: 'Circled',
        characters: many.map((char, index) => ({ char, name: `Circled ${index + 1}` })),
      },
    ];
    const { container, rerender } = render(
      <UiProvider storage={storage}>
        <CharacterGrid categories={wide} onSelect={() => {}} persistKey="full" />
      </UiProvider>,
    );
    await user.click(cell('Euro sign'));
    expect(JSON.parse(storage.getItem('full') ?? '[]')).toHaveLength(16);
    rerender(
      <UiProvider storage={storage}>
        <CharacterGrid categories={wide} onSelect={() => {}} persistKey="broken" />
      </UiProvider>,
    );
    expect(headings(container)).toEqual(['Arrows', 'Currency', 'Circled']);
    rerender(
      <UiProvider storage={storage}>
        <CharacterGrid categories={wide} onSelect={() => {}} persistKey="mixed" />
      </UiProvider>,
    );
    expect(headings(container)).toEqual(['Arrows', 'Currency', 'Circled']);
    rerender(
      <UiProvider storage={storage}>
        <CharacterGrid categories={wide} onSelect={() => {}} persistKey="gone" />
      </UiProvider>,
    );
    const recent = container.querySelector('.ui-character-grid__section') as HTMLElement;
    expect(
      within(recent)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['Recently used', '€']);
  });

  it('UIC-CHARACTER-GRID-2.2 reads any stored list as known characters, once each, at most 16', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 40 }, (_, index) => String.fromCodePoint(0x2460 + index));
    const wide: CharacterGridCategory[] = [
      ...categories,
      {
        id: 'circled',
        label: 'Circled',
        characters: many.map((char, index) => ({ char, name: `Circled ${index + 1}` })),
      },
    ];
    // A store that loses every write, as a full browser store does, still renders what it holds.
    const values: Record<string, string> = {
      repeated: '["€","€","£"]',
      unknownFirst: '["☃","☃","¥","☃","€"]',
      oversized: JSON.stringify(many),
    };
    const storage: UiStorage = {
      getItem: (key) => values[key] ?? null,
      setItem: () => {},
      removeItem: () => {},
    };
    const recentCells = (container: HTMLElement) => {
      const recent = container.querySelector('.ui-character-grid__section') as HTMLElement;
      return within(recent)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent);
    };
    const grid = (persistKey: string, offered = wide) => (
      <UiProvider storage={storage}>
        <CharacterGrid categories={offered} onSelect={() => {}} persistKey={persistKey} />
      </UiProvider>
    );
    const { container, rerender } = render(grid('repeated'));
    expect(recentCells(container)).toEqual(['€', '£']);
    rerender(grid('unknownFirst'));
    expect(recentCells(container)).toEqual(['¥', '€']);
    rerender(grid('oversized'));
    expect(recentCells(container)).toEqual(many.slice(0, 16));
    // Categories that no longer offer the first stored ones let later ones in, still at most 16.
    rerender(
      grid('oversized', [
        { ...requireCircled(wide), characters: requireCircled(wide).characters.slice(4) },
      ]),
    );
    expect(recentCells(container)).toEqual(many.slice(4, 20));
    rerender(grid('repeated'));
    // The lost write does not stop the choice leading the list while the grid is mounted.
    await user.click(cell('Yen sign'));
    expect(recentCells(container)).toEqual(['¥', '€', '£']);
  });

  it('UIC-CHARACTER-GRID-2.2 remembers choices for the grid lifetime without a key', async () => {
    const user = userEvent.setup();
    const { container } = renderGrid();
    expect(headings(container)).toEqual(['Arrows', 'Currency']);
    await user.click(cell('Yen sign'));
    expect(headings(container)).toEqual(['Recently used', 'Arrows', 'Currency']);
  });

  it('UIC-CHARACTER-GRID-2.3 focuses the search field with autoFocus', () => {
    render(<CharacterGrid categories={categories} onSelect={() => {}} autoFocus />);
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('UIC-CHARACTER-GRID-2.5 renders every cell under its heading and keeps the preview across renders', async () => {
    const user = userEvent.setup();
    const large: CharacterGridCategory[] = [
      {
        id: 'letters',
        label: 'Letters',
        characters: Array.from({ length: 300 }, (_, index) => ({
          char: String.fromCodePoint(0x4e00 + index),
          name: `Ideograph ${index}`,
        })),
      },
    ];
    const { container, rerender } = render(
      <CharacterGrid categories={large} onSelect={() => {}} />,
    );
    expect(container.querySelectorAll('.ui-character-grid__cell')).toHaveLength(300);
    expect(headings(container)).toEqual(['Letters']);
    await user.hover(cell('Ideograph 299'));
    rerender(<CharacterGrid categories={large} onSelect={() => {}} className="again" />);
    expect(container.querySelector('.ui-character-grid__preview-name')).toHaveTextContent(
      'Ideograph 299',
    );
  });
});

function requireCircled(offered: readonly CharacterGridCategory[]): CharacterGridCategory {
  const circled = offered.find((category) => category.id === 'circled');
  if (!circled) throw new Error('No circled category');
  return circled;
}
