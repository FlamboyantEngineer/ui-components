import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Key, Selection } from '../../core/props.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Tag, TagGroup, type TagProps } from './tag-group.js';

interface Fruit {
  id: string;
  name: string;
}

const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'pear', name: 'Pear' },
  { id: 'plum', name: 'Plum' },
];

function Basket({ onRemove }: { onRemove?: (keys: Set<Key>) => void }) {
  const [items, setItems] = useState(fruit);
  return (
    <TagGroup
      aria-label="Basket"
      items={items}
      onRemove={(keys) => {
        onRemove?.(keys);
        setItems((current) => current.filter((item) => !keys.has(item.id)));
      }}
    >
      {(item) => <Tag id={item.id}>{item.name}</Tag>}
    </TagGroup>
  );
}

function tag(name: string) {
  return screen.getByRole('row', { name });
}

/** A host component around `Tag`, as React Aria's reuse pattern writes it. */
function FruitTag(props: TagProps) {
  return <Tag {...props} />;
}

describe('TagGroup', () => {
  it('UIC-TAG-GROUP-1.1 UIC-TAG-GROUP-2.2 takes a free button in a tag and keeps its remove button', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const onRemove = vi.fn();
    render(
      <TagGroup aria-label="Filters" onRemove={onRemove}>
        <Tag id="fig" textValue="Fig">
          Fig{' '}
          <Button variant="bare" size="xs" onPress={onPress}>
            Edit
          </Button>
        </Tag>
      </TagGroup>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onPress).toHaveBeenCalledOnce();
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /^Remove/ }));
    expect(onRemove).toHaveBeenCalledWith(new Set(['fig']));
  });

  it('UIC-TAG-GROUP-2.3 UIC-TAG-GROUP-2.4 retains one-shot selected and disabled keys across rerenders', () => {
    const selectedKeys = (function* () {
      yield 'apple';
    })();
    const disabledKeys = (function* () {
      yield 'pear';
    })();
    const props = { items: fruit, selectionMode: 'multiple' as const, selectedKeys, disabledKeys };
    const renderTag = (item: Fruit) => <Tag id={item.id}>{item.name}</Tag>;
    const { rerender } = render(
      <TagGroup {...props} aria-label="Fruit">
        {renderTag}
      </TagGroup>,
    );
    expect(tag('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(tag('Pear')).toHaveAttribute('data-disabled', 'true');
    rerender(
      <TagGroup {...props} aria-label="Updated fruit">
        {renderTag}
      </TagGroup>,
    );
    expect(tag('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(tag('Pear')).toHaveAttribute('data-disabled', 'true');
  });

  it('UIC-TAG-GROUP-2.4 preserves Shift range selection across controlled updates', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    function Picker() {
      const [selected, setSelected] = useState<Selection>(new Set());
      return (
        <TagGroup
          aria-label="Range"
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys);
            onSelectionChange(keys);
          }}
        >
          <Tag id={1}>Numeric</Tag>
          <Tag id="1">Textual</Tag>
          <Tag id="a b">Spaced</Tag>
          <Tag id="ab">Compact</Tag>
        </TagGroup>
      );
    }
    render(<Picker />);
    await user.click(tag('Numeric'));
    await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{/Shift}');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([1, '1', 'a b']));
  });

  it('UIC-TAG-GROUP-2.3 treats disabled keys as an iterable even when its text is all', () => {
    render(
      <TagGroup aria-label="Letters" disabledKeys="all" onRemove={() => undefined}>
        <Tag id="a">A</Tag>
        <Tag id="l">L</Tag>
      </TagGroup>,
    );
    expect(tag('A')).toHaveAttribute('data-disabled', 'true');
    expect(tag('L')).toHaveAttribute('data-disabled', 'true');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-TAG-GROUP-1.2 retains the dynamic renderer cache for unchanged items', () => {
    const renderTag = vi.fn((item: Fruit) => <Tag id={item.id}>{item.name}</Tag>);
    const { rerender } = render(
      <TagGroup aria-label="Basket" items={fruit}>
        {renderTag}
      </TagGroup>,
    );
    const calls = renderTag.mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(fruit.length);
    rerender(
      <TagGroup aria-label="Updated basket" items={fruit}>
        {renderTag}
      </TagGroup>,
    );
    expect(renderTag).toHaveBeenCalledTimes(calls);
  });

  it('UIC-TAG-GROUP-1.2 UIC-TAG-GROUP-2.4 preserves numeric and text identities when selecting, removing and reordering tags', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 1, label: 'Numeric' },
      { id: '1', label: 'Textual' },
    ];
    const onRemove = vi.fn();
    const onSelectionChange = vi.fn();
    const props = {
      'aria-label': 'Types',
      selectionMode: 'multiple' as const,
      selectedKeys: [1],
      onRemove,
      onSelectionChange,
    };
    const { rerender } = render(
      <TagGroup {...props} items={items}>
        {(item) => <Tag id={item.id}>{item.label}</Tag>}
      </TagGroup>,
    );
    const numeric = tag('Numeric');
    const textual = tag('Textual');
    expect(numeric).toHaveAttribute('aria-selected', 'true');
    await user.click(textual);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set([1, '1']));
    await user.click(within(textual).getByRole('button', { name: 'Remove Textual' }));
    expect(onRemove).toHaveBeenCalledWith(new Set(['1']));
    rerender(
      <TagGroup {...props} items={[requireDefined(items[1]), requireDefined(items[0])]}>
        {(item) => <Tag id={item.id}>{item.label}</Tag>}
      </TagGroup>,
    );
    expect(screen.getAllByRole('row')).toEqual([textual, numeric]);
  });

  it('UIC-COMPOSITION-4.2 UIC-TAG-GROUP-1.2 UIC-TAG-GROUP-2.3 UIC-TAG-GROUP-2.4 keys tags rendered through a host component by their id', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <TagGroup
        aria-label="Fruit"
        selectionMode="multiple"
        selectedKeys={['apple']}
        disabledKeys={['pear']}
        onSelectionChange={onSelectionChange}
        onRemove={onRemove}
      >
        <FruitTag id="apple">Apple</FruitTag>
        <FruitTag id="pear">Pear</FruitTag>
        <FruitTag id={2}>Two</FruitTag>
      </TagGroup>,
    );
    expect(tag('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(tag('Pear')).toHaveAttribute('data-disabled', 'true');
    const two = tag('Two');
    expect(two).toHaveAttribute('aria-selected', 'false');
    await user.click(two);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['apple', 2]));
    await user.click(within(two).getByRole('button', { name: 'Remove Two' }));
    expect(onRemove).toHaveBeenLastCalledWith(new Set([2]));
  });

  it('UIC-COMPOSITION-4.2 UIC-TAG-GROUP-1.2 UIC-TAG-GROUP-2.4 keys tags a host component draws from items by the item ids', () => {
    render(
      <TagGroup
        aria-label="Fruit"
        items={fruit}
        selectionMode="single"
        defaultSelectedKeys={['pear']}
      >
        {(item) => <FruitTag>{item.name}</FruitTag>}
      </TagGroup>,
    );
    expect(tag('Pear')).toHaveAttribute('aria-selected', 'true');
    expect(tag('Apple')).toHaveAttribute('aria-selected', 'false');
  });

  it('UIC-TAG-GROUP-1.1 renders a named grid of tag rows', () => {
    const { container } = render(
      <TagGroup aria-label="Basket">
        <Tag id="apple">Apple</Tag>
        <Tag id="pear" textValue="Pear, ripe">
          <strong>Pear</strong>
        </Tag>
      </TagGroup>,
    );
    const root = container.querySelector('.ui-tag-group');
    const grid = screen.getByRole('grid', { name: 'Basket' });
    expect(root?.tagName).toBe('DIV');
    expect(grid).toHaveClass('ui-tag-group__list');
    expect(within(grid).getAllByRole('row')).toHaveLength(2);
    expect(tag('Apple')).toHaveClass('ui-tag-group__tag');
    expect(tag('Pear, ripe').querySelector('.ui-tag-group__label strong')).toHaveTextContent(
      'Pear',
    );
    expectHooksMatchSpec(container, 'TAG-GROUP', { slots: ['list', 'tag', 'label'] });
  });

  it('UIC-TAG-GROUP-1.2 renders tags from items and follows new items', () => {
    const { rerender } = render(
      <TagGroup aria-label="Basket" items={fruit}>
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    expect(screen.getAllByRole('row').map((row) => row.textContent)).toEqual([
      'Apple',
      'Pear',
      'Plum',
    ]);
    expect(tag('Pear')).toHaveAttribute('data-key', toCollectionKey('pear'));
    rerender(
      <TagGroup aria-label="Basket" items={[{ id: 'pear', name: 'Conference pear' }]}>
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(tag('Conference pear')).toHaveAttribute('data-key', toCollectionKey('pear'));
  });

  it('UIC-TAG-GROUP-1.3 publishes its size on the root', () => {
    const { container, rerender } = render(
      <TagGroup aria-label="Basket">
        <Tag id="apple">Apple</Tag>
      </TagGroup>,
    );
    const root = () => container.querySelector('.ui-tag-group');
    expect(root()).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'lg'] as const) {
      rerender(
        <TagGroup aria-label="Basket" size={size}>
          <Tag id="apple">Apple</Tag>
        </TagGroup>,
      );
      expect(root()).toHaveAttribute('data-size', size);
    }
    expectHooksMatchSpec(container, 'TAG-GROUP');
  });

  it('UIC-TAG-GROUP-1.4 tones every tag from the group unless the tag sets its own', () => {
    const { container, rerender } = render(
      <TagGroup aria-label="Basket" items={fruit}>
        {(item) => (
          <Tag id={item.id} tone={item.id === 'plum' ? 'danger' : undefined}>
            {item.name}
          </Tag>
        )}
      </TagGroup>,
    );
    expect(tag('Apple')).toHaveAttribute('data-tone', 'neutral');
    expect(tag('Plum')).toHaveAttribute('data-tone', 'danger');
    rerender(
      <TagGroup aria-label="Basket" items={fruit} tone="success" size="sm">
        {(item) => (
          <Tag id={item.id} tone={item.id === 'plum' ? 'danger' : undefined}>
            {item.name}
          </Tag>
        )}
      </TagGroup>,
    );
    expect(tag('Apple')).toHaveAttribute('data-tone', 'success');
    expect(tag('Plum')).toHaveAttribute('data-tone', 'danger');
    expectHooksMatchSpec(container, 'TAG-GROUP');
  });

  it('UIC-TAG-GROUP-1.5 shows the empty state while it holds no tag', () => {
    const { container, rerender } = render(
      <TagGroup<Fruit> aria-label="Basket" items={[]} renderEmptyState={() => 'Nothing picked'}>
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    const list = container.querySelector('.ui-tag-group__list');
    expect(list).toHaveAttribute('data-empty', 'true');
    expect(container.querySelector('.ui-tag-group__empty')).toHaveTextContent('Nothing picked');
    expectHooksMatchSpec(container, 'TAG-GROUP', { slots: ['empty'] });
    rerender(
      <TagGroup<Fruit> aria-label="Basket" items={[]}>
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    expect(container.querySelector('.ui-tag-group__empty')).toBeNull();
    expect(list).toBeEmptyDOMElement();
  });

  it('UIC-TAG-GROUP-1.6 forwards class names, ids and data attributes', () => {
    const { container } = render(
      <TagGroup
        aria-label="Basket"
        id="basket"
        className="compact"
        data-test="basket"
        data-size="xl"
      >
        <Tag id="apple" className="fresh" data-change="added" data-tone="loud">
          Apple
        </Tag>
      </TagGroup>,
    );
    const root = container.querySelector('.ui-tag-group');
    expect(root).toHaveAttribute('id', 'basket');
    expect(root).toHaveClass('ui-tag-group', 'compact');
    expect(root).toHaveAttribute('data-test', 'basket');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(tag('Apple')).toHaveClass('ui-tag-group__tag', 'fresh');
    expect(tag('Apple')).toHaveAttribute('data-change', 'added');
    expect(tag('Apple')).toHaveAttribute('data-tone', 'neutral');
    expectHooksMatchSpec(container, 'TAG-GROUP', {
      callerAttributes: ['data-test', 'data-change'],
    });
  });

  it('UIC-TAG-GROUP-2.1 is one tab stop that the arrow keys move through', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TagGroup aria-label="Basket" items={fruit}>
          {(item) => (
            <Tag id={item.id} isDisabled={item.id === 'pear'}>
              {item.name}
            </Tag>
          )}
        </TagGroup>
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(tag('Apple')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tag('Plum')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(tag('Apple')).toHaveFocus();
    await user.keyboard('{End}');
    expect(tag('Plum')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('UIC-TAG-GROUP-2.2 removes a tag by its button and by Delete or Backspace', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(<Basket onRemove={onRemove} />);
    expect(tag('Apple')).toHaveAttribute('data-allows-removing', 'true');
    expectHooksMatchSpec(container, 'TAG-GROUP', { slots: ['remove'] });
    await user.click(screen.getByRole('button', { name: 'Remove Pear' }));
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['pear']));
    act(() => tag('Apple').focus());
    await user.keyboard('{Delete}');
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['apple']));
    await waitFor(() => expect(tag('Plum')).toHaveFocus());
    await user.keyboard('{Backspace}');
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['plum']));
    expect(screen.queryAllByRole('row')).toHaveLength(0);
  });

  it('UIC-TAG-GROUP-2.2 names the remove button from the provider strings', () => {
    render(
      <UiProvider messages={{ remove: 'Drop' }}>
        <Basket />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Drop Apple' })).toHaveClass(
      'ui-tag-group__remove',
      'ui-button',
    );
  });

  it('UIC-TAG-GROUP-2.2 keeps tags readable and focusable without onRemove', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TagGroup aria-label="Basket" items={fruit}>
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(tag('Apple')).not.toHaveAttribute('data-allows-removing');
    await user.tab();
    await user.keyboard('{Delete}{Backspace}');
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(tag('Apple')).toHaveFocus();
    expectHooksMatchSpec(container, 'TAG-GROUP');
  });

  it('UIC-TAG-GROUP-2.3 leaves disabled tags out of focus and removal', () => {
    const { container } = render(
      <TagGroup aria-label="Basket" items={fruit} disabledKeys={['plum']} onRemove={() => {}}>
        {(item) => (
          <Tag id={item.id} isDisabled={item.id === 'pear'}>
            {item.name}
          </Tag>
        )}
      </TagGroup>,
    );
    for (const name of ['Pear', 'Plum']) {
      expect(tag(name)).toHaveAttribute('data-disabled', 'true');
      expect(tag(name)).toHaveAttribute('tabindex', '-1');
    }
    expect(
      screen.getAllByRole('button').map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Remove']);
    expectHooksMatchSpec(container, 'TAG-GROUP');
  });

  it('UIC-TAG-GROUP-2.4 selects tags and reports the shared selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn((keys: Selection) => keys);
    const { container } = render(
      <TagGroup
        aria-label="Basket"
        items={fruit}
        selectionMode="multiple"
        defaultSelectedKeys={['apple']}
        onSelectionChange={onSelectionChange}
      >
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    expect(tag('Apple')).toHaveAttribute('aria-selected', 'true');
    expect(tag('Apple')).toHaveAttribute('data-selected', 'true');
    await user.click(tag('Pear'));
    expect([...(onSelectionChange.mock.results.at(-1)?.value as Set<Key>)]).toEqual([
      'apple',
      'pear',
    ]);
    expect(tag('Pear')).toHaveAttribute('data-selection-mode', 'multiple');
    expectHooksMatchSpec(container, 'TAG-GROUP');
  });

  it('UIC-TAG-GROUP-2.4 controls the selection and can keep one tag selected', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <TagGroup
        aria-label="Basket"
        items={fruit}
        selectionMode="single"
        selectedKeys={['pear']}
        disallowEmptySelection
        onSelectionChange={onSelectionChange}
      >
        {(item) => <Tag id={item.id}>{item.name}</Tag>}
      </TagGroup>,
    );
    expect(tag('Pear')).toHaveAttribute('aria-selected', 'true');
    await user.click(tag('Pear'));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(tag('Pear')).toHaveAttribute('aria-selected', 'true');
    await user.click(tag('Apple'));
    expect([...(onSelectionChange.mock.lastCall?.[0] as Set<Key>)]).toEqual(['apple']);
    expect(tag('Pear')).toHaveAttribute('aria-selected', 'true');
  });
});
