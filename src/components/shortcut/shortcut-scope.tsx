'use client';

import {
  createContext,
  type ReactNode,
  type RefObject,
  use,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { useLatest } from '../../utils/use-latest.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { usePortalContainer } from '../portal/portal.js';
import {
  formatAriaKeyShortcuts,
  type ShortcutChord,
  type ShortcutSequence,
} from './shortcut-format.js';
import {
  registerShortcut,
  type ShortcutRegistration,
  toShortcutSteps,
} from './shortcut-registry.js';
import { useDetectedPlatform } from './use-detected-platform.js';

export interface ShortcutScopeProps extends Omit<ContainerProps<'div'>, 'children'>, BaseProps {
  /** The content whose shortcuts the scope holds. */
  children?: ReactNode;
  /** Silences the shortcuts registered inside, nested scopes included. */
  isDisabled?: boolean | undefined;
}

export interface ShortcutOptions {
  /** Registers the shortcut without answering it. */
  isDisabled?: boolean | undefined;
  /** Answers anywhere in the document, even when registered inside a `ShortcutScope`. */
  isGlobal?: boolean | undefined;
  /** Answers in fields and editable content too, which otherwise keep their keys. */
  allowsEditable?: boolean | undefined;
  /** Answers a key held down, each repeat again. */
  allowsRepeat?: boolean | undefined;
  /** Answers a chord the browser keeps, such as `Ctrl+W` or `F5`. */
  allowsReserved?: boolean | undefined;
  /** How long, in milliseconds, a sequence awaits its next chord. Defaults to 1000. */
  sequenceTimeout?: number | undefined;
}

interface ScopeContextValue {
  ref: RefObject<HTMLDivElement | null>;
  isDisabled: boolean;
}

const ScopeContext = createContext<ScopeContextValue | null>(null);

const hooks = createHooks('shortcut-scope');

/**
 * A region of the page whose shortcuts (`useShortcut` inside it) answer only while focus is within
 * it, ahead of the shortcuts of the scopes around it and of the document. Scopes go by the
 * document's tree, so content portalled out of the scope is outside it unless it holds its own.
 */
export function ShortcutScope({
  isDisabled = false,
  className,
  children,
  ref,
  ...rest
}: ShortcutScopeProps) {
  const outer = use(ScopeContext);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const isSilenced = isDisabled || (outer?.isDisabled ?? false);
  const value = useMemo(() => ({ ref: rootRef, isDisabled: isSilenced }), [isSilenced]);
  return (
    <ScopeContext value={value}>
      <div
        {...rest}
        {...hooks.root({ className, props: rest, data: { disabled: isSilenced || undefined } })}
        ref={mergedRef}
      >
        {children}
      </div>
    </ScopeContext>
  );
}

/** The registration a shortcut's latest render holds, with its options' defaults. */
function toRegistration(input: {
  steps: ShortcutChord[];
  onPress: (event: KeyboardEvent) => void;
  scope: ScopeContextValue | null;
  options: ShortcutOptions;
}): ShortcutRegistration {
  const { steps, onPress, scope, options } = input;
  const isScoped = !options.isGlobal && scope !== null;
  return {
    steps,
    onPress,
    scope: isScoped ? scope.ref : null,
    isDisabled: (options.isDisabled ?? false) || (isScoped && scope.isDisabled),
    allowsEditable: options.allowsEditable ?? false,
    allowsRepeat: options.allowsRepeat ?? false,
    allowsReserved: options.allowsReserved ?? false,
    sequenceTimeout: options.sequenceTimeout ?? 1000,
  };
}

/**
 * Calls `onPress` when the chord, or each chord of a sequence in turn, is pressed where the
 * shortcut answers: within its `ShortcutScope` while focus is there, or anywhere in the document
 * outside one. One press answers one shortcut, and the latest callbacks and options always apply.
 * `null` registers nothing. Returns the `aria-keyshortcuts` value for the control it runs, for a
 * single chord.
 */
export function useShortcut(
  shortcut: ShortcutChord | ShortcutSequence | null,
  onPress: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {},
): { ariaKeyShortcuts: string | undefined } {
  const scope = use(ScopeContext);
  const container = usePortalContainer();
  const steps = shortcut === null ? [] : toShortcutSteps(shortcut);
  const keys = steps.map((step) => formatAriaKeyShortcuts(step));
  const identity = keys.join(' ');
  // The attribute renders in the server's notation until hydrated, as `Shortcut` draws its keys;
  // registration and matching use the real platform.
  const platform = useDetectedPlatform();
  const scopeRef = options.isGlobal ? null : (scope?.ref ?? null);
  const latest = useLatest(toRegistration({ steps, onPress, scope, options }));
  useEffect(() => {
    if (!identity) return undefined;
    const owner = getOwnerDocument(scopeRef?.current ?? container);
    return registerShortcut(owner, latest);
  }, [identity, latest, container, scopeRef]);
  const [single] = steps;
  return {
    ariaKeyShortcuts:
      steps.length === 1 && single ? formatAriaKeyShortcuts(single, platform) : undefined,
  };
}
