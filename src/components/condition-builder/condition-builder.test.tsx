import { act, render, screen, within } from '@testing-library/react';
import { userEvent, type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import type { FilterField } from '../filter-bar/filter-bar.js';
import {
  ConditionBuilder,
  type ConditionBuilderProps,
  type ConditionGroup,
  type ConditionRule,
} from './condition-builder.js';

const fields: FilterField[] = [
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'pages', label: 'Pages', type: 'number' },
  {
    id: 'genre',
    label: 'Genre',
    type: 'choice',
    options: [
      { value: 'history', label: 'History' },
      { value: 'travel', label: 'Travel' },
    ],
  },
];

const tree: ConditionGroup = {
  type: 'group',
  id: 'root',
  combinator: 'and',
  rules: [
    { type: 'rule', id: 'title', field: 'title', operator: 'contains', value: 'sea' },
    {
      type: 'group',
      id: 'either',
      combinator: 'or',
      rules: [
        { type: 'rule', id: 'pages', field: 'pages', operator: 'at-least', value: 300 },
        { type: 'rule', id: 'genre', field: 'genre', operator: 'any-of', value: ['travel'] },
      ],
    },
  ],
};

function Controlled({
  onValue,
  ...props
}: Partial<ConditionBuilderProps> & { onValue?: (value: ConditionGroup) => void }) {
  const [value, setValue] = useState(props.defaultValue ?? tree);
  return (
    <ConditionBuilder
      fields={fields}
      {...props}
      defaultValue={undefined}
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

// Rules are named by their position in their group; the first match is the outermost.
const rule = (name: string) => requireDefined(screen.getAllByRole('group', { name })[0]);
const ruleIds = (group: ConditionGroup): unknown[] =>
  group.rules.map((node) => (node.type === 'group' ? ruleIds(node) : node.id));
// A node's own menu button is the last one inside it; a group's first is its own.
const menuOf = (container: HTMLElement, index = -1) =>
  requireDefined(within(container).getAllByRole('button', { name: 'Actions' }).at(index));

/** Opens a node's menu and returns it, so its items are found without searching the page. */
async function openActions(user: UserEvent, container: HTMLElement, index?: number) {
  await user.click(menuOf(container, index));
  return screen.findByRole('menu');
}

// The tree after the nested group's rules were swapped, and after that group was duplicated.
const either = tree.rules[1] as ConditionGroup;
const moved: ConditionGroup = {
  ...tree,
  rules: [
    requireDefined(tree.rules[0]),
    { ...either, rules: [requireDefined(either.rules[1]), requireDefined(either.rules[0])] },
  ],
};
const duplicated: ConditionGroup = {
  ...moved,
  rules: [
    ...moved.rules,
    {
      ...(moved.rules[1] as ConditionGroup),
      id: 'copy',
      rules: [
        { ...(either.rules[1] as ConditionRule), id: 'genre-copy' },
        { ...(either.rules[0] as ConditionRule), id: 'pages-copy' },
      ],
    },
  ],
};

describe('ConditionBuilder', () => {
  it('UIC-CONDITION-BUILDER-1.2 UIC-CONDITION-BUILDER-1.3 UIC-CONDITION-BUILDER-3.1 draws named groups and rules', () => {
    render(<Controlled />);
    const builder = screen.getByRole('group', { name: 'Conditions' });
    const root = builder.querySelector('.ui-condition-builder__group');
    expect(root).toHaveAttribute('data-depth', '1');
    expect(root).toHaveAttribute('data-combinator', 'and');
    const nested = within(builder).getByRole('group', { name: 'Group' });
    expect(nested).toHaveAttribute('data-depth', '2');
    expect(nested).toHaveAttribute('data-combinator', 'or');
    expect(within(builder).getAllByRole('radiogroup', { name: 'Match' })).toHaveLength(2);
    expect(within(nested).getByRole('radio', { name: 'Any' })).toBeChecked();
    const first = within(nested).getByRole('group', { name: 'Rule 1' });
    expect(within(first).getByRole('button', { name: /Field/ })).toHaveTextContent('Pages');
    expect(within(first).getByRole('button', { name: /Condition/ })).toHaveTextContent(
      'is at least',
    );
    expect(within(first).getByRole('textbox', { name: 'Value' })).toHaveValue('300');
    expect(within(first).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    expect(within(nested).getByRole('button', { name: 'Add rule' })).toBeInTheDocument();
    expect(within(nested).getByRole('button', { name: 'Add group' })).toBeInTheDocument();
    expectHooksMatchSpec(document.body, 'CONDITION-BUILDER', {
      slots: [
        'group',
        'group-header',
        'combinator',
        'rules',
        'item',
        'rule',
        'field',
        'operator',
        'value',
        'actions',
        'group-actions',
        'add-rule',
        'add-group',
      ],
    });
  });

  it('UIC-CONDITION-BUILDER-1.2 switches a group between all and any', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    await user.click(within(rule('Group')).getByRole('radio', { name: 'All' }));
    const next = onValue.mock.lastCall?.[0] as ConditionGroup;
    expect(next.rules[1]).toMatchObject({ id: 'either', combinator: 'and' });
    expect(next.rules[0]).toBe(tree.rules[0]);
  });

  it('UIC-CONDITION-BUILDER-1.2 UIC-CONDITION-BUILDER-1.4 adds rules and groups, focusing the new rule', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConditionBuilder fields={fields} onChange={onChange} />);
    expect(screen.getByText('No rules yet.')).toHaveClass('ui-condition-builder__empty');
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    const added = onChange.mock.lastCall?.[0] as ConditionGroup;
    expect(added.rules).toEqual([
      { type: 'rule', id: expect.any(String), field: 'title', operator: 'contains', value: '' },
    ]);
    expect(within(rule('Rule 1')).getByRole('button', { name: /Field/ })).toHaveFocus();
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Add group' })[0]));
    const grouped = onChange.mock.lastCall?.[0] as ConditionGroup;
    expect(grouped.rules[1]).toMatchObject({
      type: 'group',
      combinator: 'and',
      rules: [{ type: 'rule', field: 'title' }],
    });
    const ids = [requireDefined(grouped.rules[0]).id, requireDefined(grouped.rules[1]).id];
    expect(new Set(ids).size).toBe(2);
    expect(within(rule('Group')).getByRole('button', { name: /Field/ })).toHaveFocus();
  });

  it('UIC-CONDITION-BUILDER-1.2 stops offering groups at the depth limit', () => {
    render(<Controlled maxDepth={2} />);
    expect(screen.getAllByRole('button', { name: 'Add rule' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Add group' })).toHaveLength(1);
    expect(
      within(rule('Group')).queryByRole('button', { name: 'Add group' }),
    ).not.toBeInTheDocument();
  });

  it('UIC-CONDITION-BUILDER-1.3 starts a rule over when its field changes', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const first = rule('Rule 1');
    await user.click(within(first).getByRole('button', { name: /Field/ }));
    await user.click(await screen.findByRole('option', { name: 'Genre' }));
    const next = onValue.mock.lastCall?.[0] as ConditionGroup;
    expect(next.rules[0]).toEqual({
      type: 'rule',
      id: 'title',
      field: 'genre',
      operator: 'any-of',
      value: [],
    });
  });

  it('UIC-CONDITION-BUILDER-1.5 UIC-STEP-LIST-EDITOR-4.2 moves a node down from its menu', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const nested = rule('Group');
    const menu = await openActions(user, within(nested).getByRole('group', { name: 'Rule 1' }));
    expect(within(menu).getByRole('menuitem', { name: 'Move up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(within(menu).getByRole('menuitem', { name: 'Move down' }));
    expect(ruleIds(onValue.mock.lastCall?.[0] as ConditionGroup)).toEqual([
      'title',
      ['genre', 'pages'],
    ]);
    expect(menuOf(within(nested).getByRole('group', { name: 'Rule 2' }))).toHaveFocus();
  });

  it('UIC-CONDITION-BUILDER-1.1 gives added and duplicated nodes ids no restored node holds', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const empty: ConditionGroup = { type: 'group', id: 'root', combinator: 'and', rules: [] };
    const view = render(<ConditionBuilder fields={fields} value={empty} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    const first = requireDefined((onChange.mock.lastCall?.[0] as ConditionGroup).rules[0]).id;
    // A tree saved earlier holds the ids this builder would make next, one of them nested.
    const base = first.slice(0, -1);
    const restoredRule = (id: string, value: string): ConditionRule => ({
      type: 'rule',
      id,
      field: 'title',
      operator: 'contains',
      value,
    });
    const restored: ConditionGroup = {
      ...empty,
      rules: [
        restoredRule(`${base}2`, 'kept'),
        {
          type: 'group',
          id: `${base}3`,
          combinator: 'or',
          rules: [restoredRule(`${base}4`, 'deep')],
        },
      ],
    };
    view.rerender(<ConditionBuilder fields={fields} value={restored} onChange={onChange} />);
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Add rule' }).at(-1)));
    const added = onChange.mock.lastCall?.[0] as ConditionGroup;
    const allIds = (node: ConditionGroup): string[] => [
      node.id,
      ...node.rules.flatMap((child) => (child.type === 'group' ? allIds(child) : [child.id])),
    ];
    expect(new Set(allIds(added)).size).toBe(allIds(added).length);
    await user.click(requireDefined(screen.getAllByRole('button', { name: 'Add group' })[0]));
    const grouped = onChange.mock.lastCall?.[0] as ConditionGroup;
    expect(new Set(allIds(grouped)).size).toBe(allIds(grouped).length);
    view.rerender(<ConditionBuilder fields={fields} value={added} onChange={onChange} />);
    const menu = await openActions(user, rule('Group'), 0);
    await user.click(within(menu).getByRole('menuitem', { name: 'Duplicate' }));
    const duplicated = onChange.mock.lastCall?.[0] as ConditionGroup;
    expect(new Set(allIds(duplicated)).size).toBe(allIds(duplicated).length);
    view.rerender(<ConditionBuilder fields={fields} value={added} onChange={onChange} />);
    await user.type(within(rule('Rule 3')).getByRole('textbox'), 'n');
    const edited = onChange.mock.lastCall?.[0] as ConditionGroup;
    expect(edited.rules.map((node) => (node.type === 'rule' ? node.value : node.id))).toEqual([
      'kept',
      `${base}3`,
      'n',
    ]);
  });

  it('UIC-CONDITION-BUILDER-1.5 duplicates a group from its menu under new ids', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} defaultValue={moved} />);
    const nested = rule('Group');
    const menu = await openActions(user, nested, 0);
    await user.click(within(menu).getByRole('menuitem', { name: 'Duplicate' }));
    const next = onValue.mock.lastCall?.[0] as ConditionGroup;
    expect(next.rules).toHaveLength(3);
    const copy = next.rules[2] as ConditionGroup;
    expect(copy.combinator).toBe('or');
    expect(copy.id).not.toBe('either');
    expect(copy.rules.map((node) => (node as ConditionRule).field)).toEqual(['genre', 'pages']);
  });

  it('UIC-CONDITION-BUILDER-1.5 deletes a rule from its menu', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} defaultValue={duplicated} />);
    const menu = await openActions(user, rule('Rule 1'));
    await user.click(within(menu).getByRole('menuitem', { name: 'Delete' }));
    const next = onValue.mock.lastCall?.[0] as ConditionGroup;
    expect(next.rules.map((node) => node.type)).toEqual(['group', 'group']);
    expect(screen.getAllByRole('button', { name: 'Add rule' }).at(-1)).toHaveFocus();
  });

  it('UIC-CONDITION-BUILDER-3.2 moves a node with Alt+Arrow keys on its menu button', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Controlled onValue={onValue} />);
    const button = within(rule('Rule 1')).getByRole('button', { name: 'Actions' });
    act(() => button.focus());
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(onValue).not.toHaveBeenCalled();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(ruleIds(onValue.mock.lastCall?.[0] as ConditionGroup)).toEqual([
      ['pages', 'genre'],
      'title',
    ]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const moved = requireDefined(screen.getAllByRole('group', { name: 'Rule 2' }).at(-1));
    expect(within(moved).getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('UIC-CONDITION-BUILDER-1.6 shows the caller’s message or the incomplete one', () => {
    const validate = (candidate: ConditionRule) =>
      candidate.field === 'pages' && Number(candidate.value) > 1000 ? 'Too many pages.' : null;
    render(
      <ConditionBuilder
        fields={fields}
        validate={validate}
        defaultValue={{
          type: 'group',
          id: 'root',
          combinator: 'and',
          rules: [
            { type: 'rule', id: 'a', field: 'title', operator: 'contains', value: '' },
            { type: 'rule', id: 'b', field: 'pages', operator: 'at-least', value: 2000 },
            { type: 'rule', id: 'c', field: 'pages', operator: 'at-least', value: 20 },
          ],
        }}
      />,
    );
    const [missing, refused, fine] = [rule('Rule 1'), rule('Rule 2'), rule('Rule 3')];
    expect(missing).toHaveAttribute('data-incomplete', 'true');
    expect(missing).toHaveAttribute('data-invalid', 'true');
    expect(missing).toHaveAccessibleDescription('Enter a value.');
    expect(refused).not.toHaveAttribute('data-incomplete');
    expect(refused).toHaveAccessibleDescription('Too many pages.');
    expect(fine).not.toHaveAttribute('data-invalid');
    expect(fine).not.toHaveAttribute('aria-describedby');
    expectHooksMatchSpec(document.body, 'CONDITION-BUILDER', { slots: ['message'] });
  });

  it('UIC-CONDITION-BUILDER-1.3 draws only the field select of a rule on an unknown field', () => {
    render(
      <ConditionBuilder
        fields={fields}
        defaultValue={{
          type: 'group',
          id: 'root',
          combinator: 'and',
          rules: [{ type: 'rule', id: 'a', field: 'colour', operator: 'equals', value: 'red' }],
        }}
      />,
    );
    expect(within(rule('Rule 1')).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(rule('Rule 1')).queryByText('Enter a value.')).not.toBeInTheDocument();
  });

  it('UIC-CONDITION-BUILDER-1.7 carries caller attributes and labelling', () => {
    render(
      <>
        <h2 id="advanced">Advanced search</h2>
        <ConditionBuilder
          id="query"
          className="custom"
          data-testid="builder"
          aria-labelledby="advanced"
          fields={fields}
        />
      </>,
    );
    const builder = screen.getByRole('group', { name: 'Advanced search' });
    expect(builder).toHaveAttribute('id', 'query');
    expect(builder).toHaveClass('ui-condition-builder', 'custom');
    expect(builder).toHaveAttribute('data-testid', 'builder');
    expect(builder).not.toHaveAttribute('aria-label');
    expectHooksMatchSpec(document.body, 'CONDITION-BUILDER', {
      slots: ['group', 'empty'],
      callerAttributes: ['data-testid'],
    });
  });

  it('UIC-CONDITION-BUILDER-1.3 draws again only the rule being edited', async () => {
    const user = userEvent.setup();
    const validate = vi.fn((_rule: ConditionRule): string | null => null);
    render(<Controlled validate={validate} />);
    validate.mockClear();
    await user.type(within(rule('Rule 1')).getByRole('textbox', { name: 'Value' }), 's');
    const checked = new Set(validate.mock.calls.map(([checkedRule]) => checkedRule.id));
    expect(checked).toEqual(new Set(['title']));
  });
});
