'use client';

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { booleanCodec, keyCodec, numberCodec } from '../../utils/json-codec.js';
import { isKey } from '../../utils/is-key.js';
import { usePersistedValue } from '../../utils/use-persisted-value.js';

interface DockPanelStateOptions {
  /** The panes that can be selected, in order. */
  enabledKeys: readonly Key[];
  selectedKey?: Key | undefined;
  defaultSelectedKey?: Key | undefined;
  onSelectionChange?: ((key: Key) => void) | undefined;
  isExpanded?: boolean | undefined;
  defaultExpanded: boolean;
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  size?: number | undefined;
  defaultSize: number;
  onSizeChange?: ((size: number) => void) | undefined;
  /** The size bounds, in pixels. */
  minSize: number;
  maxSize: number;
  persistKey?: string | undefined;
}

export interface DockPanelState {
  /** The selected pane, kept while the panel is collapsed; `null` without an enabled pane. */
  selectedKey: Key | null;
  setSelectedKey: (key: Key) => void;
  isExpanded: boolean;
  setExpanded: (isExpanded: boolean) => void;
  /** The expanded size, within the bounds. */
  size: number;
  /** A size during a drag or a key step. */
  changeSize: (size: number) => void;
  /** The size after a drag or a key step, which a persisted panel saves. */
  commitSize: (size: number) => void;
}

/** The first candidate that names an enabled pane, else the first enabled pane. */
function resolveSelectedKey(candidates: readonly unknown[], enabledKeys: readonly Key[]) {
  const match = candidates.find((key) => isKey(key) && enabledKeys.includes(key));
  return isKey(match) ? match : (enabledKeys[0] ?? null);
}

/** The storage key of one persisted value: `<persistKey>:<name>`. */
function toValueKey(persistKey: string | undefined, name: string) {
  return persistKey === undefined ? undefined : `${persistKey}:${name}`;
}

/**
 * The selected pane, the expanded state and the size of a dock panel, each controlled or held by
 * the panel, which restores and saves the values it holds under `persistKey`.
 */
export function useDockPanelState(options: DockPanelStateOptions): DockPanelState {
  const { enabledKeys, onSelectionChange, persistKey } = options;
  const [selectedKey, setSelectedKey] = usePersistedValue<Key | null>({
    value: options.selectedKey,
    defaultValue: options.defaultSelectedKey ?? null,
    onChange:
      onSelectionChange &&
      ((key) => {
        if (key !== null) onSelectionChange(key);
      }),
    persistKey: toValueKey(persistKey, 'selected'),
    codec: keyCodec,
  });
  const [isExpanded, setExpanded] = usePersistedValue({
    value: options.isExpanded,
    defaultValue: options.defaultExpanded,
    onChange: options.onExpandedChange,
    persistKey: toValueKey(persistKey, 'expanded'),
    codec: booleanCodec,
  });
  const [committedSize, commitSize] = usePersistedValue({
    value: options.size,
    defaultValue: options.defaultSize,
    persistKey: toValueKey(persistKey, 'size'),
    codec: numberCodec,
  });
  const [liveSize, setLiveSize] = useState<number | null>(null);
  const isSizeControlled = options.size !== undefined;

  return {
    selectedKey: resolveSelectedKey([selectedKey, options.defaultSelectedKey], enabledKeys),
    setSelectedKey,
    isExpanded,
    setExpanded,
    size: clamp(options.size ?? liveSize ?? committedSize, options.minSize, options.maxSize),
    changeSize(size) {
      if (!isSizeControlled) setLiveSize(size);
      options.onSizeChange?.(size);
    },
    commitSize(size) {
      if (isSizeControlled) return;
      setLiveSize(null);
      commitSize(size);
    },
  };
}
