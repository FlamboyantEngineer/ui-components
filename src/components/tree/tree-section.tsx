'use client';

import { useCallback, type ReactElement } from 'react';
import { Collection, TreeHeader, TreeSection } from '../../primitives/index.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeItemData } from './tree-props.js';
import type { TreeShownSection } from './use-tree-model.js';

/**
 * Draws a category section: React Aria's row group, named by its heading row, which the keyboard
 * and selection pass over, then the section's rows at the top level of the tree.
 */
function useTreeSectionRenderer<T extends TreeItemData>(
  renderItem: (item: T) => ReactElement,
): (shown: TreeShownSection<T>) => ReactElement {
  return useCallback(
    (shown: TreeShownSection<T>) => (
      <TreeSection id={shown.id} className={hooks.slotClass('section')}>
        <TreeHeader className={hooks.slotClass('section-header')}>{shown.section.label}</TreeHeader>
        <Collection items={shown.items} dependencies={[renderItem]}>
          {renderItem}
        </Collection>
      </TreeSection>
    ),
    [renderItem],
  );
}

/** The tree's collection children: its rows, or its loose rows and then its sections. */
export function useTreeChildren<T extends TreeItemData>(
  shown: { loose: readonly T[]; sections: readonly TreeShownSection<T>[] } | null,
  renderItem: (item: T) => ReactElement,
  dependencies: readonly unknown[],
) {
  const renderSection = useTreeSectionRenderer(renderItem);
  if (!shown) return renderItem;
  return (
    <>
      <Collection items={shown.loose} dependencies={dependencies}>
        {renderItem}
      </Collection>
      <Collection items={shown.sections} dependencies={dependencies}>
        {renderSection}
      </Collection>
    </>
  );
}
