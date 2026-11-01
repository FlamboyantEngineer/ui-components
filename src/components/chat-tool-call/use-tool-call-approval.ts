'use client';

import { useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { isComposingKey } from '../../utils/is-composing-key.js';

interface ToolCallApprovalOptions {
  /** The call waits for the reader's decision. */
  isPending: boolean;
  onApprove?: (() => void) | undefined;
  onDeny?: ((reason?: string) => void) | undefined;
}

/** A pending approval's state: the deny reason form and the keys that drive it. */
export interface ToolCallApprovalState {
  /** The deny reason form shows in place of the buttons. */
  isDenying: boolean;
  /** The reason typed so far. */
  reason: string;
  setReason: (reason: string) => void;
  /** The Deny button, which Escape focuses and the closed form returns focus to. */
  denyRef: RefObject<HTMLButtonElement | null>;
  /** Deny: opens the reason form. */
  openDenyForm: () => void;
  /** Cancel: closes the form and returns focus to Deny. */
  closeDenyForm: () => void;
  /** Send: closes the form and reports the trimmed reason, or none for a blank one. */
  sendDenial: () => void;
  /** The card's capture-phase key handler. */
  onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void;
}

function isCommandEnter(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.altKey;
}

/**
 * The approval's state and keys. While the call waits for a decision and focus is in the card,
 * Ctrl+Enter or Cmd+Enter approves (or sends the denial while its form is open) and Escape
 * focuses Deny (or cancels the open form). The keys are caught before the focused control sees
 * them, so a focused button is not pressed too; Escape on Deny itself goes on to the page.
 */
export function useToolCallApproval({
  isPending,
  onApprove,
  onDeny,
}: ToolCallApprovalOptions): ToolCallApprovalState {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const denyRef = useRef<HTMLButtonElement>(null);
  const requestFocus = useFocusRequest();
  // A decision made elsewhere closes the form and forgets its reason, so a later request starts clean.
  if (isOpen && !isPending) {
    setIsOpen(false);
    setReason('');
  }
  const isDenying = isOpen && isPending && onDeny !== undefined;
  const closeDenyForm = () => {
    setIsOpen(false);
    setReason('');
    requestFocus(() => denyRef.current);
  };
  const sendDenial = () => {
    const trimmed = reason.trim();
    closeDenyForm();
    onDeny?.(trimmed === '' ? undefined : trimmed);
  };
  const runKey = (event: KeyboardEvent<HTMLElement>): boolean => {
    if (isCommandEnter(event)) {
      if (isDenying) sendDenial();
      else if (onApprove) onApprove();
      else return false;
      return true;
    }
    if (event.key !== 'Escape' || !onDeny) return false;
    if (isDenying) closeDenyForm();
    else if (event.target === denyRef.current) return false;
    else denyRef.current?.focus();
    return true;
  };
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (!isPending || isComposingKey(event.nativeEvent) || !runKey(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };
  return {
    isDenying,
    reason,
    setReason,
    denyRef,
    openDenyForm: () => setIsOpen(true),
    closeDenyForm,
    sendDenial,
    onKeyDownCapture,
  };
}
