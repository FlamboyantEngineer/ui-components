'use client';

import { useContext, useEffect, useRef, type DOMAttributes, type ReactNode } from 'react';
import { FocusableContext, getInteractionModality } from '../primitives/index.js';

/**
 * A first pointer enter precedes the move that tells React Aria the input is a pointer. Hold that
 * start until the real move, so its hover hook owns both the start and the safe-area closing.
 * An enter caused by layout or keyboard navigation alone never starts a hover.
 */
export function usePointerEntry<P extends DOMAttributes<Element>>(props: P, isDisabled = false): P {
  const isPending = useRef(false);
  useEffect(() => {
    if (isDisabled) isPending.current = false;
    return () => {
      isPending.current = false;
    };
  }, [isDisabled]);
  return {
    ...props,
    onPointerEnter(event) {
      if (!isDisabled && event.pointerType !== 'touch' && getInteractionModality() !== 'pointer') {
        isPending.current = true;
        return;
      }
      isPending.current = false;
      props.onPointerEnter?.(event);
    },
    onPointerMove(event) {
      if (
        isPending.current &&
        !isDisabled &&
        event.pointerType !== 'touch' &&
        event.currentTarget.isConnected &&
        getInteractionModality() === 'pointer'
      ) {
        isPending.current = false;
        props.onPointerEnter?.(event);
      }
      props.onPointerMove?.(event);
    },
    onPointerLeave(event) {
      isPending.current = false;
      props.onPointerLeave?.(event);
    },
    onBlur(event) {
      isPending.current = false;
      props.onBlur?.(event);
    },
  };
}

/** Continues only the enclosing trigger's hover props; the child's own callbacks stay its own. */
export function PointerEntry({
  children,
  isDisabled = false,
}: {
  children: ReactNode;
  isDisabled?: boolean | undefined;
}) {
  const context = useContext(FocusableContext);
  const props = usePointerEntry(context ?? {}, isDisabled);
  return <FocusableContext value={context ? props : null}>{children}</FocusableContext>;
}
