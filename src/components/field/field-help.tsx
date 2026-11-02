'use client';

// The field's help: the help button, the content describing it, and the tooltip the context
// menu's Help opens.

import { useEffect, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { findOwnerDocument } from '../../utils/owner-window.js';
import { AnchoredTooltip } from '../tooltip/tooltip.js';
import type { ControlSize } from '../../core/props.js';
import { FieldHelp, fieldHooks } from './field-parts.js';

export interface FieldHelpTooltip {
  isOpen: boolean;
  open: () => void;
  /** Captured on the field root: Escape hides the tooltip and goes no further. */
  onKeyDownCapture: (event: KeyboardEvent) => void;
}

/**
 * Whether the help tooltip the menu's Help opened is showing: it stays through the menu's focus
 * return, and hides on Escape, a press anywhere, focus leaving the field, the field being disabled
 * or the help going away.
 */
export function useFieldHelpTooltip(
  options: { hasHelp: boolean; isFocused: boolean; isDisabled: boolean },
  getRoot: () => Element | null,
): FieldHelpTooltip {
  const [isRequested, setRequested] = useState(false);
  const isOpen = isRequested && options.hasHelp && options.isFocused && !options.isDisabled;
  if (isRequested && !isOpen && (!options.hasHelp || options.isDisabled)) setRequested(false);
  useEffect(() => {
    const owner = findOwnerDocument(getRoot());
    if (!isOpen || !owner) return undefined;
    const close = () => setRequested(false);
    owner.addEventListener('pointerdown', close, true);
    return () => owner.removeEventListener('pointerdown', close, true);
  }, [isOpen, getRoot]);
  return {
    isOpen,
    // Asked from the menu, whose focus returns to the field after the action.
    open: () => setRequested(true),
    onKeyDownCapture(event) {
      if (!isRequested) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.key !== 'Shift' && event.key !== 'Control' && event.key !== 'Alt') {
        setRequested(false);
      }
    },
  };
}

/**
 * The field's help: the help button with its own tooltip, unless `showButton` is false, and the
 * hidden content the button, or else the control, is described by; and the tooltip the menu's Help
 * opens against the button, or the control without one.
 */
export function FieldHelpParts({
  help,
  label,
  size,
  showButton,
  tooltip,
  controlSlot,
  getRoot,
}: {
  help: { id: string; content: ReactNode };
  label: string;
  size: ControlSize;
  showButton: boolean;
  tooltip: FieldHelpTooltip;
  controlSlot: RefObject<Element | null>;
  getRoot: () => Element | null;
}) {
  // The help button, found in the root when the tooltip opens: the button takes no ref.
  const [buttonRef] = useState(() => ({
    get current() {
      return getRoot()?.querySelector(`:scope > .${fieldHooks.slotClass('help')}`) ?? null;
    },
  }));
  return (
    <>
      {showButton ? (
        <FieldHelp id={help.id} label={label} size={size}>
          {help.content}
        </FieldHelp>
      ) : (
        <span id={help.id} hidden>
          {help.content}
        </span>
      )}
      <AnchoredTooltip
        isOpen={tooltip.isOpen}
        anchor={showButton ? buttonRef : controlSlot}
        content={help.content}
        variant="info"
        placement={showButton ? 'top' : 'bottom'}
        relationship="none"
        className={fieldHooks.slotClass('help-tooltip')}
      />
    </>
  );
}
