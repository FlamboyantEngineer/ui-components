import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { toFolderRowKey, type FolderItem, type FolderNode } from './folder-model.js';
import { useFolderExpansion } from './use-folder-tree.js';

describe('folder expansion', () => {
  it('UIC-FOLDER-MANAGER-5.1 checks many opened lazy folders without searching each key again', () => {
    let reads = 0;
    const nodes: FolderNode<FolderItem>[] = Array.from({ length: 1_000 }, (_, id) => ({
      get id() {
        reads += 1;
        return toFolderRowKey(id);
      },
      name: String(id),
      kind: 'folder',
      folder: { id, name: String(id) },
      isLazy: true,
    }));
    const keys = new Set(nodes.map((_, id) => toFolderRowKey(id)));
    const onOpen = vi.fn();
    const { result } = renderHook(() => useFolderExpansion(nodes, onOpen));
    reads = 0;
    act(() => result.current.onExpandedChange(keys));
    expect(reads).toBeLessThanOrEqual(nodes.length * 3);
    expect(result.current.expandedKeys).toEqual([...keys]);
    expect(onOpen).toHaveBeenCalledTimes(nodes.length);
    expect(onOpen).toHaveBeenLastCalledWith(nodes.length - 1);
    act(() => result.current.onExpandedChange(keys));
    expect(onOpen).toHaveBeenCalledTimes(nodes.length);
  });

  it('UIC-FOLDER-MANAGER-7.1 reveals many collapsed branches using one membership pass', () => {
    const nodes: FolderNode<FolderItem>[] = Array.from({ length: 1_000 }, (_, id) => ({
      id,
      name: String(id),
      kind: 'folder',
      folder: { id, name: String(id) },
      isLazy: false,
      children: [],
    }));
    const { result } = renderHook(() => useFolderExpansion(nodes, vi.fn()));
    act(() => result.current.onExpandedChange(new Set()));
    expect(result.current.expandedKeys).toEqual([]);
    let reads = 0;
    const keys = new Proxy(
      nodes.map((_, id) => id),
      {
        get(target, property, receiver) {
          if (typeof property === 'string' && /^\d+$/.test(property)) reads += 1;
          return Reflect.get(target, property, receiver);
        },
      },
    );
    act(() => result.current.reveal(keys));
    expect(reads).toBeLessThanOrEqual(nodes.length * 2);
    expect(result.current.expandedKeys).toHaveLength(nodes.length);
  });
});
