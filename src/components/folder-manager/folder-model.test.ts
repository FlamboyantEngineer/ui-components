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
});
