'use client';

import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import {
  FocusScope as AriaFocusScope,
  useFocusManager as useAriaFocusManager,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { resolveFocusTarget, useFocusReturn, type FocusTarget } from '../../utils/focus-target.js';
import { mergeRefs } from '../../utils/merge-props.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type FocusScopeTarget = FocusTarget;

/** An element focus can move to. */
export type FocusableElement = Element & HTMLOrSVGElement;

/** How a focus manager picks the element it moves focus to. */
export interface FocusManagerOptions {
  /** The element to start from. Defaults to the focused element. */
  from?: Element | undefined;
  /** Considers only tabbable elements instead of every focusable one. */
  tabbable?: boolean | undefined;
  /** Wraps around at the ends of the scope. */
  wrap?: boolean | undefined;
  /** Skips the elements this returns `false` for. */
  accept?: ((node: Element) => boolean) | undefined;
}

/** Moves focus within the nearest `FocusScope`. Each method returns the element it focused. */
export interface FocusManager {
  focusNext(options?: FocusManagerOptions): FocusableElement | null;
  focusPrevious(options?: FocusManagerOptions): FocusableElement | null;
  focusFirst(options?: FocusManagerOptions): FocusableElement | null;
  focusLast(options?: FocusManagerOptions): FocusableElement | null;
}

export interface FocusScopeProps
  extends Omit<ContainerProps<'div'>, 'children' | 'autoFocus'>, BaseProps {
  /** The content whose focus the scope manages. */
  children?: ReactNode;
  /** Keeps Tab and Shift+Tab inside the scope while set. */
  contain?: boolean | undefined;
  /** Returns focus on unmount to the element focused when the scope mounted. */
  restoreFocus?: boolean | undefined;
  /** Focuses the first tabbable element inside on mount, unless focus is already inside. */
  autoFocus?: boolean | undefined;
  /** An element inside the scope to focus on mount, ahead of `autoFocus`'s first tabbable element. */
  initialFocus?: FocusScopeTarget | undefined;
  /** Where focus goes on unmount, instead of the element focused when the scope mounted. */
  finalFocus?: FocusScopeTarget | undefined;
}

const hooks = createHooks('focus-scope');

interface FocusTargetsProps extends Pick<FocusScopeProps, 'initialFocus' | 'finalFocus'> {
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Moves focus to the caller's targets. It renders inside the building block's scope, after the root, so
 * its mount effect runs before the scope's `autoFocus` (which then finds focus inside) and its
 * unmount cleanup after the scope has stopped containing focus (which would pull focus back).
 */
function FocusTargets({ containerRef, initialFocus, finalFocus }: FocusTargetsProps) {
  const initialRef = useRef(initialFocus);
  useEffect(() => {
    resolveFocusTarget(initialRef.current)?.focus();
  }, []);
  useFocusReturn({ containerRef, finalFocus, fallback: null });
  return null;
}

/**
 * A region that manages focus for its content: it can keep Tab and
 * Shift+Tab inside (`contain`, which may switch on and off while mounted), focus an element on
 * mount (`autoFocus`, `initialFocus`) and return focus on unmount (`restoreFocus`, `finalFocus`).
 * `useFocusManager` moves focus within it.
 */
export function FocusScope({
  contain = false,
  restoreFocus = false,
  autoFocus = false,
  initialFocus,
  finalFocus,
  className,
  children,
  ref,
  ...rest
}: FocusScopeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);
  return (
    <AriaFocusScope contain={contain} restoreFocus={restoreFocus} autoFocus={autoFocus}>
      <div {...rest} {...hooks.root({ className, props: rest, data: { contain } })} ref={mergedRef}>
        {children}
      </div>
      <FocusTargets containerRef={rootRef} initialFocus={initialFocus} finalFocus={finalFocus} />
    </AriaFocusScope>
  );
}

/** The focus manager of the nearest `FocusScope`, or `undefined` outside any scope. */
export function useFocusManager(): FocusManager | undefined {
  return useAriaFocusManager();
}
