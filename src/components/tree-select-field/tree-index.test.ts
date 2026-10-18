import { describe, expect, it } from 'vitest';
import {
  getAncestorKeys,
  getTopChosenKeys,
  indexTreeItems,
  orderChosenKeys,
  removeChosenKey,
} from './tree-index.js';

interface Place {
  id: string;
  children?: Place[];
}

const places: Place[] = [
  {
    id: 'europe',
    children: [{ id: 'norway', children: [{ id: 'oslo' }, { id: 'bergen' }] }, { id: 'portugal' }],
  },
  { id: 'peru' },
];
const index = indexTreeItems(places, (item) => item.children);

describe('tree index', () => {
  it('UIC-TREE-SELECT-FIELD-1.2 indexes loaded nodes in reading order with their ancestors', () => {
    expect([...index.keys()]).toEqual(['europe', 'norway', 'oslo', 'bergen', 'portugal', 'peru']);
    expect(index.get('oslo')?.parent).toBe('norway');
    expect(getAncestorKeys(index, 'bergen')).toEqual(['europe', 'norway']);
    expect(getAncestorKeys(index, 'peru')).toEqual([]);
    expect(getAncestorKeys(index, 'unknown')).toEqual([]);
  });

  it('UIC-TREE-SELECT-FIELD-2.2 orders chosen keys by reading order, unknown keys last', () => {
    expect(orderChosenKeys(['peru', 'ghost', 'oslo', 'europe', 'oslo'], index)).toEqual([
      'europe',
      'oslo',
      'peru',
      'ghost',
    ]);
  });

  it('UIC-TREE-SELECT-FIELD-2.3 keeps one key per chosen branch', () => {
    expect(getTopChosenKeys(['norway', 'oslo', 'bergen', 'peru'], index)).toEqual([
      'norway',
      'peru',
    ]);
    expect(getTopChosenKeys(['oslo', 'portugal'], index)).toEqual(['oslo', 'portugal']);
  });

  it('UIC-TREE-SELECT-FIELD-2.3 removes a key alone, or with its descendants and ancestors', () => {
    const chosen = ['europe', 'norway', 'oslo', 'bergen', 'portugal', 'peru'];
    expect(removeChosenKey(chosen, { key: 'norway', index, cascade: false })).toEqual([
      'europe',
      'oslo',
      'bergen',
      'portugal',
      'peru',
    ]);
    expect(removeChosenKey(chosen, { key: 'norway', index, cascade: true })).toEqual([
      'portugal',
      'peru',
    ]);
    expect(removeChosenKey(chosen, { key: 'oslo', index, cascade: true })).toEqual([
      'bergen',
      'portugal',
      'peru',
    ]);
  });
});
