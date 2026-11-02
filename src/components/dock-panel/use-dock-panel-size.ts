'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useUiStorage } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { numberCodec } from '../../utils/json-codec.js';
import { getOwnerWindow } from '../../utils/owner-window.js';
import { useOwnedPreview } from '../../utils/use-owned-preview.js';
import { usePersistedValue } from '../../utils/use-persisted-value.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';

export interface DockPanelSizeOptions {
  /** The panel's element, whose window runs the preview frames. */
  rootRef: RefObject<HTMLElement | null>;
  size?: number | undefined;
  defaultSize: number;
  onSizeChange?: ((size: number) => void) | undefined;
  onSizeChangeEnd?: ((size: number) => void) | undefined;
  onSizeChangeCancel?: (() => void) | undefined;
  minSize: number;
  maxSize: number;
  /** Storage key of the uncontrolled size, if it persists. */
  persistKey: string | undefined;
  /** Whether the panel shows its pane; a size change while it does not expands it. */
  isExpanded: boolean;
  setExpanded: (isExpanded: boolean) => void;
}

export interface DockPanelSize {
  /** The expanded size, within the bounds; collapsed, the size expanding resumes. */
  size: number;
  /** A size during a drag or a key step, previewed at most once per frame. */
  changeSize: (size: number) => void;
  /** The size after a drag or a key step: the final preview, then one end. */
  commitSize: (size: number) => void;
  /** Drops the preview of a drag abandoned without an end, and a collapse it undid. */
  cancelSize: () => void;
  /**
   * Changes with the persist key, the storage and the bounds: a drag or a live size taken for
   * another owner is dropped, never committed.
   */
  sizeOwner: object;
}

interface Gesture {
  /** The latest size not previewed yet, and the frame that will preview it. */
  pending: { size: number; cancel: () => void } | null;
  /** The last size previewed, so the end does not preview it again. */
  shown: number | null;
  /** The gesture expanded a collapsed panel, which its cancellation collapses again. */
  expanded: boolean;
}

const idle = (): Gesture => ({ pending: null, shown: null, expanded: false });

/**
 * The panel's size, controlled or held by the panel (and saved under `persistKey`). Pointer and key
 * input preview it at most once per animation frame; the end flushes the final size and reports
 * it once; a cancellation drops the preview. Any change while collapsed expands the panel first, so
 * one gesture on the collapsed separator expands and resizes it.
 */
export function useDockPanelSize(options: DockPanelSizeOptions): DockPanelSize {
  const { rootRef, minSize, maxSize, isExpanded, setExpanded } = options;
  const [committed, commit] = usePersistedValue({
    value: options.size,
    defaultValue: options.defaultSize,
    persistKey: options.persistKey,
    codec: numberCodec,
  });
  const sizeOwner = useShallowStable({
    persistKey: options.persistKey,
    storage: useUiStorage(),
    minSize,
    maxSize,
  });
  const [live, setLive] = useOwnedPreview<number>(sizeOwner);
  const gesture = useRef(idle());
  const isControlled = options.size !== undefined;
  useEffect(() => () => gesture.current.pending?.cancel(), []);

  const preview = (size: number) => {
    gesture.current.shown = size;
    if (!isControlled) setLive(size);
    options.onSizeChange?.(size);
  };
  const flush = () => {
    const { pending } = gesture.current;
    if (!pending) return;
    pending.cancel();
    gesture.current.pending = null;
    preview(pending.size);
  };
  return {
    size: clamp(options.size ?? live ?? committed, minSize, maxSize),
    changeSize(size) {
      if (!isExpanded && !gesture.current.expanded) {
        gesture.current.expanded = true;
        setExpanded(true);
      }
      const current = gesture.current;
      if (current.pending) {
        current.pending.size = size;
        return;
      }
      const view = getOwnerWindow(rootRef.current);
      const id = view.requestAnimationFrame(flush);
      current.pending = { size, cancel: () => view.cancelAnimationFrame(id) };
    },
    commitSize(size) {
      flush();
      const { shown } = gesture.current;
      gesture.current = idle();
      // A press that never moved changes nothing, and leaves a collapsed panel collapsed.
      if (shown === null && !isExpanded) return;
      if (shown !== size) preview(size);
      if (!isControlled) {
        setLive(null);
        commit(size);
      }
      options.onSizeChangeEnd?.(size);
    },
    cancelSize() {
      const { pending, expanded } = gesture.current;
      pending?.cancel();
      gesture.current = idle();
      setLive(null);
      if (expanded) setExpanded(false);
      options.onSizeChangeCancel?.();
    },
    sizeOwner,
  };
}
