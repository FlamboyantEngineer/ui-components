import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tree, type TreeHandle, type TreeProps } from './tree.js';

interface Node {
  id: string | number;
  name: string;
  children?: Node[];
}

const nodes: Node[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    children: [
      { id: 'apple', name: 'Apple' },
      { id: 'pear', name: 'Pear' },
    ],
  },
  { id: 'nuts', name: 'Nuts', children: [] },
  { id: 2, name: 'Numeric two' },
  { id: '2', name: 'Text two' },
];

const scrollIntoView = vi.fn();
const original = Element.prototype.scrollIntoView;

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  Element.prototype.scrollIntoView = original;
});

function renderTree(props: Partial<TreeProps<Node>> = {}) {
  const handleRef = createRef<TreeHandle>();
  render(
    <>
      <button type="button">Elsewhere</button>
      <Tree
        aria-label="Food"
        items={nodes}
        getTextValue={(node) => node.name}
        handleRef={handleRef}
        {...props}
      />
    </>,
  );
  return {
    handle: () => {
      if (!handleRef.current) throw new Error('The tree gave no handle.');
      return handleRef.current;
    },
  };
}

/** The element the last reveal scrolled into view. */
const scrolled = () => scrollIntoView.mock.contexts.at(-1) as HTMLElement | undefined;

describe('Tree handle', () => {
  it('UIC-TREE-9.1 reveals a row by id without moving focus, and focuses it on request', async () => {
    const user = userEvent.setup();
    const { handle } = renderTree({ defaultExpandedKeys: ['fruit'] });
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    await user.click(elsewhere);
    expect(await handle().revealKey('pear')).toEqual({ found: true });
    expect(scrolled()).toHaveTextContent('Pear');
    expect(elsewhere).toHaveFocus();
    expect(await handle().focusKey('pear')).toEqual({ found: true });
    expect(screen.getByRole('row', { name: 'Pear' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('row', { name: 'Apple' })).toHaveFocus();
  });

  it('UIC-TREE-9.1 keeps numeric and text ids apart', async () => {
    const { handle } = renderTree();
    await handle().revealKey(2);
    expect(scrolled()).toHaveTextContent('Numeric two');
    await handle().revealKey('2');
    expect(scrolled()).toHaveTextContent('Text two');
  });

  it('UIC-TREE-9.2 UIC-COLLECTIONS-1.6 reports rows it does not show and why, without expanding or loading', async () => {
    const onExpandedChange = vi.fn();
    const { handle } = renderTree({ onExpandedChange, onLoadChildren: vi.fn() });
    expect(await handle().revealKey('apple')).toEqual({ found: false, reason: 'collapsed' });
    expect(await handle().revealKey('walnut')).toEqual({ found: false, reason: 'missing' });
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    const { handle: filtered } = renderTree({ filterText: 'Pear' });
    expect(await filtered().revealKey('apple')).toEqual({ found: false, reason: 'filtered' });
    // A filter reveals the ancestors of its matches.
    expect(await filtered().revealKey('pear')).toEqual({ found: true });
  });

  it('UIC-TREE-9.3 draws an offscreen row of a virtualized tree, and settles when it unmounts', async () => {
    // React Aria's virtualizer treats an unmocked test DOM as infinitely large.
    const sizes = { clientWidth: 300, clientHeight: 200 };
    for (const [name, value] of Object.entries(sizes)) {
      Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get: () => value });
    }
    const many: Node[] = Array.from({ length: 400 }, (_, index) => ({
      id: `item-${index}`,
      name: `Item ${index + 1}`,
    }));
    try {
      const { handle } = renderTree({ items: many, virtualized: true, size: 'md' });
      expect(screen.queryByRole('row', { name: 'Item 301' })).not.toBeInTheDocument();
      expect(await act(() => handle().revealKey('item-300'))).toEqual({ found: true });
      expect(scrolled()).toHaveTextContent('Item 301');
      const handleRef = createRef<TreeHandle>();
      const { unmount } = render(
        <Tree
          aria-label="More"
          items={many}
          getTextValue={(node) => node.name}
          virtualized
          handleRef={handleRef}
        />,
      );
      const pending = handleRef.current?.revealKey('item-350');
      unmount();
      expect(await pending).toEqual({ found: false, reason: 'unmounted' });
    } finally {
      for (const name of Object.keys(sizes)) Reflect.deleteProperty(HTMLElement.prototype, name);
    }
  });
});
