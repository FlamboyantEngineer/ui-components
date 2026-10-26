import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { createJsonCodec } from '../../utils/json-codec.js';
import { isKey } from '../../utils/is-key.js';

/** The panel state a `persistKey` saves: each value the caller does not control. */
export interface DockPanelStoredState {
  selectedKey?: Key | undefined;
  isExpanded?: boolean | undefined;
  size?: number | undefined;
}

export interface DockPanelStateOptions {
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

function isSize(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Reads a stored panel state, refusing anything that is not one so the defaults apply. */
const storedStateCodec = createJsonCodec((value): DockPanelStoredState => {
  if (typeof value !== 'object' || value === null) throw new Error('Not a panel state');
  const { selectedKey, isExpanded, size } = value as Record<string, unknown>;
  return {
    selectedKey: isKey(selectedKey) ? selectedKey : undefined,
    isExpanded: typeof isExpanded === 'boolean' ? isExpanded : undefined,
    size: isSize(size) ? size : undefined,
  };
});

/** The first candidate that names an enabled pane, else the first enabled pane. */
function resolveSelectedKey(candidates: readonly unknown[], enabledKeys: readonly Key[]) {
  const match = candidates.find((key) => isKey(key) && enabledKeys.includes(key));
  return isKey(match) ? match : (enabledKeys[0] ?? null);
}

/**
 * The selected pane, the expanded state and the size of an dock panel, each controlled or held by
 * the panel, which restores and saves the values it holds under `persistKey`.
 */
export function useDockPanelState(options: DockPanelStateOptions): DockPanelState {
  const { enabledKeys, onSelectionChange, onExpandedChange, onSizeChange } = options;
  const [stored, setStored] = usePersistentState<DockPanelStoredState>(
    options.persistKey,
    {},
    storedStateCodec,
  );
  const [liveSize, setLiveSize] = useState<number | null>(null);
  const isSizeControlled = options.size !== undefined;
  const store = (patch: DockPanelStoredState) => setStored((current) => ({ ...current, ...patch }));
  const rawSize = options.size ?? liveSize ?? stored.size ?? options.defaultSize;

  return {
    selectedKey: resolveSelectedKey(
      [options.selectedKey, stored.selectedKey, options.defaultSelectedKey],
      enabledKeys,
    ),
    setSelectedKey(key) {
      if (options.selectedKey === undefined) store({ selectedKey: key });
      onSelectionChange?.(key);
    },
    isExpanded: options.isExpanded ?? stored.isExpanded ?? options.defaultExpanded,
    setExpanded(isExpanded) {
      if (options.isExpanded === undefined) store({ isExpanded });
      onExpandedChange?.(isExpanded);
    },
    size: clamp(rawSize, options.minSize, options.maxSize),
    changeSize(size) {
      if (!isSizeControlled) setLiveSize(size);
      onSizeChange?.(size);
    },
    commitSize(size) {
      if (isSizeControlled) return;
      setLiveSize(null);
      store({ size });
    },
  };
}
