import { describe, expect, it } from 'vitest';
import {
  buildFolderNodes,
  collectBranchKeys,
  findFolderPath,
  folderDraftKey,
  folderRootKey,
  getFolderHeight,
  type FolderItem,
} from './folder-model.js';

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
});
