'use client';

// A tool call's approval: the request with its buttons and deny reason form, then the decision.

import { useId, useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Form } from '../form/form.js';
import { TextField } from '../text-field/text-field.js';
import { toolCallHooks as hooks } from './tool-call-hooks.js';
import type { ToolCallApprovalState } from './use-tool-call-approval.js';
import { isNode } from '../../utils/is-element.js';

/** The reader's decision on an approval: approved once, denied, or always allowed. */
export type ChatToolCallDecision = 'approved' | 'denied' | 'always';

/** How a tool call was, or is to be, approved. */
export interface ChatToolCallApproval {
  /** Names the scope of Always allow, such as `this conversation`. */
  scopeLabel?: string | undefined;
  /** The reader's decision, once made. */
  decision?: ChatToolCallDecision | undefined;
  /** The reader's reason for a denial. */
  reason?: string | undefined;
  /** The call ran without asking because it was always allowed. */
  isAutoApproved?: boolean | undefined;
}

interface ToolCallApprovalProps {
  /** The tool call's label, which the request names. */
  label: string;
  approval: ChatToolCallApproval | undefined;
  /** The call waits for a decision that has not been made. */
  isPending: boolean;
  state: ToolCallApprovalState;
  onApprove?: (() => void) | undefined;
  onDeny?: ((reason?: string) => void) | undefined;
  onAlwaysAllow?: (() => void) | undefined;
  /** Where focus goes when the approval leaves while it holds focus. */
  getFallbackFocus: () => HTMLElement | null;
}

type ActionsProps = Pick<
  ToolCallApprovalProps,
  'approval' | 'isPending' | 'state' | 'onApprove' | 'onDeny' | 'onAlwaysAllow'
>;

/**
 * Whether focus is inside the approval. Only a move to another element clears it: focus that
 * drops to the page because its element left keeps the resolved buttons, so it can return there.
 */
function useFocusWithin() {
  const [hasFocus, setHasFocus] = useState(false);
  return {
    hasFocus,
    onFocus: () => setHasFocus(true),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (isNode(next) && !event.currentTarget.contains(next)) setHasFocus(false);
    },
  };
}

/** Moves focus to the fallback when the approval leaves the page while it holds focus. */
function useFocusRescue(getFallbackFocus: () => HTMLElement | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef(getFallbackFocus);
  useLayoutEffect(() => {
    fallbackRef.current = getFallbackFocus;
  });
  useLayoutEffect(() => {
    const container = containerRef.current;
    return () => {
      if (container?.contains(container.ownerDocument.activeElement))
        fallbackRef.current()?.focus();
    };
  }, []);
  return containerRef;
}

/**
 * Approve, Deny and Always allow, each for its callback; `aria-disabled` once resolved. The
 * shortcuts stay published on resolved buttons, as on any disabled command, which keeps each
 * button's tooltip wrapper and so the focused element itself.
 */
function ApprovalActions({
  approval,
  isPending,
  state,
  onApprove,
  onDeny,
  onAlwaysAllow,
}: ActionsProps) {
  const strings = useUiStrings();
  const { denyRef, openDenyForm } = state;
  const common = {
    size: 'sm',
    className: hooks.slotClass('action'),
    isDisabled: !isPending,
    focusableWhenDisabled: true,
  } as const;
  return (
    <div {...hooks.slot('actions')}>
      {onApprove ? (
        <Button
          {...common}
          variant="primary"
          data-action="approve"
          shortcut="Ctrl+Enter"
          onPress={onApprove}
        >
          {strings.approve}
        </Button>
      ) : null}
      {onDeny ? (
        <Button
          {...common}
          ref={denyRef}
          data-action="deny"
          shortcut="Escape"
          onPress={openDenyForm}
        >
          {strings.toolCallDeny}
        </Button>
      ) : null}
      {onAlwaysAllow ? (
        <Button {...common} data-action="always" onPress={onAlwaysAllow}>
          {strings.toolCallAlwaysAllow(approval?.scopeLabel)}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * The optional reason for a denial, with Send and Cancel. Leaving while it holds focus, as when the
 * card shows another call, hands focus to Deny.
 */
function DenyForm({ state }: { state: ToolCallApprovalState }) {
  const strings = useUiStrings();
  const formRef = useRef<HTMLFormElement>(null);
  const { rescueFocus } = state;
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      if (form?.contains(form.ownerDocument.activeElement)) rescueFocus();
    };
  }, [rescueFocus]);
  return (
    <Form
      ref={formRef}
      className={hooks.slotClass('deny-form')}
      onSubmit={(event) => {
        event.preventDefault();
        state.sendDenial();
      }}
    >
      <TextField
        className={hooks.slotClass('reason')}
        label={strings.toolCallDenyReason}
        value={state.reason}
        onChange={state.setReason}
        autoFocus
      />
      <Button type="submit" size="sm" variant="danger">
        {strings.send}
      </Button>
      <Button size="sm" onPress={state.closeDenyForm}>
        {strings.cancel}
      </Button>
    </Form>
  );
}

/**
 * The approval: while pending, the request and its buttons (or the deny reason form); once
 * resolved, the decision in a status. Resolved buttons stay, `aria-disabled`, while focus is on
 * them, and focus moves to the fallback when the approval leaves while holding it.
 */
export function ToolCallApproval({ label, getFallbackFocus, ...props }: ToolCallApprovalProps) {
  const strings = useUiStrings();
  const { approval, isPending, state } = props;
  const promptId = useId();
  const decisionId = useId();
  const focus = useFocusWithin();
  const containerRef = useFocusRescue(getFallbackFocus);
  const decision = approval?.decision;
  const showsActions = isPending || focus.hasFocus;
  return (
    <div
      {...hooks.slot('approval', { decision })}
      ref={containerRef}
      role="group"
      aria-labelledby={isPending ? promptId : decisionId}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
    >
      {isPending ? (
        <p {...hooks.slot('prompt')} id={promptId}>
          {strings.toolCallApprovalPrompt(label)}
        </p>
      ) : null}
      {state.isDenying ? <DenyForm state={state} /> : null}
      {showsActions && !state.isDenying ? <ApprovalActions {...props} /> : null}
      <div {...hooks.slot('decision')} id={decisionId} role="status">
        {decision ? strings.toolCallDecision(decision, approval?.reason) : null}
      </div>
    </div>
  );
}
