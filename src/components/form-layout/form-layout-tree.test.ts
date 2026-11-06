import { describe, expect, it } from 'vitest';
import {
  canPlaceFormLayoutNode,
  findFormLayoutNode,
  type FormLayoutRules,
  type FormLayoutValue,
  insertFormLayoutNode,
  moveFormLayoutNode,
  nextFormLayoutPlace,
  removeFormLayoutNode,
  updateFormLayoutNode,
  validateFormLayout,
} from './form-layout-tree.js';

const rules: FormLayoutRules = {
  types: {
    section: { arrangement: 'stack', accepts: (type) => type !== 'section' },
    row: { arrangement: 'row', accepts: (type) => type === 'text' },
    text: {},
  },
  rootAccepts: (type) => type === 'section',
};

const layout: FormLayoutValue<{ source: string }> = [
  {
    id: 's1',
    type: 'section',
    label: 'Contact',
    children: [
      { id: 'name', type: 'text', data: { source: 'field-7' } },
      { id: 'r1', type: 'row', children: [{ id: 'city', type: 'text' }] },
    ],
  },
  { id: 's2', type: 'section', children: [{ id: 'note', type: 'text', isLocked: true }] },
];

describe('form layout tree', () => {
  it('UIC-FORM-LAYOUT-1.2 reports repeated ids, unknown types, leaves with children and refused places', () => {
    expect(validateFormLayout(layout, rules)).toEqual([]);
    const broken: FormLayoutValue = [
      { id: 'a', type: 'text' },
      {
        id: 'b',
        type: 'section',
        children: [
          { id: 'a', type: 'text' },
          { id: 'c', type: 'nope' },
        ],
      },
      { id: 'd', type: 'section', children: [{ id: 'e', type: 'text', children: [] }] },
    ];
    expect(validateFormLayout(broken, rules)).toEqual([
      { id: 'a', reason: 'placement' },
      { id: 'a', reason: 'duplicate-id' },
      { id: 'c', reason: 'unknown-type' },
      { id: 'e', reason: 'not-container' },
    ]);
  });

  it('UIC-FORM-LAYOUT-1.1 UIC-FORM-LAYOUT-1.3 edits keep ids, data and every untouched node', () => {
    const moved = moveFormLayoutNode(layout, 'name', { parentId: 's2', index: 1 });
    expect(findFormLayoutNode(moved, 'name')).toMatchObject({
      parentId: 's2',
      index: 1,
      node: { id: 'name', data: { source: 'field-7' } },
    });
    expect(findFormLayoutNode(moved, 'r1')?.node).toBe(layout[0]?.children?.[1]);
    const within = moveFormLayoutNode(layout, 'name', { parentId: 's1', index: 1 });
    expect(within[0]?.children?.map((node) => node.id)).toEqual(['r1', 'name']);
    const removed = removeFormLayoutNode(layout, 'r1');
    expect(findFormLayoutNode(removed, 'city')).toBeNull();
    expect(removed[1]).toBe(layout[1]);
    const inserted = insertFormLayoutNode(
      layout,
      { id: 'x', type: 'text' },
      { parentId: 'r1', index: 9 },
    );
    expect(findFormLayoutNode(inserted, 'x')).toMatchObject({ parentId: 'r1', index: 1 });
    const renamed = updateFormLayoutNode(layout, 'city', (node) => ({ ...node, label: 'Town' }));
    expect(findFormLayoutNode(renamed, 'city')?.node.label).toBe('Town');
    expect(removeFormLayoutNode(layout, 'missing')).toBe(layout);
  });

  it('UIC-FORM-LAYOUT-1.3 refuses places the rules, locks or the node itself forbid', () => {
    const can = (item: { type: string; id?: string }, parentId: string | null, index = 0) =>
      canPlaceFormLayoutNode(layout, rules, { ...item, place: { parentId, index } });
    expect(can({ type: 'text', id: 'name' }, 'r1')).toBe(true);
    expect(can({ type: 'section', id: 's1' }, 's2')).toBe(false);
    expect(can({ type: 'row', id: 'r1' }, 'r1')).toBe(false);
    expect(can({ type: 'text', id: 'note' }, 's1')).toBe(false);
    expect(can({ type: 'text' }, null)).toBe(false);
    expect(can({ type: 'text' }, 'city')).toBe(false);
    expect(can({ type: 'text' }, 'missing')).toBe(false);
  });

  it('UIC-FORM-LAYOUT-1.3 steps a node through every place its type may go, in document order', () => {
    const steps: string[] = [];
    let current = layout;
    for (;;) {
      const place = nextFormLayoutPlace(current, rules, { id: 'name', direction: 'next' });
      if (!place) break;
      current = moveFormLayoutNode(current, 'name', place);
      steps.push(`${place.parentId ?? 'top'}:${place.index}`);
    }
    // Into the row before and after its field, after the row, then through the second section.
    expect(steps).toEqual(['r1:0', 'r1:1', 's1:1', 's2:0', 's2:1']);
    expect(nextFormLayoutPlace(current, rules, { id: 'name', direction: 'previous' })).toEqual({
      parentId: 's2',
      index: 0,
    });
    expect(nextFormLayoutPlace(layout, rules, { id: 'note', direction: 'previous' })).toBeNull();
  });
});
