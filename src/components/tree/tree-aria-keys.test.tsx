import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Key, Selection } from '../../core/props.js';
import { Tree } from './tree.js';

interface Entry {
  id: Key;
  name: string;
  children?: Entry[];
}

const leaves: Entry[] = [
  { id: 1, name: 'Numeric item' },
  { id: '1', name: 'Text item' },
  { id: 'a b', name: 'Space key' },
  { id: 'a-b', name: 'Dash key' },
];

const text = (item: Entry) => item.name;
const row = (name: string) => screen.getByRole('row', { name });

afterEach(() => vi.unstubAllGlobals());

describe('Tree primitive keys', () => {
  it('UIC-TREE-3.2 preserves the range anchor across controlled typed-key selection changes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    function Controlled() {
      const [selected, setSelected] = useState<Selection>(new Set());
      return (
        <Tree
          aria-label="Keys"
          items={leaves}
          getTextValue={text}
          selectionMode="multiple"
          selectionBehavior="replace"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys);
            onSelectionChange(keys);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.click(row('Numeric item'));
    await user.keyboard('{Shift>}');
    await user.click(row('Dash key'));
    await user.keyboard('{/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, '1', 'a b', 'a-b']));
  });
  it('UIC-TREE-1.1 UIC-TREE-3.2 UIC-TREE-3.3 keeps numeric, textual and whitespace-normalized keys distinct', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onAction = vi.fn();
    render(
      <Tree
        aria-label="Keys"
        items={leaves}
        getTextValue={text}
        selectionMode="multiple"
        selectionBehavior="replace"
        defaultSelectedKeys={[1]}
        disabledKeys={['a b']}
        onSelectionChange={onSelectionChange}
        onAction={onAction}
      />,
    );
    expect(row('Numeric item')).toHaveAttribute('aria-selected', 'true');
    expect(row('Text item')).toHaveAttribute('aria-selected', 'false');
    expect(row('Space key')).toHaveAttribute('aria-disabled', 'true');
    expect(row('Dash key')).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(row('Text item'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['1']));
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenLastCalledWith('1');
    await user.dblClick(row('Numeric item'));
    expect(onAction).toHaveBeenLastCalledWith(1);
  });

  it('UIC-TREE-2.1 expands numeric and textual branches separately and reports original keys', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const items: Entry[] = [
      { id: 1, name: 'Numeric branch', children: [{ id: 2, name: 'Numeric child' }] },
      { id: '1', name: 'Text branch', children: [{ id: '2', name: 'Text child' }] },
    ];
    render(
      <Tree
        aria-label="Keys"
        items={items}
        getTextValue={text}
        defaultExpandedKeys={[1]}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(row('Numeric child')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: 'Text child' })).not.toBeInTheDocument();
    await user.click(
      within(row('Text branch')).getByRole('button', { name: 'Expand Text branch' }),
    );
    expect(row('Text child')).toBeInTheDocument();
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set([1, '1']));
  });

  it('UIC-TREE-3.2 consumes initial and disabled key generators once across selection and row rendering', () => {
    function* selected() {
      yield 1;
    }
    function* disabled() {
      yield '1';
    }
    render(
      <Tree
        aria-label="Keys"
        items={leaves}
        getTextValue={text}
        selectionMode="multiple"
        defaultSelectedKeys={selected()}
        disabledKeys={disabled()}
      />,
    );
    expect(row('Numeric item')).toHaveAttribute('aria-selected', 'true');
    expect(row('Text item')).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-TREE-2.4 loads each typed branch with its original item', async () => {
    vi.stubGlobal(
      'IntersectionObserver',
      function createObserver(callback: IntersectionObserverCallback) {
        const observer = {
          observe(target: Element) {
            callback(
              [{ isIntersecting: true, target } as IntersectionObserverEntry],
              observer as unknown as IntersectionObserver,
            );
          },
          disconnect() {},
        };
        return observer;
      },
    );
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    const items: Entry[] = [
      { id: 1, name: 'Numeric branch' },
      { id: '1', name: 'Text branch' },
    ];
    render(
      <Tree
        aria-label="Keys"
        items={items}
        getTextValue={text}
        hasChildItems={() => true}
        onLoadChildren={onLoadChildren}
      />,
    );
    await user.click(
      within(row('Numeric branch')).getByRole('button', { name: 'Expand Numeric branch' }),
    );
    await user.click(
      within(row('Text branch')).getByRole('button', { name: 'Expand Text branch' }),
    );
    expect(onLoadChildren).toHaveBeenNthCalledWith(1, items[0]);
    expect(onLoadChildren).toHaveBeenNthCalledWith(2, items[1]);
  });
});
