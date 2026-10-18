import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import {
  FocusScope as AriaFocusScope,
  type FocusScopeProps as AriaFocusScopeProps,
} from 'react-aria/FocusScope';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { resolveFocusTarget, useFocusReturn, type FocusTarget } from '../../utils/focus-target.js';
import { mergeRefs } from '../../utils/merge-props.js';

/** An element to focus: a ref, or a function asked for the element when focus moves. */
export type FocusScopeTarget = FocusTarget;

export interface FocusScopeProps
  extends
    Omit<AriaFocusScopeProps, 'children'>,
    Omit<NativeProps<'div'>, 'children' | 'autoFocus'>,
    BaseProps {
  /** The content whose focus the scope manages. */
  children?: ReactNode;
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
 * Moves focus to the caller's targets. It renders inside React Aria's scope, after the root, so
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
 * A region that manages focus for its content (React Aria `FocusScope`): it can keep Tab and
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

export { useFocusManager } from 'react-aria/FocusScope';
export type { FocusManager, FocusManagerOptions } from 'react-aria/FocusScope';
