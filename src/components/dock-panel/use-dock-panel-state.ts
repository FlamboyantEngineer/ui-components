'use client';

import type { RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { booleanCodec, keyCodec } from '../../utils/json-codec.js';
import { isKey } from '../../utils/is-key.js';
import { usePersistedValue } from '../../utils/use-persisted-value.js';
import { useRetainedKey } from '../../utils/use-retained-key.js';
import { useDockPanelSize, type DockPanelSize } from './use-dock-panel-size.js';

interface DockPanelStateOptions {
  rootRef: RefObject<HTMLElement | null>;
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
  onSizeChangeEnd?: ((size: number) => void) | undefined;
  onSizeChangeCancel?: (() => void) | undefined;
  /** The size bounds, in pixels. */
  minSize: number;
  maxSize: number;
  persistKey?: string | undefined;
}

export interface DockPanelState extends DockPanelSize {
  /** The selected pane, kept while the panel is collapsed; `null` without an enabled pane. */
  selectedKey: Key | null;
  setSelectedKey: (key: Key) => void;
  isExpanded: boolean;
  setExpanded: (isExpanded: boolean) => void;
}

/** The first candidate that names an enabled pane. */
function findEnabledKey(candidates: readonly unknown[], enabledKeys: readonly Key[]) {
  const match = candidates.find((key) => isKey(key) && enabledKeys.includes(key));
  return isKey(match) ? match : null;
}

/** The storage key of one persisted value: `<persistKey>:<name>`. */
function toValueKey(persistKey: string | undefined, name: string) {
  return persistKey === undefined ? undefined : `${persistKey}:${name}`;
}

/**
 * The selected pane, the expanded state and the size of an dock panel, each controlled or held by
 * the panel, which restores and saves the values it holds under `persistKey`. Selecting the pane
 * that is already selected changes nothing.
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
  // With no chosen pane, the pane shown first stays shown while it is enabled.
  const shownKey = useRetainedKey(
    findEnabledKey([selectedKey, options.defaultSelectedKey], enabledKeys),
    (key) => enabledKeys.includes(key),
    enabledKeys[0],
  );
  const size = useDockPanelSize({
    ...options,
    persistKey: toValueKey(persistKey, 'size'),
    isExpanded,
    setExpanded,
  });
  return {
    ...size,
    selectedKey: shownKey,
    setSelectedKey: (key) => {
      if (key !== shownKey) setSelectedKey(key);
    },
    isExpanded,
    setExpanded,
  };
}
