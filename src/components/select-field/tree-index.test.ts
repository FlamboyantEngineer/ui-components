import { describe, expect, it } from 'vitest';
import {
  closeChosenBranches,
  collectAncestorKeys,
  getAncestorKeys,
  getTopChosenKeys,
  indexTreeItems,
  orderChosenKeys,
  removeChosenKey,
  type TreeIndex,
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
  it('UIC-SELECT-FIELD-9.2 indexes loaded nodes in reading order with their ancestors', () => {
    expect([...index.keys()]).toEqual(['europe', 'norway', 'oslo', 'bergen', 'portugal', 'peru']);
    expect(index.get('oslo')?.parent).toBe('norway');
    expect(getAncestorKeys(index, 'bergen')).toEqual(['europe', 'norway']);
    expect(getAncestorKeys(index, 'peru')).toEqual([]);
    expect(getAncestorKeys(index, 'unknown')).toEqual([]);
  });

  it('UIC-SELECT-FIELD-10.2 orders chosen keys by reading order, unknown keys last', () => {
    expect(orderChosenKeys(['peru', 'ghost', 'oslo', 'europe', 'oslo'], index)).toEqual([
      'europe',
      'oslo',
      'peru',
      'ghost',
    ]);
  });

  it('UIC-SELECT-FIELD-10.3 keeps one key per chosen branch', () => {
    expect(getTopChosenKeys(['norway', 'oslo', 'bergen', 'peru'], index)).toEqual([
      'norway',
      'peru',
    ]);
    expect(getTopChosenKeys(['oslo', 'portugal'], index)).toEqual(['oslo', 'portugal']);
  });

  it('UIC-SELECT-FIELD-10.2 reads a branch whose loaded children are all chosen as chosen', () => {
    expect(closeChosenBranches(['oslo', 'bergen'], index)).toEqual(['norway', 'oslo', 'bergen']);
    expect(closeChosenBranches(['oslo', 'bergen', 'portugal'], index)).toEqual([
      'europe',
      'norway',
      'oslo',
      'bergen',
      'portugal',
    ]);
    expect(closeChosenBranches(['oslo', 'peru'], index)).toEqual(['oslo', 'peru']);
    expect(closeChosenBranches([], index)).toEqual([]);
  });

  it('UIC-SELECT-FIELD-10.3 removes a key alone, or with its descendants and ancestors', () => {
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
  it('UIC-SELECT-FIELD-9.2 indexes a deep loaded branch without recursive calls', () => {
    const count = 20_000;
    let branch: Place = { id: String(count) };
    for (let id = count - 1; id >= 0; id--) branch = { id: String(id), children: [branch] };
    const deep = indexTreeItems([branch], (item) => item.children);
    expect(deep.size).toBe(count + 1);
    const ancestors = getAncestorKeys(deep, String(count));
    expect(ancestors).toHaveLength(count);
    expect(ancestors[0]).toBe('0');
    expect(ancestors.at(-1)).toBe(String(count - 1));
  });

  it('UIC-SELECT-FIELD-10.3 reuses shared ancestor paths when collapsing and removing choices', () => {
    const count = 5000;
    const entries = new Map(
      Array.from({ length: count }, (_, id) => [
        String(id),
        {
          item: { id: String(id) },
          parent: id === 0 ? null : String(id - 1),
          order: id,
        },
      ]),
    );
    let reads = 0;
    const counted = new Proxy(entries, {
      get(target, name) {
        if (name === 'get')
          return (key: string) => {
            reads++;
            return target.get(key);
          };
        return Reflect.get(target, name, target);
      },
    }) as TreeIndex<Place>;
    const chosen = [...entries.keys()].slice().reverse();
    expect(getTopChosenKeys(chosen, counted)).toEqual(['0']);
    expect(reads).toBeLessThan(count * 3);
    reads = 0;
    expect(collectAncestorKeys(counted, chosen).size).toBe(count - 1);
    expect(reads).toBeLessThan(count * 3);
    reads = 0;
    expect(removeChosenKey(chosen, { key: '0', index: counted, cascade: true })).toEqual([]);
    expect(reads).toBeLessThan(count * 3);
  });

  it('UIC-SELECT-FIELD-9.2 UIC-SELECT-FIELD-10.3 terminates ancestry checks on cyclic index entries', () => {
    const cyclic = new Map([
      ['a', { item: { id: 'a' }, parent: 'b', order: 0 }],
      ['b', { item: { id: 'b' }, parent: 'a', order: 1 }],
    ]);
    expect(getAncestorKeys(cyclic, 'a')).toEqual(['a', 'b']);
    expect(getTopChosenKeys(['a'], cyclic)).toEqual([]);
    expect(
      removeChosenKey(['a', 'b', 'unknown'], { key: 'a', index: cyclic, cascade: true }),
    ).toEqual(['unknown']);
  });
});
