import { describe, expect, it } from 'vitest';
import { formatFolderPath, formatPath, PATH_SEPARATOR, type PathFolder } from './path.js';

describe('formatPath', () => {
  it('UIC-PATH-1.1 joins trimmed nonblank labels with one separator, keeping array entries whole', () => {
    const labels = Object.freeze([' Garden ', '', 'Herbs', 'basil.txt']);
    expect(PATH_SEPARATOR).toBe('/');
    expect(formatPath(labels)).toBe('Garden/Herbs/basil.txt');
    expect(formatPath('Garden//Herbs/ ')).toBe('Garden/Herbs');
    expect(formatPath(['https://example.test/a', 'Lines 1 to 2'])).toBe(
      'https://example.test/a/Lines 1 to 2',
    );
    expect(formatPath(['North/South', 'East/West'])).toBe('North/South/East/West');
    expect(formatPath(['<b>', 'a & b'])).toBe('<b>/a & b');
    expect(labels).toEqual([' Garden ', '', 'Herbs', 'basil.txt']);
  });

  it('UIC-PATH-1.2 roots paths and reads empty paths as the root, empty or a fallback', () => {
    expect(formatPath(['Garden', 'Herbs'], { rooted: true })).toBe('/Garden/Herbs');
    expect(formatPath(' /Garden//Herbs/ ', { rooted: true })).toBe('/Garden/Herbs');
    expect(formatPath([], { rooted: true })).toBe('/');
    expect(formatPath(null)).toBe('');
    expect(formatPath(undefined, { rooted: true })).toBe('/');
    expect(formatPath('  ')).toBe('');
    expect(formatPath([], { emptyLabel: 'Everywhere' })).toBe('Everywhere');
    expect(formatPath([], { rooted: true, emptyLabel: 'Unsorted' })).toBe('Unsorted');
  });
});

describe('formatFolderPath', () => {
  const folders: readonly PathFolder[] = Object.freeze([
    { id: 'a', parentId: null, name: 'Atlas' },
    { id: 'b', parentId: 'a', name: 'Bonsai' },
    { id: 'orphan', parentId: 'missing', name: 'Known' },
    { id: 'blank', parentId: 'orphan', name: ' ' },
    { id: 'cycle1', parentId: 'cycle2', name: 'First' },
    { id: 'cycle2', parentId: 'cycle1', name: 'Second' },
  ]);

  it('UIC-PATH-1.3 walks parents, keeps known ancestors, stops at cycles and names blank folders by id', () => {
    for (const [id, expected] of [
      [null, '/'],
      [undefined, '/'],
      ['  ', '/'],
      ['missing', '/'],
      ['a', '/Atlas'],
      ['b', '/Atlas/Bonsai'],
      ['orphan', '/Known'],
      ['blank', '/Known/blank'],
      ['cycle1', '/Second/First'],
    ] as const) {
      expect(formatFolderPath(folders, id)).toBe(expected);
    }
  });

  it('UIC-PATH-1.3 uses a root label and prefers a resolved path', () => {
    expect(formatFolderPath(folders, null, 'Unsorted')).toBe('Unsorted');
    expect(formatFolderPath(folders, 'missing', 'Unsorted')).toBe('Unsorted');
    expect(
      formatFolderPath(
        [{ id: 'b', parentId: 'missing', name: 'Bonsai', path: 'Atlas/Bonsai' }],
        'b',
      ),
    ).toBe('/Atlas/Bonsai');
    expect(formatFolderPath([{ id: 'b', parentId: null, name: 'Bonsai', path: ' ' }], 'b')).toBe(
      '/Bonsai',
    );
  });
});
