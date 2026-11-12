'use client';

// The composer's bottom row of controls: what the controls read from the composer, and when the row
// is too narrow for their labels (specs/MESSAGE-COMPOSER.md, UIC-MESSAGE-COMPOSER-6).

import {
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLatest } from '../../utils/use-latest.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { useShallowStable } from '../../utils/use-shallow-stable.js';
import type { ShortcutChord } from '../shortcut/shortcut.js';
import type { ComposerFrameModel } from './composer-frame.js';
import type { MessageComposerMenuSection } from './composer-menu.js';
import type { MessageComposerSharedProps } from './message-composer.js';

/**
 * How long a sent message may wait for the host before the action button shows that it waits, so a
 * quick acceptance never flashes a spinner.
 */
export const composerSubmittingDelay = 400;

/** What a control in a composer's row reads from the composer. */
export interface MessageComposerControls {
  /** The row is too narrow for the controls' labels: controls show their icon alone. */
  isCompact: boolean;
  /** The composer is disabled: controls refuse interaction with it. */
  isDisabled: boolean;
}

/** What the composer's actions do, each keeping its identity while the composer renders. */
type ComposerControlActions = Pick<
  ComposerFrameModel,
  'submit' | 'insertText' | 'insertPill' | 'focusInput'
> &
  Pick<MessageComposerSharedProps, 'onAttach' | 'onCancel' | 'onStop'>;

/**
 * What the built-in controls need from the composer around them: flags, the first sending chord and
 * actions that keep their identity, so typing re-renders no control until one of them changes.
 */
export interface ComposerControlsValue extends MessageComposerControls, ComposerControlActions {
  isEditing: boolean;
  canSubmit: boolean;
  /** A sent message waits for the host to accept it. */
  isSubmitting: boolean;
  /** A reply is on its way. */
  isPending: boolean;
  /** The composer sends while a reply is on its way. */
  allowsPendingSubmit: boolean;
  /** The chord that sends, shown on the send button. */
  submitShortcut: ShortcutChord | undefined;
  /** The composer's root, which its menus open against. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Tells the composer that the host placed the send button, so it adds none; returns the undo. */
  registerSendButton: () => () => void;
  /** Sections every menu button shows after its own. */
  menuSections: readonly MessageComposerMenuSection[];
  /** Tells the composer that the host placed a menu button, so it adds none; returns the undo. */
  registerMenuButton: () => () => void;
}

/**
 * The actions of the latest render: the composer's own always, and the host's `onAttach`,
 * `onCancel` and `onStop` while it passes them.
 */
function useControlActions(
  props: MessageComposerSharedProps,
  model: ComposerFrameModel,
): ComposerControlActions {
  const latest = useLatest({ props, model });
  const hasAttach = props.onAttach !== undefined;
  const hasCancel = props.onCancel !== undefined;
  const hasStop = props.onStop !== undefined;
  return useMemo(
    () => ({
      submit: () => latest.current.model.submit(),
      insertText: (text: string) => latest.current.model.insertText(text),
      insertPill: (pill: Parameters<ComposerFrameModel['insertPill']>[0]) =>
        latest.current.model.insertPill(pill),
      focusInput: () => latest.current.model.focusInput(),
      onAttach: hasAttach ? (files: File[]) => latest.current.props.onAttach?.(files) : undefined,
      onCancel: hasCancel ? () => latest.current.props.onCancel?.() : undefined,
      onStop: hasStop ? () => latest.current.props.onStop?.() : undefined,
    }),
    [hasAttach, hasCancel, hasStop, latest],
  );
}

/** The value the composer gives its controls, which keeps its identity while what they show does. */
export function useComposerControls({
  props,
  model,
  ...rest
}: Pick<
  ComposerControlsValue,
  'rootRef' | 'isCompact' | 'isDisabled' | 'registerSendButton' | 'registerMenuButton'
> & {
  props: MessageComposerSharedProps;
  model: ComposerFrameModel;
}): ComposerControlsValue {
  const actions = useControlActions(props, model);
  return useShallowStable({
    ...actions,
    ...rest,
    isEditing: model.isEditing,
    canSubmit: model.canSubmit,
    isSubmitting: model.isSubmitting,
    isPending: Boolean(props.isPending),
    allowsPendingSubmit: Boolean(props.allowsPendingSubmit),
    submitShortcut: model.keys.submit[0],
    menuSections: props.menuSections ?? noSections,
  });
}

const noSections: readonly MessageComposerMenuSection[] = [];

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
  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setFullWidth((width) => {
      if (width === null) return row.scrollWidth > row.clientWidth ? row.scrollWidth : null;
      return row.clientWidth >= width ? null : width;
    });
  }, [rowRef]);
  // The row and the groups, which resize with their controls and may outgrow a row that keeps its
  // width, report every change of size; the first measure is at mount.
  useResizeObserver([rowRef, ...groupRefs], measure);
  useLayoutEffect(measure, [measure]);
  return fullWidth !== null;
}

/** Counts the controls of a kind the host placed: the composer adds its own while there is none. */
export function useControlRegistry() {
  const [count, setCount] = useState(0);
  const register = useCallback(() => {
    setCount((current) => current + 1);
    return () => setCount((current) => current - 1);
  }, []);
  return { hasHostControl: count > 0, register };
}
