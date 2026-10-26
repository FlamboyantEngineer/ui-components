import { describe, expect, it } from 'vitest';
import {
  buildFolderNodes,
  collectBranchKeys,
  findFolderPath,
  folderDraftKey,
  folderRootKey,
  getFolderHeight,
  listFolderDestinations,
  listTopmostFolders,
  type FolderItem,
} from './folder-model.js';
import { planFolderMoves } from './folder-moves.js';

const folders: FolderItem[] = [
  {
    id: 'fruit',
    name: 'Fruit',
    children: [{ id: 'citrus', name: 'Citrus', children: [{ id: 'lemons', name: 'Lemons' }] }],
  },
  { id: 'vegetables', name: 'Vegetables' },
];

function createFolderChain(depth: number): FolderItem {
  let folder: FolderItem = { id: depth, name: 'Leaf' };
  for (let id = depth - 1; id >= 0; id -= 1) folder = { id, name: 'Branch', children: [folder] };
  return folder;
}

describe('folder model', () => {
  it('UIC-FOLDER-MANAGER-1.1 shapes the folders into tree rows and lists the rows with children', () => {
    const nodes = buildFolderNodes(folders, {});
    expect(nodes.map(({ id, kind }) => [id, kind])).toEqual([
      ['fruit', 'folder'],
      ['vegetables', 'folder'],
    ]);
    expect(nodes[0]?.folder).toBe(folders[0]);
    expect(nodes[0]?.children?.[0]?.children?.[0]?.name).toBe('Lemons');
    expect(nodes[1]?.children).toBeUndefined();
    expect(collectBranchKeys(nodes)).toEqual(['fruit', 'citrus']);
  });

  it('UIC-FOLDER-MANAGER-1.2 wraps the folders in a root row', () => {
    const [root] = buildFolderNodes(folders, { rootLabel: 'All folders' });
    expect(root).toMatchObject({ id: folderRootKey, name: 'All folders', kind: 'root' });
    expect(root?.folder).toBeNull();
    expect(root?.children?.map(({ id }) => id)).toEqual(['fruit', 'vegetables']);
  });

  it('UIC-FOLDER-MANAGER-2.2 adds the draft row as the last child of its parent', () => {
    const inVegetables = buildFolderNodes(folders, { draftParentKey: 'vegetables' });
    expect(inVegetables[1]?.children?.map(({ id, kind }) => [id, kind])).toEqual([
      [folderDraftKey, 'draft'],
    ]);
    const atTop = buildFolderNodes(folders, { draftParentKey: null });
    expect(atTop.map(({ id }) => id)).toEqual(['fruit', 'vegetables', folderDraftKey]);
    const underRoot = buildFolderNodes(folders, { rootLabel: 'All', draftParentKey: null });
    expect(underRoot[0]?.children?.at(-1)?.id).toBe(folderDraftKey);
  });

  it('UIC-FOLDER-MANAGER-2.7 finds a folder path and measures how deep a folder reaches', () => {
    expect(findFolderPath(folders, 'lemons').map(({ id }) => id)).toEqual([
      'fruit',
      'citrus',
      'lemons',
    ]);
    expect(findFolderPath(folders, 'missing')).toEqual([]);
    expect(findFolderPath(folders, null)).toEqual([]);
    expect(getFolderHeight(folders[0] as FolderItem)).toBe(3);
    expect(getFolderHeight(folders[1] as FolderItem)).toBe(1);
  });

  it('UIC-FOLDER-MANAGER-5.1 marks folders whose subfolders are not loaded yet', () => {
    const nodes = buildFolderNodes(
      [
        { id: 'pantry', name: 'Pantry', hasChildren: true },
        {
          id: 'cellar',
          name: 'Cellar',
          hasChildren: true,
          children: [{ id: 'wine', name: 'Wine' }],
        },
      ],
      {},
    );
    expect(nodes.map(({ id, isLazy }) => [id, isLazy])).toEqual([
      ['pantry', true],
      ['cellar', false],
    ]);
  });

  it('UIC-FOLDER-MANAGER-6.2 lists the topmost selected folders and where they may move', () => {
    const keys = new Set(['citrus', 'lemons', 'vegetables']);
    expect(listTopmostFolders(folders, keys).map(({ id }) => id)).toEqual(['citrus', 'vegetables']);
    const destinations = listFolderDestinations(folders, new Set(['citrus']));
    expect(destinations.map(({ folder, path }) => [folder?.id ?? null, path])).toEqual([
      [null, []],
      ['fruit', ['Fruit']],
      ['vegetables', ['Vegetables']],
    ]);
  });

  it('UIC-FOLDER-MANAGER-6.3 plans the moves that put folders into a destination in their order', () => {
    const citrus = folders[0]?.children?.[0] as FolderItem;
    const vegetables = folders[1] as FolderItem;
    const lemons = citrus.children?.[0] as FolderItem;
    expect(planFolderMoves(folders, [lemons, vegetables], citrus)).toEqual([
      { key: 'vegetables', targetKey: 'citrus', position: 'inside' },
    ]);
    expect(planFolderMoves(folders, [citrus, lemons], null)).toEqual([
      { key: 'citrus', targetKey: 'vegetables', position: 'after' },
      { key: 'lemons', targetKey: 'citrus', position: 'after' },
    ]);
    expect(planFolderMoves(folders, [vegetables], null)).toEqual([]);
  });

  it('UIC-FOLDER-MANAGER-6.3 plans a large selection without searching for each folder again', () => {
    let reads = 0;
    const children = Array.from({ length: 1_000 }, (_, index) => ({
      get id() {
        reads += 1;
        return index;
      },
      name: String(index),
    }));
    const source: FolderItem = { id: 'source', name: 'Source', children };
    const destination: FolderItem = { id: 'destination', name: 'Destination' };
    const moves = planFolderMoves([source, destination], children, destination);
    expect(reads).toBeLessThanOrEqual(children.length * 5);
    expect(moves).toEqual(
      children.map((_, key) => ({ key, targetKey: 'destination', position: 'inside' })),
    );
  });

  it('UIC-FOLDER-MANAGER-6.3 skips reading the tree when no folders move', () => {
    const folders = [
      {
        get id(): string {
          throw new Error('No folder should be read');
        },
        name: 'Folder',
      },
    ];
    expect(planFolderMoves(folders, [], null)).toEqual([]);
  });

  it('UIC-FOLDER-MANAGER-6.3 searches past a deeply nested branch without a call stack limit', () => {
    let branch: FolderItem = { id: 'leaf', name: 'Leaf' };
    for (let index = 0; index < 20_000; index += 1) {
      branch = { id: `branch-${index}`, name: 'Branch', children: [branch] };
    }
    const source = { id: 'source', name: 'Source' };
    const destination = { id: 'destination', name: 'Destination' };
    expect(planFolderMoves([branch, source, destination], [source], destination)).toEqual([
      { key: 'source', targetKey: 'destination', position: 'inside' },
    ]);
  });

  it('UIC-FOLDER-MANAGER-7.1 keeps the folders that match every term, with their ancestors', () => {
    const names = (terms: string[]) => {
      const visit = (nodes: ReturnType<typeof buildFolderNodes>): string[] =>
        nodes.flatMap((node) => [node.name, ...visit(node.children ?? [])]);
      return visit(buildFolderNodes(folders, { terms }));
    };
    expect(names(['lem'])).toEqual(['Fruit', 'Citrus', 'Lemons']);
    expect(names(['veg'])).toEqual(['Vegetables']);
    expect(names(['plum'])).toEqual([]);
    expect(names([])).toHaveLength(4);
  });
  it('UIC-FOLDER-MANAGER-2.7 measures a wide folder without argument limits', () => {
    const children = Array.from({ length: 200_000 }, (_, id) => ({ id, name: String(id) }));
    expect(getFolderHeight({ id: 'root', name: 'Root', children })).toBe(2);
  });

  it('UIC-FOLDER-MANAGER-8.1 prepares deep folders, paths, selections and filtered draft rows', () => {
    const root = createFolderChain(20_000);
    const nodes = buildFolderNodes([root], {
      rootLabel: 'All',
      terms: ['leaf'],
      draftParentKey: 20_000,
    });
    const path = findFolderPath([root], 20_000);
    expect(path).toHaveLength(20_001);
    expect(getFolderHeight(root)).toBe(20_001);
    expect(collectBranchKeys(nodes)).toHaveLength(20_002);
    let leaf = nodes[0];
    while (leaf?.children?.[0] && leaf.id !== 20_000) leaf = leaf.children[0];
    expect(leaf?.folder).toBe(path.at(-1));
    expect(leaf?.children?.[0]?.id).toBe(folderDraftKey);
    expect(listTopmostFolders([root], new Set([20_000]))[0]).toBe(path.at(-1));
  });

  it('UIC-FOLDER-MANAGER-6.3 lists deep destination paths without a call stack limit', () => {
    const destinations = listFolderDestinations([createFolderChain(2_000)], new Set());
    expect(destinations).toHaveLength(2_002);
    expect(destinations[0]).toEqual({ folder: null, path: [] });
    expect(destinations.at(-1)?.folder?.id).toBe(2_000);
    expect(destinations.at(-1)?.path).toHaveLength(2_001);
    expect(destinations.at(-1)?.path.at(-1)).toBe('Leaf');
  });
});
