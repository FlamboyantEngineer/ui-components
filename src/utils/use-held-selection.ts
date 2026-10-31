'use client';

import { useState } from 'react';
import type { SelectionProps } from '../core/events.js';
import type { Key, Selection } from '../core/props.js';

/**
 * A collection's selection, held here while uncontrolled. A collection that mounts React Aria's
 * list afresh (to virtualize, or to change layout) would otherwise start again from
 * `defaultSelectedKeys` and lose the reader's picks without reporting a change.
 */
export function useHeldSelection({
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
}: Pick<SelectionProps, 'selectedKeys' | 'defaultSelectedKeys' | 'onSelectionChange'>) {
  const [own, setOwn] = useState<Iterable<Key> | 'all'>(() => defaultSelectedKeys ?? []);
  const isControlled = selectedKeys !== undefined;
  return {
    selectedKeys: isControlled ? selectedKeys : own,
    onSelectionChange(keys: Selection) {
      if (!isControlled) setOwn(keys);
      onSelectionChange?.(keys);
    },
  };
}
