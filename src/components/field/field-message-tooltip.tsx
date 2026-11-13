'use client';

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AnchoredTooltip } from '../tooltip/tooltip.js';
import { fieldHooks, severityOf } from './field-parts.js';
import type { FieldValidation } from './field-state.js';

/**
 * Where a field shows its validation message: `inline`, in a line below the control; `tooltip`,
 * in a tooltip against the control while the field is focused or hovered, so the message never
 * takes room or moves the layout.
 */
export type FieldMessageDisplay = 'inline' | 'tooltip';

/** How long the tooltip stays after the pointer leaves the field, so it can be reached. */
const hoverCloseDelay = 300;

interface FieldMessageTooltip {
  isOpen: boolean;
  /** Spread on the field root: hover shows the tooltip, Escape hides it until the field is left. */
  rootProps: {
    onPointerEnter: (event: PointerEvent) => void;
    onPointerLeave: (event: PointerEvent) => void;
  };
  onKeyDown: (event: KeyboardEvent) => void;
  /** Called when focus enters the field from outside it. */
  onEnter: () => void;
}

/**
 * The open state of a field's message tooltip: open while the field has a message and focus is in
 * it (a tap on touch focuses the control) or a mouse rests on it; Escape hides it until focus or
 * the pointer comes back, or the message changes.
 */
export function useFieldMessageTooltip(
  display: FieldMessageDisplay,
  message: string | null,
  isFocused: boolean,
): FieldMessageTooltip {
  const [isHovered, setIsHovered] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(closing.current), []);
  const isShown = display === 'tooltip' && message !== null && message !== dismissed;
  const isOpen = isShown && (isFocused || isHovered);
  return {
    isOpen,
    rootProps: {
      onPointerEnter(event) {
        if (event.pointerType === 'touch') return;
        clearTimeout(closing.current);
        if (!isHovered && !isFocused) setDismissed(null);
        setIsHovered(true);
      },
      onPointerLeave(event) {
        if (event.pointerType === 'touch') return;
        clearTimeout(closing.current);
        closing.current = setTimeout(() => setIsHovered(false), hoverCloseDelay);
      },
    },
    onKeyDown(event) {
      if (event.key === 'Escape' && isOpen) setDismissed(message);
    },
    onEnter() {
      setDismissed(null);
    },
  };
}

/**
 * The tooltip that shows a field's message against its control. The message region stays in the
 * field, describing the control and announcing changes, so the tooltip repeats it visually only.
 */
export function FieldMessageTooltip({
  isOpen,
  anchor,
  validation,
  children,
}: {
  isOpen: boolean;
  anchor: RefObject<Element | null>;
  validation: FieldValidation;
  children: ReactNode;
}) {
  const severity = severityOf(validation);
  return (
    <AnchoredTooltip
      isOpen={isOpen}
      anchor={anchor}
      content={children}
      placement="bottom"
      relationship="none"
      className={fieldHooks.slotClass('message-tooltip')}
      {...(severity ? { 'data-severity': severity } : {})}
    />
  );
}
