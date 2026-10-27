// The composer's bottom row of controls: what the controls read from the composer, and when the row
// is too narrow for their labels (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-6).

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import type { ComposerFrameModel } from './composer-frame.js';
import type { MessageComposerSharedProps } from './message-composer.js';

/** What a control in a composer's row reads from the composer. */
export interface MessageComposerControls {
  /** The row is too narrow for the controls' labels: controls show their icon alone. */
  isCompact: boolean;
  /** The composer is disabled: controls refuse interaction with it. */
  isDisabled: boolean;
}

/** What the built-in controls need from the composer around them. */
export interface ComposerControlsValue extends MessageComposerControls {
  props: MessageComposerSharedProps;
  model: ComposerFrameModel;
  /** The composer's root, which its menus open against. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Tells the composer that the host placed the send button, so it adds none; returns the undo. */
  registerSendButton: () => () => void;
}

/** Gives the composer's controls what they read. */
export const ComposerControlsContext = createContext<ComposerControlsValue | null>(null);

const outside: MessageComposerControls = { isCompact: false, isDisabled: false };

/** The composer around a built-in control, which works only inside one. */
export function useComposerControlsValue(control: string): ComposerControlsValue {
  const value = useContext(ComposerControlsContext);
  if (!value) throw new Error(`${control} must be placed in a message composer's controls.`);
  return value;
}

/**
 * Whether the composer the calling control sits in is compact or disabled, for a host's own control
 * that drops its label when the row is cramped. Outside a composer, neither.
 */
export function useMessageComposerControls(): MessageComposerControls {
  const value = useContext(ComposerControlsContext);
  return value ? { isCompact: value.isCompact, isDisabled: value.isDisabled } : outside;
}

/**
 * Whether the row is compact: it becomes so when its content is wider than it, and stays so until it
 * is again as wide as the content was then, so dropping the labels cannot undo itself.
 */
export function useCompactRow(
  rowRef: RefObject<HTMLElement | null>,
  groupRefs: readonly RefObject<HTMLElement | null>[],
): boolean {
  // The content's width when the row became compact; null while it is not.
  const [fullWidth, setFullWidth] = useState<number | null>(null);
  const measure = () => {
    const row = rowRef.current;
    if (!row) return;
    if (fullWidth === null) {
      if (row.scrollWidth > row.clientWidth) setFullWidth(row.scrollWidth);
    } else if (row.clientWidth >= fullWidth) {
      setFullWidth(null);
    }
  };
  // The groups resize with their controls, which may outgrow a row that keeps its width.
  useResizeObserver([rowRef, ...groupRefs], measure);
  useLayoutEffect(measure);
  return fullWidth !== null;
}

/** Counts the send buttons the host placed: the composer adds its own while there is none. */
export function useSendButtonRegistry() {
  const [count, setCount] = useState(0);
  const registerSendButton = useCallback(() => {
    setCount((current) => current + 1);
    return () => setCount((current) => current - 1);
  }, []);
  return { hasHostSendButton: count > 0, registerSendButton };
}
